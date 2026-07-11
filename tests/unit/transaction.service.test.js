const transactionService = require('../../src/services/transaction.service');
const Transaction = require('../../src/models/Transaction');
const CashLedger = require('../../src/models/CashLedger');
const inventoryService = require('../../src/services/inventory.service');
const customerRepository = require('../../src/repositories/customer.repository');
const supplierRepository = require('../../src/repositories/supplier.repository');
const mongoose = require('mongoose');

jest.mock('../../src/models/Transaction');
jest.mock('../../src/models/CashLedger');
jest.mock('../../src/services/inventory.service');
jest.mock('../../src/repositories/customer.repository');
jest.mock('../../src/repositories/supplier.repository');

describe('Transaction Service - AP/AR Logic', () => {
    let mockSession;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSession = {
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn(),
        };
        jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
    });

    it('should logically increase customer outstandingBalance for a CREDIT SALE', async () => {
        const tenantId = new mongoose.Types.ObjectId().toString();
        const storeId = new mongoose.Types.ObjectId().toString();
        const userId = new mongoose.Types.ObjectId().toString();
        const customerId = new mongoose.Types.ObjectId().toString();

        Transaction.prototype.save = jest.fn().mockResolvedValue(true);
        inventoryService.updateStock.mockResolvedValue(true);

        const transactionData = {
            storeId,
            type: 'SALE',
            items: [],
            total: 1500,
            paymentMethod: 'CREDIT',
            customerId
        };

        await transactionService.createTransaction(transactionData, tenantId, userId);

        expect(customerRepository.updateBalance).toHaveBeenCalledWith(tenantId, customerId, 1500, mockSession);
        expect(supplierRepository.updateBalance).not.toHaveBeenCalled();
        expect(CashLedger.prototype.save).not.toHaveBeenCalled(); // No cash exchange on pure credit
    });

    it('should logically increase supplier payableBalance for a CREDIT PURCHASE', async () => {
        const tenantId = new mongoose.Types.ObjectId().toString();
        const storeId = new mongoose.Types.ObjectId().toString();
        const userId = new mongoose.Types.ObjectId().toString();
        const supplierId = new mongoose.Types.ObjectId().toString();

        Transaction.prototype.save = jest.fn().mockResolvedValue(true);
        inventoryService.updateStock.mockResolvedValue(true);

        const transactionData = {
            storeId,
            type: 'PURCHASE',
            items: [],
            total: 2000,
            paymentMethod: 'CREDIT',
            supplierId
        };

        await transactionService.createTransaction(transactionData, tenantId, userId);

        expect(supplierRepository.updateBalance).toHaveBeenCalledWith(tenantId, supplierId, 2000, mockSession);
        expect(customerRepository.updateBalance).not.toHaveBeenCalled();
        expect(CashLedger.prototype.save).not.toHaveBeenCalled();
    });
});
