"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, CheckCircle, ArrowRight, Shield, AlertCircle, Calendar, Zap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { plansApi, Plan } from '@/lib/api/plans';
import { subscriptionsApi } from '@/lib/api/subscriptions';
import { Button, Modal } from '@/components/UI';
import { usePermissions } from '@/hooks/usePermissions';

function TenantPlansPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user: authUser } = usePermissions();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [activatingId, setActivatingId] = useState<string | null>(null);
    const [currentSubscription, setCurrentSubscription] = useState<any>(null);

    // Modal states
    const [showChangeModal, setShowChangeModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [changeType, setChangeType] = useState<'immediate' | 'scheduled'>('immediate');

    const hasUsedTrial = authUser?.tenantId?.hasUsedTrial || false;

    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            toast.error(errorParam, { duration: 6000 });
            // Clean up the URL
            router.replace('/store/plans');
        }
    }, [searchParams, router]);

    useEffect(() => {
        fetchInitialData();
    }, [authUser]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const tenantId = typeof authUser?.tenantId === 'object' ? authUser.tenantId._id : authUser?.tenantId;

            const [plansRes, subRes] = await Promise.all([
                plansApi.getAll(),
                tenantId ? subscriptionsApi.getActive(tenantId).catch(() => ({ data: { data: null } })) : { data: { data: null } }
            ]);

            setPlans(Array.isArray(plansRes.data.data) ? plansRes.data.data : []);
            setCurrentSubscription(subRes.data.data);
        } catch (error: any) {
            console.error('Fetch error:', error);
            toast.error('Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (plan: Plan) => {
        if (!authUser || !authUser.tenantId) {
            toast.error('Invalid tenant session. Please login again.');
            return;
        }

        // If active or pending subscription exists and it's not a trial and it's a different plan
        const activePlanId = typeof currentSubscription?.planId === 'object' && currentSubscription?.planId !== null ? (currentSubscription.planId as any)._id || (currentSubscription.planId as any).id : currentSubscription?.planId;
        if ((currentSubscription?.status === 'active' || currentSubscription?.status === 'pending') && (plan._id || plan.id) !== activePlanId && plan.price !== 0) {
            setSelectedPlan(plan);
            setShowChangeModal(true);
            setChangeType('immediate'); // Default for pending subscriptions
            return;
        }

        executeSubscription(plan);
    };

    const executeSubscription = async (plan: Plan, immediate: boolean = true) => {
        const tenantId = typeof authUser?.tenantId === 'object' ? authUser?.tenantId._id : authUser?.tenantId;
        if (!tenantId) return;

        const isTrialPlan = !!plan.isTrialPlan;

        if (isTrialPlan && hasUsedTrial) {
            toast.error('You have already used your free trial. Please select a paid plan.');
            return;
        }

        try {
            setActivatingId(plan._id || plan.id || null);

            if (currentSubscription?.status === 'active') {
                // Use changePlan API
                await subscriptionsApi.changePlan((currentSubscription._id || currentSubscription.id) as string, {
                    newPlanId: (plan._id || plan.id) as string,
                    immediate
                });
                toast.success(immediate ? 'Plan changed immediately!' : 'Plan change scheduled for next cycle.');
            } else if (currentSubscription?.status === 'pending') {
                // Change plan for pending: cancel current pending and activate new one
                await subscriptionsApi.cancel((currentSubscription._id || currentSubscription.id) as string, { immediate: true });
                await subscriptionsApi.activate(tenantId, {
                    planId: (plan._id || plan.id) as string,
                    autoRenew: false,
                    isTrial: isTrialPlan
                });
                toast.success(isTrialPlan ? 'Trial activated successfully!' : 'New plan requested and pending approval.');
            } else {
                // New activation
                await subscriptionsApi.activate(tenantId, {
                    planId: (plan._id || plan.id) as string,
                    autoRenew: false,
                    isTrial: isTrialPlan
                });
                toast.success(isTrialPlan ? 'Trial activated successfully!' : 'Subscription submitted and pending approval.');
            }

            setShowChangeModal(false);
            fetchInitialData(); // Refresh to show states
        } catch (error: any) {
            console.error('Subscription error:', error);
            const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to process subscription';
            toast.error(errorMessage);
        } finally {
            setActivatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    const isPending = currentSubscription?.status === 'pending';
    const activePlanId = typeof currentSubscription?.planId === 'object' && currentSubscription?.planId !== null ? (currentSubscription.planId as any)._id || (currentSubscription.planId as any).id : currentSubscription?.planId;

    return (
        <div className="max-w-7xl mx-auto py-12 px-6 space-y-16 relative">
            {/* Modal for Plan Change */}
            <Modal
                isOpen={showChangeModal}
                onClose={() => setShowChangeModal(false)}
                title="Change Subscription Plan"
            >
                <div className="space-y-6">
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-3">
                        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            You are about to switch to the <span className="font-bold text-slate-900 dark:text-white">{selectedPlan?.name}</span> plan. Please choose when you want this change to take effect.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={() => setChangeType('immediate')}
                            className={`p-6 rounded-2xl border-2 text-left transition-all ${changeType === 'immediate'
                                ? 'border-primary bg-primary/5 ring-4 ring-primary/5'
                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Zap className={`w-5 h-5 ${changeType === 'immediate' ? 'text-primary' : 'text-slate-400'}`} />
                                <span className={`font-black uppercase tracking-widest text-[10px] ${changeType === 'immediate' ? 'text-primary' : 'text-slate-500'}`}>Immediately</span>
                            </div>
                            <p className="text-slate-900 dark:text-white font-bold mb-1">Switch Right Now</p>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                Your current subscription will end immediately. A new billing cycle for <span className="font-bold">{selectedPlan?.name}</span> will start today.
                            </p>
                        </button>

                        {currentSubscription?.status !== 'pending' && (
                            <button
                                onClick={() => setChangeType('scheduled')}
                                className={`p-6 rounded-2xl border-2 text-left transition-all ${changeType === 'scheduled'
                                    ? 'border-primary bg-primary/5 ring-4 ring-primary/5'
                                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Calendar className={`w-5 h-5 ${changeType === 'scheduled' ? 'text-primary' : 'text-slate-400'}`} />
                                    <span className={`font-black uppercase tracking-widest text-[10px] ${changeType === 'scheduled' ? 'text-primary' : 'text-slate-500'}`}>Next Cycle</span>
                                </div>
                                <p className="text-slate-900 dark:text-white font-bold mb-1">End of Current Period</p>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Stay on your current plan until your next billing date. Your plan will automatically switch to <span className="font-bold">{selectedPlan?.name}</span> thereafter.
                                </p>
                            </button>
                        )}
                    </div>

                    <div className="flex gap-4 pt-2">
                        <Button
                            variant="primary"
                            className="flex-1 py-4 rounded-2xl font-black"
                            onClick={() => selectedPlan && executeSubscription(selectedPlan, changeType === 'immediate')}
                            isLoading={activatingId !== null}
                        >
                            Confirm Change
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 py-4 rounded-2xl font-black text-slate-500"
                            onClick={() => setShowChangeModal(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse delay-1000"></div>

            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full text-primary font-bold text-sm mb-4"
                >
                    <Shield className="w-4 h-4" />
                    Trusted by 500+ Businesses
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight"
                >
                    Scale Your Business with <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">SumboxPro</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg text-slate-500 font-medium leading-relaxed"
                >
                    Choose a plan that fits your growth. From small startups to multi-branch enterprises, we've got you covered.
                </motion.p>
            </div>

            {/* Pending Notification */}
            <AnimatePresence>
                {isPending && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden"
                    >
                        <div className="flex items-center gap-4 text-amber-800">
                            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Subscription Pending Approval</h3>
                                <p className="text-sm opacity-80 font-medium">Your request for the <span className="font-bold">{currentSubscription.planId?.name}</span> plan is being reviewed by our super admin.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="secondary" className="bg-white dark:bg-slate-900 hover:bg-white/80 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300" onClick={() => router.push('/store/billing')}>
                                View Status
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {plans.length === 0 ? (
                <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-700">
                    <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Plans Available</h3>
                    <p className="text-slate-500">Please contact the system administrator to set up pricing plans.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch pt-4">
                    <AnimatePresence>
                        {plans.map((plan, index) => {
                            const isTrialPlan = !!plan.isTrialPlan;
                            const isAlreadyUsed = isTrialPlan && hasUsedTrial;
                            const isCurrentPlan = activePlanId === (plan._id || plan.id);
                            const scheduledId = typeof currentSubscription?.scheduledPlanId === 'object' && currentSubscription?.scheduledPlanId !== null ? (currentSubscription.scheduledPlanId as any)._id || (currentSubscription.scheduledPlanId as any).id : currentSubscription?.scheduledPlanId;
                            const isScheduled = scheduledId === (plan._id || plan.id);
                            const isSelectedInPending = isPending && activePlanId === (plan._id || plan.id);

                            return (
                                <motion.div
                                    key={plan._id || (plan as any).id || index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`relative group bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-1 border transition-all duration-500 hover:scale-[1.02] flex flex-col ${isCurrentPlan
                                        ? 'border-primary shadow-[0_20px_50px_rgba(79,70,229,0.2)] ring-4 ring-primary/5'
                                        : isScheduled
                                            ? 'border-emerald-400 shadow-[0_20px_50px_rgba(52,211,153,0.1)] ring-4 ring-emerald-400/5'
                                            : 'border-slate-200/60 dark:border-slate-700/60 hover:border-primary/30 hover:shadow-2xl'
                                        } ${isAlreadyUsed ? 'grayscale' : ''}`}
                                >
                                    <div className="p-8 flex flex-col h-full bg-white/40 dark:bg-slate-900/40 rounded-[2.3rem]">
                                        {isCurrentPlan && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-primary text-white text-xs font-bold rounded-full shadow-lg">
                                                Active Now
                                            </div>
                                        )}

                                        {isScheduled && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
                                                Starting Next Cycle
                                            </div>
                                        )}

                                        {isSelectedInPending && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
                                                Pending Approval
                                            </div>
                                        )}

                                        {/* Plan Header */}
                                        <div className="mb-10 text-center">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-500 group-hover:rotate-6 ${isCurrentPlan ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'
                                                }`}>
                                                <Package className="w-7 h-7" />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">{plan.name}</h3>
                                            <div className="flex items-center justify-center gap-1">
                                                <span className="text-sm font-bold text-slate-400">Rs </span>
                                                <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{plan.price}</span>
                                                <span className="text-slate-400 font-bold lowercase text-sm">
                                                    /{plan.durationInDays === 365 ? 'yr' : plan.durationInDays === 30 ? 'mo' : `${plan.durationInDays}d`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Limits Cards */}
                                        <div className="grid grid-cols-2 gap-3 mb-10">
                                            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors duration-300">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Users</p>
                                                <p className="text-lg font-black text-slate-900 dark:text-white">{plan.maxUsers}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors duration-300">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Stores</p>
                                                <p className="text-lg font-black text-slate-900 dark:text-white">{plan.maxBranches}</p>
                                            </div>
                                            <div className="col-span-2 p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors duration-300">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Inventory Items</p>
                                                <p className="text-lg font-black text-slate-900 dark:text-white">{plan.maxItems.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* Features List */}
                                        <div className="space-y-4 mb-10 flex-1">
                                            {plan.features?.map((feature, idx) => (
                                                <div key={idx} className="flex items-start gap-3">
                                                    <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                    </div>
                                                    <span className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-tight">{feature}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Action Button */}
                                        <Button
                                            onClick={() => handleSubscribe(plan)}
                                            disabled={activatingId === (plan._id || plan.id) || isAlreadyUsed || isCurrentPlan || isScheduled || isSelectedInPending}
                                            className={`w-full py-5 text-lg font-black rounded-2xl transition-all duration-300 shadow-xl mt-auto ${isCurrentPlan
                                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-default'
                                                : isScheduled
                                                    ? 'bg-emerald-100 text-emerald-600 border border-emerald-200 cursor-default'
                                                    : isSelectedInPending
                                                        ? 'bg-amber-100 text-amber-600 border border-amber-200 cursor-default'
                                                        : isAlreadyUsed
                                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                                                            : 'bg-primary hover:bg-primary/90 text-white hover:shadow-primary/30 hover:-translate-y-1'
                                                }`}
                                        >
                                            {activatingId === (plan._id || plan.id) ? (
                                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                                    <Package className="w-6 h-6" />
                                                </motion.div>
                                            ) : isCurrentPlan ? (
                                                'Your Active Plan'
                                            ) : isScheduled ? (
                                                'Scheduled Switch'
                                            ) : isSelectedInPending ? (
                                                'Pending Approval'
                                            ) : isAlreadyUsed ? (
                                                'Trial Used'
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    {(currentSubscription?.status === 'active' || currentSubscription?.status === 'pending') ? 'Switch to Plan' : 'Get Started'}
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Support Footer */}
            <div className="text-center pt-8">
                <p className="text-slate-400 font-medium">
                    Questions? <a href="/support" className="text-primary font-bold hover:underline">Contact our sales team</a> for custom enterprise solutions.
                </p>
            </div>
        </div>
    );
}

export default function TenantPlansPage() {
    return (
        <React.Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        }>
            <TenantPlansPageContent />
        </React.Suspense>
    );
}

