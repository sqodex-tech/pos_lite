const customerService = require('../../src/services/customer.service');
const customerRepository = require('../../src/repositories/customer.repository');
const CashLedger = require('../../src/models/CashLedger');
const mongoose = require('mongoose');

jest.mock('../../src/repositories/customer.repository');
jest.mock('../../src/models/CashLedger');

describe('Customer Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('recordPayment', () => {
        it('should decrease customer balance and create a CashLedger entry', async () => {
            const tenantId = new mongoose.Types.ObjectId().toString();
            const storeId = new mongoose.Types.ObjectId().toString();
            const userId = new mongoose.Types.ObjectId().toString();
            const customerId = new mongoose.Types.ObjectId().toString();

            const mockSession = {
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn(),
            };

            jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);

            customerRepository.findById.mockResolvedValueOnce({
                _id: customerId,
                name: 'Test Customer',
                outstandingBalance: 100
            });

            customerRepository.updateBalance.mockResolvedValueOnce(true);

            CashLedger.prototype.save = jest.fn().mockResolvedValue(true);

            customerRepository.findById.mockResolvedValueOnce({
                _id: customerId,
                name: 'Test Customer',
                outstandingBalance: 50 // Balance after payment
            });

            const paymentData = {
                amount: 50,
                paymentMethod: 'CASH',
                description: 'Payment'
            };

            const result = await customerService.recordPayment(tenantId, storeId, userId, customerId, paymentData);

            expect(mongoose.startSession).toHaveBeenCalled();
            expect(mockSession.startTransaction).toHaveBeenCalled();
            expect(customerRepository.updateBalance).toHaveBeenCalledWith(tenantId, customerId, -50, mockSession);
            expect(CashLedger.prototype.save).toHaveBeenCalledWith({ session: mockSession });
            expect(mockSession.commitTransaction).toHaveBeenCalled();
            expect(result.outstandingBalance).toBe(50);
        });

        it('should rollback transaction if customer not found', async () => {
            const tenantId = new mongoose.Types.ObjectId().toString();
            const storeId = new mongoose.Types.ObjectId().toString();
            const userId = new mongoose.Types.ObjectId().toString();
            const customerId = new mongoose.Types.ObjectId().toString();

            const mockSession = {
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn(),
            };

            jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);

            customerRepository.findById.mockResolvedValueOnce(null); // Customer not found

            const paymentData = {
                amount: 50,
                paymentMethod: 'CASH',
                description: 'Payment'
            };

            await expect(customerService.recordPayment(tenantId, storeId, userId, customerId, paymentData))
                .rejects.toThrow('Customer not found');

            expect(mockSession.startTransaction).toHaveBeenCalled();
            expect(customerRepository.updateBalance).not.toHaveBeenCalled();
            expect(mockSession.abortTransaction).toHaveBeenCalled();
        });
    });
});
