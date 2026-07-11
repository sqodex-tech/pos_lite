const storeService = require('../../src/services/store.service');
const storeRepository = require('../../src/repositories/store.repository');
const Subscription = require('../../src/models/Subscription');
const Tenant = require('../../src/models/Tenant');
const mongoose = require('mongoose');

jest.mock('../../src/repositories/store.repository');
jest.mock('../../src/models/Subscription');
jest.mock('../../src/models/Tenant');

describe('Store Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const tenantId = new mongoose.Types.ObjectId().toString();

    describe('createStore', () => {
        it('should create a store when under plan branch limit', async () => {
            const storeData = { name: 'Main Store', code: 'STORE001', address: '123 Main St' };
            const mockStore = { _id: 'store1', ...storeData, tenantId };

            // Mock tenant lookup
            Tenant.findById.mockResolvedValue({ _id: tenantId, name: 'Test Tenant' });

            // Mock subscription with maxBranches limit
            Subscription.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue({
                    limitsSnapshot: { maxBranches: 5 },
                    planId: { name: 'Pro Plan', maxBranches: 5 }
                })
            });

            // Mock current store count of 2
            storeRepository.countByTenant.mockResolvedValue(2);
            storeRepository.create.mockResolvedValue(mockStore);

            const result = await storeService.createStore(tenantId, storeData);

            expect(storeRepository.create).toHaveBeenCalledWith({ ...storeData, tenantId });
            expect(result).toEqual(mockStore);
        });

        it('should enforce default limit of 1 when no active subscription exists', async () => {
            const storeData = { name: 'Main Store', code: 'STORE002', address: '123 Main St' };

            // Mock tenant lookup
            Tenant.findById.mockResolvedValue({ _id: tenantId, name: 'Test Tenant' });

            // Mock no subscription
            Subscription.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            await expect(storeService.createStore(tenantId, storeData))
                .rejects.toThrow('No Active Subscription! Please subscribe to a plan to create stores.');

            expect(storeRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when plan branch limit is reached', async () => {
            const storeData = { name: 'Main Store', code: 'STORE003', address: '123 Main St' };

            // Mock tenant lookup
            Tenant.findById.mockResolvedValue({ _id: tenantId, name: 'Test Tenant' });

            // Mock subscription with maxBranches limit of 3
            Subscription.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue({
                    limitsSnapshot: { maxBranches: 3 },
                    planId: { name: 'Basic Plan', maxBranches: 3 }
                })
            });

            // Mock current store count of 3 (hitting the limit)
            storeRepository.countByTenant.mockResolvedValue(3);

            await expect(storeService.createStore(tenantId, storeData))
                .rejects.toThrow('Store Limit Reached! You have 3 of 3 store(s) allowed on your Basic Plan');

            expect(storeRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('getStores', () => {
        it('should fetch stores with pagination options', async () => {
            const options = { page: 1, limit: 10 };
            const mockResult = {
                stores: [{ _id: 'store1', name: 'Store A' }],
                total: 1,
                page: 1,
                limit: 10
            };

            storeRepository.findByTenant.mockResolvedValue(mockResult);

            const result = await storeService.getStores(tenantId, options);

            expect(storeRepository.findByTenant).toHaveBeenCalledWith(tenantId, options);
            expect(result).toEqual(mockResult);
        });

        it('should forward search option to repository', async () => {
            const options = { page: 1, limit: 20, search: 'Main' };

            storeRepository.findByTenant.mockResolvedValue({
                stores: [], total: 0, page: 1, limit: 20
            });

            await storeService.getStores(tenantId, options);

            expect(storeRepository.findByTenant).toHaveBeenCalledWith(tenantId, options);
        });
    });

    describe('getStoreById', () => {
        it('should return store when found', async () => {
            const storeId = new mongoose.Types.ObjectId().toString();
            const mockStore = { _id: storeId, name: 'Test Store', tenantId };

            storeRepository.findById.mockResolvedValue(mockStore);

            const result = await storeService.getStoreById(tenantId, storeId);

            expect(storeRepository.findById).toHaveBeenCalledWith(tenantId, storeId);
            expect(result).toEqual(mockStore);
        });

        it('should throw 404 when store not found', async () => {
            const storeId = new mongoose.Types.ObjectId().toString();

            storeRepository.findById.mockResolvedValue(null);

            await expect(storeService.getStoreById(tenantId, storeId))
                .rejects.toThrow('Store not found');
        });
    });

    describe('updateStore', () => {
        it('should update and return the store', async () => {
            const storeId = new mongoose.Types.ObjectId().toString();
            const updateData = { name: 'Updated Store' };
            const mockStore = { _id: storeId, name: 'Updated Store', tenantId };

            storeRepository.update.mockResolvedValue(mockStore);

            const result = await storeService.updateStore(tenantId, storeId, updateData);

            expect(storeRepository.update).toHaveBeenCalledWith(tenantId, storeId, updateData);
            expect(result).toEqual(mockStore);
        });

        it('should throw 404 when store not found for update', async () => {
            const storeId = new mongoose.Types.ObjectId().toString();

            storeRepository.update.mockResolvedValue(null);

            await expect(storeService.updateStore(tenantId, storeId, { name: 'X' }))
                .rejects.toThrow('Store not found');
        });
    });

    describe('deleteStore', () => {
        it('should soft-delete and return the store', async () => {
            const storeId = new mongoose.Types.ObjectId().toString();
            const mockStore = { _id: storeId, tenantId, deletedAt: new Date(), status: 'inactive' };

            storeRepository.delete.mockResolvedValue(mockStore);

            const result = await storeService.deleteStore(tenantId, storeId);

            expect(storeRepository.delete).toHaveBeenCalledWith(tenantId, storeId);
            expect(result).toEqual(mockStore);
        });

        it('should throw 404 when store not found for delete', async () => {
            const storeId = new mongoose.Types.ObjectId().toString();

            storeRepository.delete.mockResolvedValue(null);

            await expect(storeService.deleteStore(tenantId, storeId))
                .rejects.toThrow('Store not found');
        });
    });
});
