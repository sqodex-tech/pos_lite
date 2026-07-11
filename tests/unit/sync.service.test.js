const mongoose = require('mongoose');
const syncService = require('../../src/services/sync.service');
const Category = require('../../src/models/Category');
const Unit = require('../../src/models/Unit');
const Item = require('../../src/models/Item');
const Stock = require('../../src/models/Stock');
const Store = require('../../src/models/Store');
const User = require('../../src/models/User');
const ApiError = require('../../src/utils/ApiError');

// Mock dependencies
jest.mock('../../src/models/Category');
jest.mock('../../src/models/Unit');
jest.mock('../../src/models/Item');
jest.mock('../../src/models/Stock');
jest.mock('../../src/models/Store');
jest.mock('../../src/models/User');
jest.mock('../../src/utils/logger');

describe('SyncService', () => {
    const tenantId = new mongoose.Types.ObjectId();
    const storeId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();
    const unitId = new mongoose.Types.ObjectId();
    const itemId = new mongoose.Types.ObjectId();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('validateItemReferences', () => {
        it('should validate all references successfully', async () => {
            const mockSession = {
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            const mockStore = {
                _id: storeId,
                tenantId,
                status: 'active',
                deletedAt: null
            };

            const mockCategory = {
                _id: categoryId,
                tenantId,
                storeId,
                status: 'active',
                deletedAt: null
            };

            const mockUnit = {
                _id: unitId,
                tenantId,
                storeId,
                status: 'active',
                deletedAt: null
            };

            Store.findOne = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue(mockStore)
            });

            Category.findOne = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue(mockCategory)
            });

            Unit.findOne = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue(mockUnit)
            });

            const result = await syncService.validateItemReferences(
                tenantId,
                storeId,
                { categoryId, unitId }
            );

            expect(result.isValid).toBe(true);
            expect(result.store).toEqual(mockStore);
            expect(result.category).toEqual(mockCategory);
            expect(result.unit).toEqual(mockUnit);
            expect(mockSession.commitTransaction).toHaveBeenCalled();
        });

        it('should throw error if store not found', async () => {
            const mockSession = {
                startTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Store.findOne = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue(null)
            });

            await expect(
                syncService.validateItemReferences(tenantId, storeId, { categoryId, unitId })
            ).rejects.toThrow('Store not found or inactive');

            expect(mockSession.abortTransaction).toHaveBeenCalled();
        });

        it('should throw error if category is inactive or does not belong to store', async () => {
            const mockSession = {
                startTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Store.findOne = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue({ _id: storeId, tenantId })
            });

            Category.findOne = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue(null)
            });

            await expect(
                syncService.validateItemReferences(tenantId, storeId, { categoryId, unitId })
            ).rejects.toThrow('Category not found, deleted, inactive, or does not belong to this store');
        });
    });

    describe('syncItemsOnCategoryUpdate', () => {
        it('should prevent category deactivation if items exist in store', async () => {
            const mockSession = {
                startTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Category.findOne = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue({
                    _id: categoryId,
                    tenantId,
                    storeId,
                    deletedAt: null
                })
            });

            Item.countDocuments = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue(5)
            });

            await expect(
                syncService.syncItemsOnCategoryUpdate(tenantId, storeId, categoryId, { status: 'inactive' })
            ).rejects.toThrow('Cannot deactivate/delete category. It is used by 5 item(s) in this store');

            expect(mockSession.abortTransaction).toHaveBeenCalled();
        });

        it('should allow category update if no items exist in store', async () => {
            const mockSession = {
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Category.findOne = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue({
                    _id: categoryId,
                    tenantId,
                    storeId,
                    deletedAt: null
                })
            });

            Item.countDocuments = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue(0)
            });

            const result = await syncService.syncItemsOnCategoryUpdate(
                tenantId,
                storeId,
                categoryId,
                { status: 'inactive' }
            );

            expect(result.synced).toBe(true);
            expect(mockSession.commitTransaction).toHaveBeenCalled();
        });
    });

    describe('syncItemsOnUnitUpdate', () => {
        it('should prevent unit deactivation if items exist in store', async () => {
            const mockSession = {
                startTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Unit.findOne = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue({
                    _id: unitId,
                    tenantId,
                    storeId,
                    deletedAt: null
                })
            });

            Item.countDocuments = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue(3)
            });

            await expect(
                syncService.syncItemsOnUnitUpdate(tenantId, storeId, unitId, { status: 'inactive' })
            ).rejects.toThrow('Cannot deactivate/delete unit. It is used by 3 item(s) in this store');

            expect(mockSession.abortTransaction).toHaveBeenCalled();
        });

        it('should allow unit update if no items exist in store', async () => {
            const mockSession = {
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Unit.findOne = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue({
                    _id: unitId,
                    tenantId,
                    storeId,
                    deletedAt: null
                })
            });

            Item.countDocuments = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue(0)
            });

            const result = await syncService.syncItemsOnUnitUpdate(
                tenantId,
                storeId,
                unitId,
                { status: 'inactive' }
            );

            expect(result.synced).toBe(true);
            expect(mockSession.commitTransaction).toHaveBeenCalled();
        });
    });

    describe('validateStoreIsolation', () => {
        it('should allow SUPER_ADMIN access to any store', async () => {
            User.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({
                    _id: userId,
                    role: 'SUPER_ADMIN',
                    tenantId
                })
            });

            const result = await syncService.validateStoreIsolation(tenantId, storeId, userId);

            expect(result.hasAccess).toBe(true);
            expect(result.role).toBe('SUPER_ADMIN');
        });

        it('should allow ADMIN access to stores in their tenant', async () => {
            User.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({
                    _id: userId,
                    role: 'ADMIN',
                    tenantId
                })
            });

            Store.findOne = jest.fn().mockResolvedValue({
                _id: storeId,
                tenantId,
                deletedAt: null
            });

            const result = await syncService.validateStoreIsolation(tenantId, storeId, userId);

            expect(result.hasAccess).toBe(true);
            expect(result.role).toBe('ADMIN');
        });

        it('should deny access if user not assigned to store', async () => {
            User.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({
                    _id: userId,
                    role: 'STORE_MANAGER',
                    tenantId,
                    storeIds: [new mongoose.Types.ObjectId().toString()] // Different store
                })
            });

            await expect(
                syncService.validateStoreIsolation(tenantId, storeId, userId)
            ).rejects.toThrow('Access denied: User is not assigned to this store');
        });

        it('should deny access if user from different tenant', async () => {
            const differentTenantId = new mongoose.Types.ObjectId();

            User.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({
                    _id: userId,
                    role: 'ADMIN',
                    tenantId: differentTenantId
                })
            });

            await expect(
                syncService.validateStoreIsolation(tenantId, storeId, userId)
            ).rejects.toThrow('Access denied: User does not belong to this tenant');
        });
    });

    describe('syncStockOnItemCreate', () => {
        it('should create stock record for new item', async () => {
            const mockSession = {
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Stock.findOne = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue(null)
            });

            Stock.prototype.save = jest.fn().mockResolvedValue(true);

            const result = await syncService.syncStockOnItemCreate(
                tenantId,
                storeId,
                itemId,
                userId
            );

            expect(result.synced).toBe(true);
            expect(mockSession.commitTransaction).toHaveBeenCalled();
        });

        it('should not create duplicate stock record', async () => {
            const mockSession = {
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Stock.findOne = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue({
                    storeId,
                    itemId,
                    quantity: 10
                })
            });

            const result = await syncService.syncStockOnItemCreate(
                tenantId,
                storeId,
                itemId,
                userId
            );

            expect(result.synced).toBe(true);
            expect(mockSession.commitTransaction).toHaveBeenCalled();
        });
    });

    describe('validateItemDeletion', () => {
        it('should prevent deletion if item has stock', async () => {
            const mockSession = {
                startTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Stock.findOne = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue({
                    storeId,
                    itemId,
                    quantity: 50
                })
            });

            await expect(
                syncService.validateItemDeletion(tenantId, storeId, itemId)
            ).rejects.toThrow('Cannot delete item. Current stock: 50');

            expect(mockSession.abortTransaction).toHaveBeenCalled();
        });

        it('should allow deletion if no stock and no transactions', async () => {
            const mockSession = {
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Stock.findOne = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue(null)
            });

            const Transaction = require('../../src/models/Transaction');
            Transaction.countDocuments = jest.fn().mockReturnValue({
                session: jest.fn().mockResolvedValue(0)
            });

            const result = await syncService.validateItemDeletion(tenantId, storeId, itemId);

            expect(result.canDelete).toBe(true);
            expect(mockSession.commitTransaction).toHaveBeenCalled();
        });
    });

    describe('verifyDataIntegrity', () => {
        it('should detect items with invalid category references', async () => {
            Category.aggregate = jest.fn().mockResolvedValue([]);
            Unit.aggregate = jest.fn().mockResolvedValue([]);
            Item.aggregate = jest.fn()
                .mockResolvedValueOnce([
                    { _id: itemId, categoryId, category: [] }
                ])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            const result = await syncService.verifyDataIntegrity(tenantId, storeId);

            expect(result.isValid).toBe(false);
            expect(result.issues.length).toBeGreaterThan(0);
            expect(result.issues[0].type).toBe('INVALID_CATEGORY_REFERENCE');
        });

        it('should detect categories with invalid parent references', async () => {
            Item.aggregate = jest.fn()
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);
            
            Category.aggregate = jest.fn().mockResolvedValue([
                { _id: categoryId, parentId: new mongoose.Types.ObjectId(), parent: [] }
            ]);
            
            Unit.aggregate = jest.fn().mockResolvedValue([]);

            const result = await syncService.verifyDataIntegrity(tenantId, storeId);

            expect(result.isValid).toBe(false);
            expect(result.issues.length).toBeGreaterThan(0);
            expect(result.issues[0].type).toBe('INVALID_CATEGORY_PARENT');
        });

        it('should detect units with invalid base unit references', async () => {
            Item.aggregate = jest.fn()
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);
            
            Category.aggregate = jest.fn().mockResolvedValue([]);
            
            Unit.aggregate = jest.fn().mockResolvedValue([
                { _id: unitId, baseUnit: new mongoose.Types.ObjectId(), base: [] }
            ]);

            const result = await syncService.verifyDataIntegrity(tenantId, storeId);

            expect(result.isValid).toBe(false);
            expect(result.issues.length).toBeGreaterThan(0);
            expect(result.issues[0].type).toBe('INVALID_UNIT_BASE');
        });

        it('should return valid if no issues found', async () => {
            Item.aggregate = jest.fn()
                .mockResolvedValueOnce([]) // No invalid categories
                .mockResolvedValueOnce([]) // No invalid units
                .mockResolvedValueOnce([]); // No missing stock
            
            Category.aggregate = jest.fn().mockResolvedValue([]);
            Unit.aggregate = jest.fn().mockResolvedValue([]);

            const result = await syncService.verifyDataIntegrity(tenantId, storeId);

            expect(result.isValid).toBe(true);
            expect(result.issues.length).toBe(0);
        });
    });
});
