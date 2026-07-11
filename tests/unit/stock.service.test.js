const stockService = require('../../src/services/stock.service');
const Stock = require('../../src/models/Stock');
const StockMovement = require('../../src/models/StockMovement');
const Item = require('../../src/models/Item');

jest.mock('../../src/models/Stock');
jest.mock('../../src/models/StockMovement');
jest.mock('../../src/models/Item');

describe('StockService', () => {
    const tenantId = 'tenant123';
    const storeId = 'store123';
    const itemId = 'item123';
    const userId = 'user123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getOrCreateStock', () => {
        it('should return existing stock if found', async () => {
            const mockStock = { _id: 'stock123', storeId, itemId, quantity: 10 };
            Stock.findOne.mockResolvedValue(mockStock);

            const result = await stockService.getOrCreateStock(tenantId, storeId, itemId);

            expect(Stock.findOne).toHaveBeenCalledWith({ storeId, itemId });
            expect(result).toEqual(mockStock);
        });

        it('should create new stock if not found', async () => {
            Stock.findOne.mockResolvedValue(null);
            const mockNewStock = { _id: 'stock123', tenantId, storeId, itemId, quantity: 0 };
            Stock.create.mockResolvedValue(mockNewStock);

            const result = await stockService.getOrCreateStock(tenantId, storeId, itemId);

            expect(Stock.create).toHaveBeenCalledWith({
                tenantId,
                storeId,
                itemId,
                quantity: 0
            });
            expect(result).toEqual(mockNewStock);
        });
    });

    describe('updateStock', () => {
        it('should increase stock quantity for IN movement', async () => {
            const mockStock = {
                _id: 'stock123',
                quantity: 10,
                save: jest.fn().mockResolvedValue(true)
            };
            
            Stock.findOne.mockResolvedValue(mockStock);
            StockMovement.create.mockResolvedValue({});

            const result = await stockService.updateStock(
                tenantId,
                storeId,
                itemId,
                5,
                'IN',
                userId
            );

            expect(mockStock.quantity).toBe(15);
            expect(mockStock.save).toHaveBeenCalled();
            expect(StockMovement.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'IN',
                    quantity: 5,
                    previousQuantity: 10,
                    newQuantity: 15
                })
            );
        });

        it('should decrease stock quantity for OUT movement', async () => {
            const mockStock = {
                _id: 'stock123',
                quantity: 10,
                save: jest.fn().mockResolvedValue(true)
            };
            
            Stock.findOne.mockResolvedValue(mockStock);
            StockMovement.create.mockResolvedValue({});

            const result = await stockService.updateStock(
                tenantId,
                storeId,
                itemId,
                -5,
                'OUT',
                userId
            );

            expect(mockStock.quantity).toBe(5);
            expect(mockStock.save).toHaveBeenCalled();
        });

        it('should throw error if insufficient stock', async () => {
            const mockStock = {
                _id: 'stock123',
                quantity: 3,
                save: jest.fn()
            };
            
            Stock.findOne.mockResolvedValue(mockStock);
            Item.findById.mockResolvedValue({ name: 'Test Item' });

            await expect(
                stockService.updateStock(tenantId, storeId, itemId, -5, 'OUT', userId)
            ).rejects.toThrow('Insufficient stock');

            expect(mockStock.save).not.toHaveBeenCalled();
        });
    });

    describe('adjustStock', () => {
        it('should adjust stock to new quantity', async () => {
            const mockStock = {
                _id: 'stock123',
                quantity: 10,
                save: jest.fn().mockResolvedValue(true)
            };
            
            Stock.findOne.mockResolvedValue(mockStock);
            StockMovement.create.mockResolvedValue({});

            await stockService.adjustStock(
                tenantId,
                storeId,
                itemId,
                15,
                'Inventory count adjustment',
                userId
            );

            expect(mockStock.quantity).toBe(15);
            expect(StockMovement.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'ADJUSTMENT',
                    quantity: 5,
                    reason: 'Inventory count adjustment'
                })
            );
        });
    });

    describe('transferStock', () => {
        it('should transfer stock between stores', async () => {
            const mockStockFrom = {
                _id: 'stock1',
                quantity: 20,
                save: jest.fn().mockResolvedValue(true)
            };
            
            const mockStockTo = {
                _id: 'stock2',
                quantity: 5,
                save: jest.fn().mockResolvedValue(true)
            };
            
            Stock.findOne
                .mockResolvedValueOnce(mockStockFrom)
                .mockResolvedValueOnce(mockStockTo);
            
            StockMovement.create.mockResolvedValue({});

            const result = await stockService.transferStock(
                tenantId,
                'store1',
                'store2',
                itemId,
                10,
                userId,
                'Transfer for restocking'
            );

            expect(mockStockFrom.quantity).toBe(10);
            expect(mockStockTo.quantity).toBe(15);
            expect(result.success).toBe(true);
            expect(StockMovement.create).toHaveBeenCalledTimes(2);
        });
    });
});
