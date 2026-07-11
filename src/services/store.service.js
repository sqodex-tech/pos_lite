const storeRepository = require('../repositories/store.repository');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/prisma');

class StoreService {
    async createStore(tenantId, storeData) {
        // Check subscription limits
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            throw new ApiError(404, 'Tenant not found');
        }

        // Get active subscription
        const activeSubscription = await prisma.subscription.findFirst({
            where: {
                tenantId: tenantId,
                status: 'active',
                endDate: { gte: new Date() }
            },
            include: { plan: true }
        });

        if (!activeSubscription) {
            throw new ApiError(403, '⚠️ No Active Subscription! Please subscribe to a plan to create stores.');
        }

        // Check current store count
        const currentStoreCount = await storeRepository.countByTenant(tenantId);
        
        // Handle JSON limitsSnapshot
        const limitsSnapshot = activeSubscription.limitsSnapshot || {};
        const maxBranches = limitsSnapshot.maxBranches ?? 
                           activeSubscription.plan?.maxBranches ?? 1;

        if (currentStoreCount >= maxBranches) {
            const planName = activeSubscription.plan?.name || 'current plan';
            throw new ApiError(403, `🏪 Store Limit Reached! You have ${currentStoreCount} of ${maxBranches} store(s) allowed on your ${planName}. Please upgrade to add more stores.`);
        }

        return await storeRepository.create({ ...storeData, tenantId });
    }

    async getStores(tenantId, options) {
        return await storeRepository.findByTenant(tenantId, options);
    }

    async getStoreById(tenantId, storeId) {
        const store = await storeRepository.findById(tenantId, storeId);
        if (!store) throw new ApiError(404, 'Store not found');
        return store;
    }

    async updateStore(tenantId, storeId, updateData) {
        const store = await storeRepository.update(tenantId, storeId, updateData);
        if (!store) throw new ApiError(404, 'Store not found');
        return store;
    }

    async deleteStore(tenantId, storeId) {
        const store = await storeRepository.delete(tenantId, storeId);
        if (!store) throw new ApiError(404, 'Store not found');
        return store;
    }
}

module.exports = new StoreService();
