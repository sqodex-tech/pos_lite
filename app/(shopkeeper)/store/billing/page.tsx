"use client";

import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Download,
    ArrowRight,
    Package,
    Users,
    Layers,
    History,
    XCircle,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { subscriptionsApi, Subscription } from '@/lib/api/subscriptions';
import { usePermissions } from '@/hooks/usePermissions';
import { Button, Modal } from '@/components/UI';
import { useRouter } from 'next/navigation';

export default function TenantBillingPage() {
    const { user: authUser } = usePermissions();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);
    const [usage, setUsage] = useState({ users: 0, branches: 0, items: 0 });

    // Modal states
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelType, setCancelType] = useState<'immediate' | 'scheduled'>('scheduled');

    useEffect(() => {
        if (authUser?.tenantId) {
            fetchData();
        }
    }, [authUser, historyPage]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const tenantId = typeof authUser?.tenantId === 'object' ? authUser.tenantId._id : authUser?.tenantId;

            if (!tenantId) return;

            // Import necessary APIs
            const { usersApi } = await import('@/lib/api/users');
            const { storesApi } = await import('@/lib/api/stores');
            const { inventoryApi } = await import('@/lib/api/inventory');

            const [subRes, historyRes, usersRes, storesRes] = await Promise.all([
                subscriptionsApi.getActive(tenantId).catch(() => ({ data: { data: null } })),
                subscriptionsApi.getHistory(tenantId, { page: historyPage, limit: 10 }).catch(() => ({
                    data: { data: [], meta: { pagination: { totalPages: 1 } } }
                })),
                usersApi.getAll({ limit: 1 }).catch(() => ({ data: { data: [], meta: { pagination: { total: 0 } } } } as any)),
                storesApi.getAll({ limit: 1 }).catch(() => ({ data: { data: [], meta: { pagination: { total: 0 } } } } as any))
            ]);

            setSubscription(subRes.data.data);
            setHistory(Array.isArray(historyRes.data.data) ? historyRes.data.data : []);
            setHistoryTotalPages(historyRes.data?.meta?.pagination?.totalPages || 1);

            // Fetch items usage (requires a storeId, we'll try to get one)
            let itemsTotal = 0;
            const storeId = localStorage.getItem('storeId') || '';
            if (storeId) {
                try {
                    const itemsRes = await inventoryApi.getAll(storeId, { limit: 1 });
                    itemsTotal = itemsRes.data?.meta?.pagination?.total || itemsRes.data?.meta?.total || (Array.isArray(itemsRes.data?.data) ? itemsRes.data.data.length : 0);
                } catch (e) {
                    console.error('Failed to fetch items usage', e);
                }
            }

            setUsage({
                users: usersRes.data?.meta?.pagination?.total || (Array.isArray(usersRes.data.data) ? usersRes.data.data.length : 0),
                branches: storesRes.data?.meta?.pagination?.total || (Array.isArray(storesRes.data.data) ? storesRes.data.data.length : 0),
                items: itemsTotal
            });
        } catch (error: any) {
            console.error('Fetch billing error:', error);
            toast.error('Failed to load billing information');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!subscription) return;

        try {
            setIsCancelling(true);
            await subscriptionsApi.cancel(subscription._id || subscription.id || '', {
                reason: 'User requested cancellation via dashboard',
                immediate: cancelType === 'immediate'
            });

            toast.success(cancelType === 'immediate'
                ? 'Subscription cancelled and access suspended.'
                : 'Subscription set to cancel at the end of current period.');

            setShowCancelModal(false);
            fetchData();
        } catch (error: any) {
            console.error('Cancel error:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel subscription');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleDownloadInvoice = (record: any) => {
        const content = `
========================================
           SUMBOX PRO RECEIPT           
========================================

Date: ${new Date(record.createdAt).toLocaleDateString()}
Status: ${record.paymentStatus?.toUpperCase() || record.status?.toUpperCase() || 'PAID'}

Plan: ${record.planId?.name || 'Subscription'}
Description: Auto-renewal or Plan Switch
Amount Paid: Rs ${record.priceSnapshot?.amount ?? record.planId?.price ?? 0}

Thank you for your business!
========================================
        `.trim();

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "receipt-" + record._id + ".txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
            {/* Cancellation Modal */}
            <Modal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                title="Cancel Subscription"
            >
                <div className="space-y-6">
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-rose-700 font-medium">
                            We're sorry to see you go. Please choose how you want to handle your remaining time.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={() => setCancelType('scheduled')}
                            className={`p-6 rounded-2xl border-2 text-left transition-all ${cancelType === 'scheduled'
                                ? 'border-primary bg-primary/5 ring-4 ring-primary/5'
                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className={`w-5 h-5 ${cancelType === 'scheduled' ? 'text-primary' : 'text-slate-400'}`} />
                                <span className={`font-black uppercase tracking-widest text-[10px] ${cancelType === 'scheduled' ? 'text-primary' : 'text-slate-500'}`}>End of Period</span>
                            </div>
                            <p className="text-slate-900 dark:text-white font-bold mb-1">Finish Current Cycle</p>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                Keep access to all features until <span className="font-bold">{subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'the end of your term'}</span>. No further charges will occur.
                            </p>
                        </button>

                        <button
                            onClick={() => setCancelType('immediate')}
                            className={`p-6 rounded-2xl border-2 text-left transition-all ${cancelType === 'immediate'
                                ? 'border-rose-500 bg-rose-50 ring-4 ring-rose-500/5'
                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Zap className={`w-5 h-5 ${cancelType === 'immediate' ? 'text-rose-500' : 'text-slate-400'}`} />
                                <span className={`font-black uppercase tracking-widest text-[10px] ${cancelType === 'immediate' ? 'text-rose-500' : 'text-slate-500'}`}>Immediately</span>
                            </div>
                            <p className="text-slate-900 dark:text-white font-bold mb-1">Cancel Right Away</p>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed font-bold text-rose-600/80">
                                Warning: You will lose access to all store features immediately. This action cannot be undone.
                            </p>
                        </button>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <Button
                            variant="primary"
                            className={`flex-1 py-4 rounded-2xl font-black ${cancelType === 'immediate' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : ''}`}
                            onClick={handleCancelSubscription}
                            isLoading={isCancelling}
                        >
                            Confirm Cancellation
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 py-4 rounded-2xl font-black text-slate-500"
                            onClick={() => setShowCancelModal(false)}
                        >
                            Keep Subscription
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Billing & Subscription</h1>
                <p className="text-slate-500 font-medium mt-2">Manage your plan, billing cycle, and payment history.</p>
            </div>

            {/* Subscription Overview Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-2 relative group bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-700/60 shadow-xl overflow-hidden"
                >
                    {/* Decorative Gradient */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 h-full">
                        <div className="space-y-6 flex-1">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    <Package className="w-7 h-7 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Current Plan</p>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white">{subscription?.planId?.name || 'No Active Plan'}</h2>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StatItem icon={<Users className="w-4 h-4 text-blue-500" />} label="Users" value={String(usage.users)} total={String(subscription?.limitsSnapshot?.maxUsers ?? subscription?.planId?.maxUsers ?? 0)} />
                                <StatItem icon={<Layers className="w-4 h-4 text-indigo-500" />} label="Branches" value={String(usage.branches)} total={String(subscription?.limitsSnapshot?.maxBranches ?? subscription?.planId?.maxBranches ?? 0)} />
                                <StatItem icon={<Package className="w-4 h-4 text-emerald-500" />} label="Items" value={String(usage.items)} total={String(subscription?.limitsSnapshot?.maxItems ?? subscription?.planId?.maxItems ?? 0)} />
                            </div>
                        </div>

                        <div className="flex flex-col justify-between items-end gap-6 h-full min-w-[200px]">
                            <div className="text-right">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-sm border ${subscription?.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : subscription?.status === 'pending'
                                        ? 'bg-amber-50 text-amber-600 border-amber-100'
                                        : 'bg-rose-50 text-rose-600 border-rose-100'
                                    }`}>
                                    <CheckCircle2 className="w-4 h-4" />
                                    {subscription?.status?.toUpperCase() || 'NONE'}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 w-full">
                                <Button
                                    onClick={() => router.push('/store/plans')}
                                    className="w-full bg-primary hover:bg-primary-dark text-white rounded-2xl font-black gap-2 shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
                                >
                                    Change Plan
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                                {subscription?.status === 'active' && (
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        className="text-xs font-black text-rose-500 hover:text-rose-600 flex items-center justify-center gap-1 transition-colors uppercase tracking-widest"
                                    >
                                        <XCircle className="w-3.5 h-3.5" />
                                        Cancel Subscription
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Next Payment Card */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 text-slate-900 dark:text-white shadow-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>

                    <div className="relative z-10">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                            {subscription?.autoRenew === false ? 'Subscription Ends' : 'Next Payment'}
                        </p>
                        <h3 className="text-4xl font-black mb-2">
                            {subscription?.nextPaymentDate || subscription?.endDate ?
                                new Date(subscription?.autoRenew === false ? subscription.endDate : subscription.nextPaymentDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'N/A'
                            }
                        </h3>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest mt-2 ${subscription?.autoRenew === false ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {subscription?.autoRenew === false ? 'Auto-renew Off' : 'Auto-renew On'}
                        </div>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-center text-sm font-bold border-t border-slate-100 dark:border-slate-800 pt-4">
                            <span className="text-slate-500 dark:text-slate-400">Amount Due</span>
                            <span className="text-2xl">Rs {subscription?.priceSnapshot?.amount || 0}</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Billing History Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                            <History className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Subscription History</h2>
                    </div>
                    {history.length > 0 && (
                        <div className="text-sm font-bold text-slate-400">
                            Showing last {history.length} transactions
                        </div>
                    )}
                </div>

                {history.length === 0 ? (
                    <div className="text-center py-20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700">
                        <Clock className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Transactions Yet</h3>
                        <p className="text-slate-500">Your billing history will appear here once your first payment is processed.</p>
                    </div>
                ) : (
                    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 dark:border-slate-700/60 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Date</th>
                                        <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Plan / Description</th>
                                        <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Amount</th>
                                        <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Status</th>
                                        <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.map((record, index) => (
                                        <tr key={record._id || record.id || index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-300">
                                            <td className="px-8 py-6">
                                                <p className="font-bold text-slate-900 dark:text-white">{new Date(record.createdAt).toLocaleDateString()}</p>
                                                <p className="text-xs text-slate-400 font-medium">{new Date(record.createdAt).toLocaleTimeString()}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="font-bold text-slate-900 dark:text-white">{record.planId?.name || 'Subscription'}</p>
                                                <p className="text-xs text-slate-400 font-medium">
                                                    {record.limitsSnapshot?.maxUsers ?? record.planId?.maxUsers ?? 0} Users • {record.limitsSnapshot?.maxBranches ?? record.planId?.maxBranches ?? 0} Branches • {(record.limitsSnapshot?.maxItems ?? record.planId?.maxItems ?? 0).toLocaleString()} Items
                                                </p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="font-black text-slate-900 dark:text-white">Rs {record.priceSnapshot?.amount ?? record.planId?.price ?? 0}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black border ${record.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : record.status === 'pending'
                                                        ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                        : 'bg-rose-50 text-rose-600 border-rose-100'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${record.status === 'active' ? 'bg-emerald-500' : record.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
                                                        }`}></div>
                                                    {record.status.toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {record.paymentStatus === 'paid' && (
                                                    <button
                                                        onClick={() => handleDownloadInvoice(record)}
                                                        className="flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Invoice
                                                    </button>
                                                )}
                                                {record.paymentStatus === 'failed' && (
                                                    <button className="flex items-center gap-2 text-rose-600 font-bold text-sm hover:underline">
                                                        <AlertCircle className="w-4 h-4" />
                                                        Retry
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {historyTotalPages > 1 && (
                            <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                                <Button
                                    variant="outline"
                                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                    disabled={historyPage === 1}
                                    className="text-sm font-bold bg-white dark:bg-slate-900"
                                >
                                    Previous
                                </Button>
                                <span className="text-sm font-bold text-slate-500">
                                    Page {historyPage} of {historyTotalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                                    disabled={historyPage === historyTotalPages}
                                    className="text-sm font-bold bg-white dark:bg-slate-900"
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatItem({ icon, label, value, total }: { icon: React.ReactNode, label: string, value: string, total: string }) {
    const val = parseFloat(value) || 0;
    const tot = parseFloat(total) || 1;
    const percent = Math.min(100, Math.max(0, (val / tot) * 100));

    return (
        <div className="p-5 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-4">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    {icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <div className="space-y-3">
                <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
                    <p className="text-xs font-bold text-slate-400">/ {total}</p>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                        className={`h-full rounded-full ${percent > 90 ? 'bg-rose-500' : percent > 75 ? 'bg-amber-500' : 'bg-primary'}`}
                    />
                </div>
            </div>
        </div>
    );
}
