const prisma = require('../config/prisma');
const admin = require('../config/firebase');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// PLAN CRUD
// ─────────────────────────────────────────────

exports.getPlans = async (req, res, next) => {
    try {
        const plans = await prisma.plan.findMany({ orderBy: { price: 'asc' } });
        res.status(200).json(new ApiResponse(200, plans, 'Plans retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

exports.createPlan = async (req, res, next) => {
    try {
        const { name, price, maxUsers, maxItems, maxBranches, features, durationInDays, isTrialPlan } = req.body;

        const existing = await prisma.plan.findUnique({ where: { name } });
        if (existing) return res.status(409).json(new ApiResponse(409, null, 'Plan with this name already exists'));

        if (isTrialPlan === true && price > 0) {
            return res.status(400).json(new ApiResponse(400, null, 'Trial plans must have price = 0'));
        }

        const plan = await prisma.plan.create({
            data: {
                name,
                price,
                isTrialPlan: !!isTrialPlan,
                maxUsers,
                maxItems,
                maxBranches,
                features: features ? JSON.stringify(features) : null,
                durationInDays
            }
        });
        logger.info(`Plan created: ${plan.name} ($${plan.price})`);
        res.status(201).json(new ApiResponse(201, plan, 'Plan created successfully'));
    } catch (error) {
        next(error);
    }
};

exports.updatePlan = async (req, res, next) => {
    try {
        if (req.body.features) req.body.features = JSON.stringify(req.body.features);
        const plan = await prisma.plan.update({
            where: { id: req.params.planId },
            data: req.body
        });
        logger.info(`Plan updated: ${plan.name}`);
        res.status(200).json(new ApiResponse(200, plan, 'Plan updated successfully'));
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json(new ApiResponse(404, null, 'Plan not found'));
        next(error);
    }
};

exports.deletePlan = async (req, res, next) => {
    try {
        const activeTenants = await prisma.tenant.count({
            where: { subscriptionPlanId: req.params.planId, status: 'active' }
        });
        if (activeTenants > 0) {
            return res.status(400).json(new ApiResponse(400, null, `Cannot delete plan — ${activeTenants} active tenant(s) are using it`));
        }

        const plan = await prisma.plan.delete({ where: { id: req.params.planId } });
        logger.info(`Plan deleted: ${plan.name}`);
        res.status(200).json(new ApiResponse(200, null, 'Plan deleted successfully'));
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json(new ApiResponse(404, null, 'Plan not found'));
        next(error);
    }
};

// ─────────────────────────────────────────────
// TENANT CRUD
// ─────────────────────────────────────────────

exports.createTenant = async (req, res, next) => {
    try {
        const { name, email, phone, address, planId, password, adminName } = req.body;

        const existingTenant = await prisma.tenant.findUnique({ where: { email } });
        if (existingTenant) {
            return res.status(409).json(new ApiResponse(409, null, 'Tenant with this email already exists'));
        }

        const resolvedPlanId = planId && planId.trim() !== '' ? planId : undefined;
        let plan = null;
        let nextBillingDate = null;

        if (resolvedPlanId) {
            plan = await prisma.plan.findUnique({ where: { id: resolvedPlanId } });
            if (!plan) return res.status(404).json(new ApiResponse(404, null, 'Subscription plan not found'));
            nextBillingDate = new Date();
            nextBillingDate.setDate(nextBillingDate.getDate() + (plan.durationInDays || 30));
        }

        const tenantData = { name, email, phone, address, status: 'active' };
        if (resolvedPlanId) {
            tenantData.subscriptionPlanId = resolvedPlanId;
            tenantData.subscriptionStart = new Date();
            tenantData.nextBillingDate = nextBillingDate;
        }

        // Check user existence
        if (password) {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) throw new ApiError(409, 'A user with this email already exists.');
        }

        // Firebase Auth Creation
        let firebaseRecord;
        if (password) {
            try {
                firebaseRecord = await admin.auth().createUser({ email, password, displayName: adminName || name });
            } catch (fbError) {
                throw new ApiError(400, fbError.message);
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({ data: tenantData });
            let adminUser = null;
            if (password) {
                adminUser = await tx.user.create({
                    data: {
                        firebaseUid: firebaseRecord.uid,
                        name: adminName || name,
                        email,
                        role: 'ADMIN',
                        tenantId: tenant.id
                    }
                });
            }
            return { tenant, adminUser };
        });

        const message = password
            ? 'Tenant and admin account created. Use /auth/login to sign in.'
            : resolvedPlanId
                ? 'Tenant created. Use /subscriptions/tenant/:id/activate to activate subscription.'
                : 'Tenant created. Assign a plan and create an admin user to complete setup.';

        logger.info(`New tenant created: ${result.tenant.name} (${result.tenant.id})`);
        res.status(201).json(new ApiResponse(201, result.adminUser ? result : result.tenant, message));
    } catch (error) {
        next(error);
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) return res.status(404).json(new ApiResponse(404, null, 'Tenant profile not found'));

        let plan = null;
        if (tenant.subscriptionPlanId) {
            plan = await prisma.plan.findUnique({ where: { id: tenant.subscriptionPlanId }});
            tenant.plan = plan;
        }

        res.status(200).json(new ApiResponse(200, tenant, 'Profile retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const { name, email, phone, address } = req.body;
        const update = {};

        if (name) update.name = name;
        if (email) update.email = email;
        if (phone) update.phone = phone;
        if (address) update.address = address;

        const tenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: update
        });

        logger.info(`Tenant profile updated: ${tenant.name} (${tenant.id})`);
        res.status(200).json(new ApiResponse(200, tenant, 'Profile updated successfully'));
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json(new ApiResponse(404, null, 'Tenant profile not found'));
        next(error);
    }
};

exports.getAllTenants = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const where = {};
        if (status) where.status = status;
        if (search) where.name = { contains: search };

        const tenants = await prisma.tenant.findMany({
            where,
            take: Number(limit),
            skip: (Number(page) - 1) * Number(limit),
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.tenant.count({ where });

        res.status(200).json(new ApiResponse(200, tenants, 'Tenants retrieved successfully', {
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total
            }
        }));
    } catch (error) {
        next(error);
    }
};

exports.getTenantById = async (req, res, next) => {
    try {
        const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
        if (!tenant) return res.status(404).json(new ApiResponse(404, null, 'Tenant not found'));
        res.status(200).json(new ApiResponse(200, tenant, 'Tenant retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

exports.updateTenant = async (req, res, next) => {
    try {
        const { name, email, phone, address, planId } = req.body;
        const update = {};

        if (name) update.name = name;
        if (email) update.email = email;
        if (phone) update.phone = phone;
        if (address) update.address = address;

        if (planId) {
            const plan = await prisma.plan.findUnique({ where: { id: planId } });
            if (!plan) return res.status(404).json(new ApiResponse(404, null, 'Plan not found'));
            update.subscriptionPlanId = planId;
            const nextBillingDate = new Date();
            nextBillingDate.setDate(nextBillingDate.getDate() + plan.durationInDays);
            update.nextBillingDate = nextBillingDate;
        }

        const tenant = await prisma.tenant.update({
            where: { id: req.params.id },
            data: update
        });

        logger.info(`Tenant updated: ${tenant.name} (${tenant.id})`);
        res.status(200).json(new ApiResponse(200, tenant, 'Tenant updated successfully'));
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json(new ApiResponse(404, null, 'Tenant not found'));
        next(error);
    }
};

exports.updateTenantStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['active', 'suspended'].includes(status)) {
            return res.status(400).json(new ApiResponse(400, null, 'Invalid status'));
        }

        const tenant = await prisma.tenant.update({
            where: { id: req.params.id },
            data: { status }
        });

        logger.info(`Tenant ${tenant.name} (${tenant.id}) status updated to ${status}`);
        res.status(200).json(new ApiResponse(200, tenant, 'Tenant status updated successfully'));
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json(new ApiResponse(404, null, 'Tenant not found'));
        next(error);
    }
};

exports.deleteTenant = async (req, res, next) => {
    try {
        const tenant = await prisma.tenant.delete({ where: { id: req.params.id } });
        await prisma.billingHistory.deleteMany({ where: { tenantId: req.params.id } });

        logger.info(`Tenant deleted: ${tenant.name} (${tenant.id})`);
        res.status(200).json(new ApiResponse(200, null, 'Tenant deleted successfully'));
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json(new ApiResponse(404, null, 'Tenant not found'));
        next(error);
    }
};

// ─────────────────────────────────────────────
// BILLING HISTORY
// ─────────────────────────────────────────────

exports.getBillingHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const where = { tenantId: req.params.id };
        if (status) where.status = status;

        const history = await prisma.billingHistory.findMany({
            where,
            orderBy: { billingDate: 'desc' },
            take: Number(limit),
            skip: (Number(page) - 1) * Number(limit)
        });

        const total = await prisma.billingHistory.count({ where });

        res.status(200).json(new ApiResponse(200, history, 'Billing history retrieved successfully', {
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total
            }
        }));
    } catch (error) {
        next(error);
    }
};

exports.createBillingRecord = async (req, res, next) => {
    try {
        const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
        if (!tenant) return res.status(404).json(new ApiResponse(404, null, 'Tenant not found'));

        const { amount, currency, status, paymentMethod, invoiceUrl, billingDate, description } = req.body;

        const record = await prisma.billingHistory.create({
            data: {
                tenantId: req.params.id,
                amount,
                currency,
                status: status || 'pending',
                paymentMethod,
                invoiceUrl,
                billingDate: billingDate ? new Date(billingDate) : new Date(),
                description
            }
        });

        logger.info(`Billing record created for tenant ${tenant.name}: $${amount}`);
        res.status(201).json(new ApiResponse(201, record, 'Billing record created'));
    } catch (error) {
        next(error);
    }
};

exports.updateBillingRecord = async (req, res, next) => {
    try {
        const record = await prisma.billingHistory.updateMany({
            where: { id: req.params.billingId, tenantId: req.params.id },
            data: req.body
        });

        if (record.count === 0) return res.status(404).json(new ApiResponse(404, null, 'Billing record not found'));
        
        const updated = await prisma.billingHistory.findUnique({ where: { id: req.params.billingId }});
        logger.info(`Billing record ${updated.id} updated — status: ${updated.status}`);
        res.status(200).json(new ApiResponse(200, updated, 'Billing record updated'));
    } catch (error) {
        next(error);
    }
};

exports.deleteBillingRecord = async (req, res, next) => {
    try {
        const record = await prisma.billingHistory.deleteMany({
            where: { id: req.params.billingId, tenantId: req.params.id }
        });

        if (record.count === 0) return res.status(404).json(new ApiResponse(404, null, 'Billing record not found'));

        logger.info(`Billing record deleted`);
        res.status(200).json(new ApiResponse(200, null, 'Billing record deleted'));
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────
// SUPER ADMIN STORE MANAGEMENT (Cross-Tenant)
// ─────────────────────────────────────────────

exports.getAllStores = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, tenantId } = req.query;
        const where = { deletedAt: null };
        
        if (tenantId) where.tenantId = tenantId;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { code: { contains: search } }
            ];
        }

        const stores = await prisma.store.findMany({
            where,
            include: { tenant: { select: { name: true, email: true, status: true } } },
            take: Number(limit),
            skip: (Number(page) - 1) * Number(limit),
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.store.count({ where });

        res.status(200).json(new ApiResponse(200, stores, 'Cross-tenant stores retrieved successfully', {
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        }));
    } catch (error) {
        next(error);
    }
};

exports.createStoreForTenant = async (req, res, next) => {
    try {
        const { id: tenantId } = req.params;
        const { name, code, address, phone, status } = req.body;

        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) return res.status(404).json(new ApiResponse(404, null, 'Tenant not found'));

        const existing = await prisma.store.findFirst({ where: { tenantId, code } });
        if (existing) return res.status(409).json(new ApiResponse(409, null, `Store code ${code} already exists for this tenant`));

        const store = await prisma.store.create({
            data: {
                tenantId,
                name,
                code,
                address,
                phone,
                status: status || 'active'
            }
        });

        logger.info(`Super Admin created store ${store.code} for tenant ${tenant.name}`);
        res.status(201).json(new ApiResponse(201, store, 'Store created successfully'));
    } catch (error) {
        next(error);
    }
};

exports.updateStoreForTenant = async (req, res, next) => {
    try {
        const { id: tenantId, storeId } = req.params;

        const store = await prisma.store.updateMany({
            where: { id: storeId, tenantId },
            data: req.body
        });

        if (store.count === 0) return res.status(404).json(new ApiResponse(404, null, 'Store not found for this tenant'));

        const updated = await prisma.store.findUnique({ where: { id: storeId } });
        logger.info(`Super Admin updated store ${updated.code}`);
        res.status(200).json(new ApiResponse(200, updated, 'Store updated successfully'));
    } catch (error) {
        next(error);
    }
};

exports.deleteStoreForTenant = async (req, res, next) => {
    try {
        const { id: tenantId, storeId } = req.params;

        const store = await prisma.store.updateMany({
            where: { id: storeId, tenantId },
            data: { deletedAt: new Date(), status: 'inactive' }
        });

        if (store.count === 0) return res.status(404).json(new ApiResponse(404, null, 'Store not found for this tenant'));

        logger.info(`Super Admin soft-deleted store`);
        res.status(200).json(new ApiResponse(200, null, 'Store deleted successfully'));
    } catch (error) {
        next(error);
    }
};
