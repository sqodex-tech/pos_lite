"use client";

import React, { useState, useEffect } from 'react';
import {
    ClipboardCheck,
    CheckCircle,
    XCircle,
    User,
    Calendar,
    Banknote,
    Package,
    ArrowRight,
    Search,
    Filter,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { subscriptionsApi, Subscription } from '@/lib/api/subscriptions';
import { Button } from '@/components/UI';

export default function ApprovalsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('pending');

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const response = await subscriptionsApi.getAll({ status: filter === 'all' ? undefined : filter });
            setSubscriptions(Array.isArray(response.data.data) ? response.data.data : []);
        } catch (error: any) {
            console.error('Fetch subscriptions error:', error);
            toast.error('Failed to load subscriptions');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await subscriptionsApi.approve(id);
            toast.success('Subscription approved and activated!');
            fetchSubscriptions();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Approval failed');
        }
    };

    const filteredSubscriptions = subscriptions.filter(sub =>
        sub.tenantId.name.toLowerCase().includes(search.toLowerCase()) ||
        sub.tenantId.email.toLowerCase().includes(search.toLowerCase()) ||
        sub.planId.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading && subscriptions.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Subscription Approvals</h1>
                    <p className="text-slate-500 mt-1">Review and approve pending tenant subscriptions</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by tenant name, email or plan..."
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                    {(['pending', 'active', 'all'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); fetchSubscriptions(); }}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filter === f
                                    ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                    {filteredSubscriptions.map((sub) => (
                        <ApprovalCard
                            key={sub._id || sub.id}
                            subscription={sub}
                            onApprove={() => handleApprove(sub._id || sub.id || '')}
                        />
                    ))}
                </AnimatePresence>

                {filteredSubscriptions.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <ClipboardCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">No {filter} subscriptions found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ApprovalCard({ subscription, onApprove }: {
    subscription: Subscription;
    onApprove: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="card-premium p-6 flex flex-col md:flex-row items-center gap-6"
        >
            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tenant Info */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white truncate">{subscription.tenantId.name}</p>
                        <p className="text-sm text-slate-400 truncate">{subscription.tenantId.email}</p>
                    </div>
                </div>

                {/* Plan Info */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white">{subscription.planId.name}</p>
                        <div className="flex items-center gap-1 text-emerald-600 font-bold">
                            <Banknote className="w-4 h-4" />
                            {subscription.priceSnapshot.amount}
                        </div>
                    </div>
                </div>

                {/* Date/Status Info */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-400">Requested On</p>
                        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {new Date(subscription.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 shrink-0">
                {subscription.status === 'pending' && (
                    <Button onClick={onApprove} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Approve
                    </Button>
                )}
                {subscription.status === 'active' && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold border border-emerald-100">
                        <CheckCircle className="w-5 h-5" />
                        Approved
                    </div>
                )}
            </div>
        </motion.div>
    );
}
