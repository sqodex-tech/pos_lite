const prisma = require('../config/prisma');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const NotificationHelper = require('../utils/notificationHelper');

/**
 * @desc Create/Activate subscription for tenant
 * @route POST /api/v1/subscriptions/tenant/:tenantId/activate
 * @access ADMIN
 */
exports.activateSubscription = async (req, res, next) => {
    try {
        const { tenantId } = req.params;
        const { planId, autoRenew = true, isTrial = false } = req.body;

        // Validate tenant
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            throw new ApiError(404, 'Tenant not found');
        }

        // Only ADMIN can manage their own tenant's subscription (SUPER_ADMIN can manage any)
        if (req.user.role !== 'SUPER_ADMIN' && req.user.tenantId !== tenantId) {
            throw new ApiError(403, 'Access denied. You can only manage your own subscription.');
        }

        // Validate plan
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) {
            throw new ApiError(404, 'Plan not found');
        }

        // Check if tenant already has an active or pending subscription
        const existingSubscription = await prisma.subscription.findFirst({
            where: {
                tenantId,
                status: { in: ['active', 'pending'] }
            }
        });

        if (existingSubscription) {
            throw new ApiError(400, `Tenant already has a ${existingSubscription.status} subscription`);
        }

        // Trial is determined by plan flag (NOT by price)
        const isActuallyTrial = plan.isTrialPlan === true;

        // Backward-compat: if client sends isTrial, enforce it matches the plan definition
        if (typeof isTrial === 'boolean' && isTrial !== isActuallyTrial) {
            throw new ApiError(400, 'Selected plan trial type does not match the request');
        }

        // Safety: ensure trial plans are free
        if (isActuallyTrial && plan.price > 0) {
            throw new ApiError(400, 'Invalid trial plan configuration (trial plans must have price = 0)');
        }

        // Check trial eligibility (one-time trial)
        if (isActuallyTrial && tenant.hasUsedTrial) {
            throw new ApiError(400, 'Tenant has already used their free trial');
        }

        // Auto-renewal rule:
        // - ADMIN: cannot enable auto-renew from the UI; force autoRenew = false
        // - SUPER_ADMIN: can control autoRenew flag
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        const effectiveAutoRenew = isSuperAdmin ? autoRenew : false;

        // Calculate dates
        const startDate = new Date();
        const duration = plan.durationInDays || 30;
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration);

        // Create subscription (PENDING BY DEFAULT)
        const subscription = await prisma.subscription.create({
            data: {
                tenantId,
                planId,
                startDate,
                endDate,
                autoRenew: effectiveAutoRenew,
                priceSnapshot: {
                    amount: plan.price,
                    currency: 'USD',
                    durationInDays: duration
                },
                limitsSnapshot: {
                    maxUsers: plan.maxUsers,
                    maxItems: plan.maxItems,
                    maxBranches: plan.maxBranches
                },
                isTrial: isActuallyTrial,
                trialEndsAt: isActuallyTrial ? endDate : null,
                status: isActuallyTrial ? 'active' : 'pending',
                paymentStatus: isActuallyTrial ? 'paid' : 'pending',
                nextPaymentDate: isActuallyTrial ? endDate : (effectiveAutoRenew ? endDate : null)
            }
        });

        if (isActuallyTrial) {
            await prisma.tenant.update({
                where: { id: tenantId },
                data: {
                    hasUsedTrial: true,
                    status: 'active',
                    subscriptionPlanId: planId,
                    nextBillingDate: endDate
                }
            });
        }

        // Create initial billing history
        await prisma.billingHistory.create({
            data: {
                tenantId,
                subscriptionId: subscription.id,
                amount: plan.price,
                currency: 'USD',
                status: isActuallyTrial ? 'paid' : 'pending',
                paymentMethod: 'system',
                billingDate: startDate,
                description: `${isActuallyTrial ? 'Trial' : 'New'} subscription to ${plan.name} plan ${isActuallyTrial ? '(Auto-approved)' : '(Pending Approval)'}`
            }
        });

        const populatedSubscription = await prisma.subscription.findUnique({
            where: { id: subscription.id },
            include: { plan: true, tenant: { select: { name: true, email: true } } }
        });

        logger.info(`Subscription created (${isActuallyTrial ? 'active' : 'pending'}) for tenant ${tenant.name}: ${plan.name}`);

        const message = isActuallyTrial
            ? 'Trial subscription activated successfully'
            : 'Subscription submitted and pending approval';

        res.status(201).json(new ApiResponse(201, populatedSubscription, message));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Approve pending subscription
 * @route POST /api/v1/subscriptions/:subscriptionId/approve
 * @access SUPER_ADMIN
 */
exports.approveSubscription = async (req, res, next) => {
    try {
        const { subscriptionId } = req.params;

        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: { plan: true }
        });

        if (!subscription) {
            throw new ApiError(404, 'Subscription not found');
        }

        if (subscription.status !== 'pending') {
            throw new ApiError(400, `Subscription is already ${subscription.status}`);
        }

        const priceSnapshot = subscription.priceSnapshot || {};
        const duration = priceSnapshot.durationInDays || 30;
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration);

        // Update Subscription status
        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: 'active',
                startDate,
                endDate,
                nextPaymentDate: endDate,
                paymentStatus: 'paid',
                lastPaymentDate: new Date()
            }
        });

        // Update Billing History (Update the pending one created at activation)
        const pendingHistory = await prisma.billingHistory.findFirst({
            where: {
                subscriptionId: subscription.id,
                status: 'pending'
            }
        });

        if (pendingHistory) {
            await prisma.billingHistory.update({
                where: { id: pendingHistory.id },
                data: {
                    status: 'paid',
                    paymentMethod: 'manual',
                    paymentDetails: {
                        transactionId: `init_${Date.now()}_${subscription.id}`,
                        paymentGateway: 'admin_manual',
                        paidAt: new Date()
                    },
                    description: `Initial payment for ${subscription.plan.name} plan (Approved by Admin)`
                }
            });
        } else {
            // Fallback: Create one if none found
            await prisma.billingHistory.create({
                data: {
                    tenantId: subscription.tenantId,
                    subscriptionId: subscription.id,
                    amount: priceSnapshot.amount,
                    currency: priceSnapshot.currency || 'USD',
                    status: 'paid',
                    paymentMethod: 'manual',
                    paymentDetails: {
                        transactionId: `init_${Date.now()}_${subscription.id}`,
                        paymentGateway: 'admin_manual',
                        paidAt: new Date()
                    },
                    billingDate: new Date(),
                    description: `Initial payment for ${subscription.plan.name} plan (Approved by Admin)`
                }
            });
        }

        // Update Tenant
        await prisma.tenant.update({
            where: { id: subscription.tenantId },
            data: {
                subscriptionPlanId: subscription.planId,
                subscriptionStart: updatedSubscription.startDate,
                nextBillingDate: updatedSubscription.nextPaymentDate,
                status: 'active'
            }
        });

        const tenant = await prisma.tenant.findUnique({ where: { id: subscription.tenantId } });

        const populated = await prisma.subscription.findUnique({
            where: { id: subscription.id },
            include: { plan: true, tenant: { select: { name: true, email: true } } }
        });

        // Send activation notification
        await NotificationHelper.sendSubscriptionActivated(populated, tenant);

        logger.info(`Subscription approved and activated for tenant ${tenant.name}`);
        res.status(200).json(new ApiResponse(200, populated, 'Subscription approved and activated'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Get active subscription for tenant
 * @route GET /api/v1/subscriptions/tenant/:tenantId/active
 * @access ADMIN (own tenant)
 */
exports.getActiveSubscription = async (req, res, next) => {
    try {
        const { tenantId } = req.params;

        // Check access
        if (req.user.role !== 'SUPER_ADMIN' && req.user.tenantId !== tenantId) {
            throw new ApiError(403, 'Access denied');
        }

        const subscription = await prisma.subscription.findFirst({
            where: {
                tenantId,
                status: { in: ['active', 'pending'] }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!subscription) {
            return res.status(200).json(new ApiResponse(200, null, 'No active or pending subscription found'));
        }

        const message = subscription.status === 'active' ? 'Active subscription retrieved' : 'Pending subscription retrieved';
        res.status(200).json(new ApiResponse(200, subscription, message));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Get current tenant subscription summary (no tenantId needed)
 * @route GET /api/v1/subscriptions/me/summary
 * @access ADMIN (own tenant)
 */
exports.getMySubscriptionSummary = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;

        if (!tenantId) {
            // SUPER_ADMIN typically has no tenant subscription context
            return res.status(200).json(new ApiResponse(200, null, 'No tenant subscription context for this user'));
        }

        const subscription = await prisma.subscription.findFirst({
            where: {
                tenantId,
                status: { in: ['active', 'pending'] }
            },
            include: { plan: true },
            orderBy: { createdAt: 'desc' }
        });

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { nextBillingDate: true }
        });

        if (!subscription) {
            return res.status(200).json(new ApiResponse(200, {
                planName: null,
                isTrial: false,
                status: null,
                daysRemaining: 0,
                nextBillingDate: tenant?.nextBillingDate || null
            }, 'No active or pending subscription found'));
        }

        const daysRemaining = subscription.status === 'active'
            ? Math.max(0, Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
            : 0;

        return res.status(200).json(new ApiResponse(200, {
            planName: subscription.plan?.name || null,
            isTrial: !!subscription.isTrial,
            status: subscription.status,
            daysRemaining,
            nextBillingDate: tenant?.nextBillingDate || null
        }, 'Subscription summary retrieved'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Get subscription history for tenant
 * @route GET /api/v1/subscriptions/tenant/:tenantId/history
 * @access ADMIN (own tenant)
 */
exports.getSubscriptionHistory = async (req, res, next) => {
    try {
        const { tenantId } = req.params;
        const { page = 1, limit = 20, status } = req.query;

        // Check access
        if (req.user.role !== 'SUPER_ADMIN' && req.user.tenantId !== tenantId) {
            throw new ApiError(403, 'Access denied');
        }

        const where = { tenantId };
        if (status) where.status = status;

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);

        const subscriptions = await prisma.subscription.findMany({
            where,
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: limitNum,
            skip: (pageNum - 1) * limitNum
        });

        const total = await prisma.subscription.count({ where });

        res.status(200).json(new ApiResponse(200, subscriptions, 'Subscription history retrieved', {
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        }));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Upgrade/Downgrade subscription
 * @route POST /api/v1/subscriptions/:subscriptionId/change-plan
 * @access ADMIN
 */
exports.changePlan = async (req, res, next) => {
    try {
        const { subscriptionId } = req.params;
        const { newPlanId, immediate = false } = req.body;

        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: { plan: true, tenant: true }
        });
        
        if (!subscription) {
            throw new ApiError(404, 'Subscription not found');
        }

        if (subscription.status !== 'active') {
            throw new ApiError(400, 'Can only change plan for active subscriptions');
        }

        const newPlan = await prisma.plan.findUnique({ where: { id: newPlanId } });
        if (!newPlan) {
            throw new ApiError(404, 'New plan not found');
        }

        // Prevent moving back to a trial/free plan once tenant has already used a trial
        const tenant = subscription.tenant;
        const isTrialPlan = newPlan.isTrialPlan === true;
        if (isTrialPlan && tenant.hasUsedTrial) {
            throw new ApiError(400, 'Tenant is not allowed to move back to a trial plan');
        }

        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

        // For tenant ADMINs: changing plan should NEVER immediately activate a new paid subscription.
        // Instead, create a PENDING subscription request and keep the current one active
        // until SUPER_ADMIN approves it.
        if (!isSuperAdmin) {
            const duration = newPlan.durationInDays || 30;

            // By default, request the change to take effect at the end of the current period.
            // SUPER_ADMIN can decide when to approve/activate.
            const requestedStartDate = immediate ? new Date() : new Date(subscription.endDate);
            const requestedEndDate = new Date(requestedStartDate);
            requestedEndDate.setDate(requestedEndDate.getDate() + duration);

            const pendingSubscription = await prisma.subscription.create({
                data: {
                    tenantId: subscription.tenantId,
                    planId: newPlanId,
                    status: 'pending',
                    startDate: requestedStartDate,
                    endDate: requestedEndDate,
                    autoRenew: false, // ADMIN cannot enable auto-renew
                    paymentStatus: 'pending',
                    priceSnapshot: {
                        amount: newPlan.price,
                        currency: 'USD',
                        durationInDays: duration
                    },
                    limitsSnapshot: {
                        maxUsers: newPlan.maxUsers,
                        maxItems: newPlan.maxItems,
                        maxBranches: newPlan.maxBranches
                    },
                    notes: `Plan change requested from ${subscription.plan.name} to ${newPlan.name} (${immediate ? 'immediate' : 'end of period'})`
                }
            });

            await prisma.billingHistory.create({
                data: {
                    tenantId: subscription.tenantId,
                    subscriptionId: pendingSubscription.id,
                    amount: newPlan.price,
                    currency: 'USD',
                    status: 'pending',
                    paymentMethod: 'system',
                    billingDate: new Date(),
                    description: `Plan change requested from ${subscription.plan.name} to ${newPlan.name}`
                }
            });

            const populatedRequest = await prisma.subscription.findUnique({
                where: { id: pendingSubscription.id },
                include: { plan: true, tenant: true }
            });

            logger.info(`Plan change requested (pending) for ${subscription.tenant.name}: ${newPlan.name}`);
            return res.status(200).json(new ApiResponse(200, populatedRequest, 'Plan change requested and pending SUPER_ADMIN approval'));
        }

        if (immediate) {
            // Immediate change
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    cancelReason: `Upgraded to ${newPlan.name}`
                }
            });

            // Create new subscription
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + (newPlan.durationInDays || 30));

            const newSubscription = await prisma.subscription.create({
                data: {
                    tenantId: subscription.tenantId,
                    planId: newPlanId,
                    status: 'active',
                    startDate,
                    endDate,
                    autoRenew: subscription.autoRenew,
                    nextPaymentDate: subscription.autoRenew ? endDate : null,
                    paymentStatus: 'pending',
                    priceSnapshot: {
                        amount: newPlan.price,
                        currency: 'USD',
                        durationInDays: newPlan.durationInDays
                    },
                    limitsSnapshot: {
                        maxUsers: newPlan.maxUsers,
                        maxItems: newPlan.maxItems,
                        maxBranches: newPlan.maxBranches
                    }
                }
            });

            // Update tenant
            await prisma.tenant.update({
                where: { id: subscription.tenantId },
                data: {
                    subscriptionPlanId: newPlanId,
                    nextBillingDate: endDate
                }
            });

            // Create billing record
            await prisma.billingHistory.create({
                data: {
                    tenantId: subscription.tenantId,
                    amount: newPlan.price,
                    currency: 'USD',
                    status: 'pending',
                    paymentMethod: 'system',
                    billingDate: startDate,
                    description: `Plan changed from ${subscription.plan.name} to ${newPlan.name}`
                }
            });

            const populated = await prisma.subscription.findUnique({
                where: { id: newSubscription.id },
                include: { plan: true, tenant: true }
            });

            logger.info(`Subscription changed immediately for ${subscription.tenant.name}: ${newPlan.name}`);
            return res.status(200).json(new ApiResponse(200, populated, 'Plan changed successfully'));
        } else {
            // Schedule change
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    scheduledPlanId: newPlanId,
                    notes: `Scheduled to change to ${newPlan.name} on ${new Date(subscription.endDate).toDateString()}`
                }
            });

            const populated = await prisma.subscription.findUnique({
                where: { id: subscription.id },
                include: { plan: true, tenant: true }
            });

            logger.info(`Plan change scheduled for ${subscription.tenant.name}: ${newPlan.name}`);
            res.status(200).json(new ApiResponse(200, populated, 'Plan change scheduled for next billing cycle'));
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Cancel subscription
 * @route POST /api/v1/subscriptions/:subscriptionId/cancel
 * @access ADMIN
 */
exports.cancelSubscription = async (req, res, next) => {
    try {
        const { subscriptionId } = req.params;
        const { reason, immediate = false } = req.body;

        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: { tenant: true }
        });
        
        if (!subscription) {
            throw new ApiError(404, 'Subscription not found');
        }

        if (subscription.status === 'cancelled') {
            throw new ApiError(400, 'Subscription already cancelled');
        }

        let updateData = {
            cancelledAt: new Date(),
            cancelReason: reason || 'User requested cancellation'
        };

        if (immediate) {
            updateData.status = 'cancelled';
            updateData.endDate = new Date();
            updateData.autoRenew = false;
            updateData.nextPaymentDate = null;

            // IMPORTANT: Do NOT suspend the tenant account on cancellation.
            // Just detach the plan and billing dates so the account remains usable.
            await prisma.tenant.update({
                where: { id: subscription.tenantId },
                data: {
                    subscriptionPlanId: null,
                    nextBillingDate: null
                }
            });
        } else {
            // Cancel at end of period
            updateData.autoRenew = false;
            updateData.notes = `Subscription will end on ${new Date(subscription.endDate).toDateString()}`;
        }

        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscription.id },
            data: updateData
        });

        // Send notification
        await NotificationHelper.sendSubscriptionCancelled(updatedSubscription, subscription.tenant, reason, immediate);

        logger.info(`Subscription cancelled for ${subscription.tenant.name}: ${immediate ? 'immediate' : 'end of period'}`);
        res.status(200).json(new ApiResponse(200, updatedSubscription, 'Subscription cancelled successfully'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Renew subscription
 * @route POST /api/v1/subscriptions/:subscriptionId/renew
 * @access ADMIN
 */
exports.renewSubscription = async (req, res, next) => {
    try {
        const { subscriptionId } = req.params;

        // Only SUPER_ADMIN can perform manual renewals.
        if (req.user.role !== 'SUPER_ADMIN') {
            throw new ApiError(403, 'Only SUPER_ADMIN can renew subscriptions');
        }

        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: { plan: true, tenant: true }
        });

        if (!subscription) {
            throw new ApiError(404, 'Subscription not found');
        }

        const plan = subscription.plan;

        // Do not allow renewing a trial subscription period.
        const isTrialPlan = plan.isTrialPlan === true;
        if (subscription.isTrial || isTrialPlan) {
            throw new ApiError(400, 'Trial subscriptions cannot be renewed. Please choose a paid plan.');
        }

        // Create new period
        const startDate = new Date(subscription.endDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (plan.durationInDays || 30));

        const newSubscription = await prisma.subscription.create({
            data: {
                tenantId: subscription.tenantId,
                planId: plan.id,
                status: 'active',
                startDate,
                endDate,
                autoRenew: subscription.autoRenew,
                nextPaymentDate: subscription.autoRenew ? endDate : null,
                paymentStatus: 'pending',
                priceSnapshot: {
                    amount: plan.price,
                    currency: 'USD',
                    durationInDays: plan.durationInDays
                },
                limitsSnapshot: {
                    maxUsers: plan.maxUsers,
                    maxItems: plan.maxItems,
                    maxBranches: plan.maxBranches
                }
            }
        });

        // Mark old as expired
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'expired' }
        });

        // Update tenant
        await prisma.tenant.update({
            where: { id: subscription.tenantId },
            data: {
                nextBillingDate: endDate,
                status: 'active'
            }
        });

        // Create billing record
        await prisma.billingHistory.create({
            data: {
                tenantId: subscription.tenantId,
                amount: plan.price,
                currency: 'USD',
                status: 'pending',
                paymentMethod: 'system',
                billingDate: startDate,
                description: `Subscription renewed: ${plan.name}`
            }
        });

        const populated = await prisma.subscription.findUnique({
            where: { id: newSubscription.id },
            include: { plan: true, tenant: true }
        });

        // Send notification
        await NotificationHelper.sendSubscriptionRenewed(populated, subscription.tenant);

        logger.info(`Subscription renewed for ${subscription.tenant.name}`);
        res.status(201).json(new ApiResponse(201, populated, 'Subscription renewed successfully'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Get all subscriptions
 * @route GET /api/v1/subscriptions
 * @access ADMIN
 */
exports.getAllSubscriptions = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, planId, expiringSoon } = req.query;

        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        const where = isSuperAdmin ? {} : { tenantId: req.user.tenantId };

        if (status) where.status = status;
        if (planId) where.planId = planId;

        if (expiringSoon === 'true') {
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            where.endDate = { lte: sevenDaysFromNow, gt: new Date() };
            where.status = 'active';
        }

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);

        const subscriptions = await prisma.subscription.findMany({
            where,
            include: {
                plan: true,
                tenant: { select: { name: true, email: true, status: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: limitNum,
            skip: (pageNum - 1) * limitNum
        });

        const total = await prisma.subscription.count({ where });

        res.status(200).json(new ApiResponse(200, subscriptions, 'Subscriptions retrieved', {
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        }));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Get subscription statistics
 * @route GET /api/v1/subscriptions/stats
 * @access ADMIN
 */
exports.getSubscriptionStats = async (req, res, next) => {
    try {
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        const where = isSuperAdmin ? {} : { tenantId: req.user.tenantId };

        const [
            totalActive,
            totalCancelled,
            totalExpired,
            expiringSoon,
            trialSubscriptions,
            activeSubsForRevenue
        ] = await Promise.all([
            prisma.subscription.count({ where: { ...where, status: 'active' } }),
            prisma.subscription.count({ where: { ...where, status: 'cancelled' } }),
            prisma.subscription.count({ where: { ...where, status: 'expired' } }),
            prisma.subscription.count({
                where: {
                    ...where,
                    status: 'active',
                    endDate: {
                        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        gt: new Date()
                    }
                }
            }),
            prisma.subscription.count({ where: { ...where, isTrial: true, status: 'active' } }),
            prisma.subscription.findMany({ where: { ...where, status: 'active' } })
        ]);

        let revenueSum = 0;
        activeSubsForRevenue.forEach(sub => {
            if (sub.priceSnapshot && sub.priceSnapshot.amount) {
                revenueSum += sub.priceSnapshot.amount;
            }
        });

        const stats = {
            totalActive,
            totalCancelled,
            totalExpired,
            expiringSoon,
            trialSubscriptions,
            monthlyRecurringRevenue: revenueSum,
            churnRate: totalActive > 0 ? ((totalCancelled / (totalActive + totalCancelled)) * 100).toFixed(2) : 0
        };

        res.status(200).json(new ApiResponse(200, stats, 'Subscription statistics retrieved'));
    } catch (error) {
        next(error);
    }
};

module.exports = exports;
