"use client";

import React, { useState, useEffect } from 'react';
import { 
    Settings, Shield, Bell, Database, Globe, ArrowRight, CheckCircle2, 
    Users, Key, Tags, Bookmark, Scale, CreditCard 
} from 'lucide-react';
import { Button, Input } from '@/components/UI';
import { usePermissions } from '@/hooks/usePermissions';
import { subscriptionsApi, Subscription } from '@/lib/api/subscriptions';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
    const { user: authUser } = usePermissions();
    const router = useRouter();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authUser?.tenantId) {
            fetchSubscription();
        }
    }, [authUser]);

    const fetchSubscription = async () => {
        try {
            const tenantId = typeof authUser?.tenantId === 'object' ? authUser.tenantId._id : authUser?.tenantId;
            if (!tenantId) return;
            const response = await subscriptionsApi.getActive(tenantId);
            setSubscription(response.data.data);
        } catch (error) {
            console.error('Fetch subscription error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Settings Hub</h1>
                <p className="text-slate-500 font-medium mt-2">Configure your store, manage team members, and set up your inventory preferences.</p>
            </motion.div>

            {/* Subscription & Billing Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-primary/20 shadow-2xl shadow-primary/5 overflow-hidden"
            >
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 relative z-10">
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                            <CreditCard className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Subscription & Billing</h2>
                            <p className="text-sm text-slate-500 font-medium">Your current plan and billing details</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => router.push('/store/billing')}
                            className="rounded-2xl font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                        >
                            View Billing
                        </Button>
                        <Button
                            onClick={() => router.push('/store/plans')}
                            className="rounded-2xl font-black shadow-lg shadow-primary/20 gap-2"
                        >
                            Upgrade Plan
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800 relative z-10">
                    <div className="p-5 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-100/50 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-900 transition-colors duration-300">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Current Plan</p>
                        <p className="text-xl font-black text-primary">{loading ? '...' : (subscription?.planId?.name || 'No Plan')}</p>
                    </div>
                    <div className="p-5 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-100/50 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-900 transition-colors duration-300">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Monthly Cost</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{loading ? '...' : `Rs ${subscription?.priceSnapshot?.amount || 0}`}</p>
                    </div>
                    <div className="p-5 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-100/50 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-900 transition-colors duration-300">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Status</p>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border mt-1 ${subscription?.status === 'active'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {loading ? '...' : (subscription?.status?.toUpperCase() || 'NONE')}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Application Configuration Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Organization Settings */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-500" /> Organization & Team
                    </h3>
                    <div className="grid gap-4">
                        <SettingsGridCard
                            icon={<Users className="w-5 h-5 text-blue-500" />}
                            title="Users & Staff"
                            description="Manage your team members and staff accounts"
                            onClick={() => router.push('/store/users')}
                        />
                        <SettingsGridCard
                            icon={<Key className="w-5 h-5 text-indigo-500" />}
                            title="Roles & Permissions"
                            description="Configure access control and user roles"
                            onClick={() => router.push('/store/permissions')}
                        />
                        <SettingsGridCard
                            icon={<Globe className="w-5 h-5 text-emerald-500" />}
                            title="Store Profile"
                            description="Update your store details, address, and logo"
                            onClick={() => toast.error('Store Profile page under construction')}
                        />
                    </div>
                </div>

                {/* Inventory & Products Settings */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Database className="w-5 h-5 text-amber-500" /> Inventory Configuration
                    </h3>
                    <div className="grid gap-4">
                        <SettingsGridCard
                            icon={<Tags className="w-5 h-5 text-orange-500" />}
                            title="Product Categories"
                            description="Organize your products with categories"
                            onClick={() => router.push('/store/categories')}
                        />
                        <SettingsGridCard
                            icon={<Bookmark className="w-5 h-5 text-pink-500" />}
                            title="Brands"
                            description="Manage product brands and manufacturers"
                            onClick={() => router.push('/store/brands')}
                        />
                        <SettingsGridCard
                            icon={<Scale className="w-5 h-5 text-teal-500" />}
                            title="Measurement Units"
                            description="Configure units like kg, pcs, liters, etc."
                            onClick={() => router.push('/store/units')}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}

function SettingsGridCard({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick?: () => void }) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            onClick={onClick}
            className="card-premium p-5 group cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 group-hover:bg-primary/5 rounded-xl flex items-center justify-center transition-colors duration-300 shrink-0">
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors duration-300">{title}</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{description}</p>
                    </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-5 h-5 text-primary" />
                </div>
            </div>
        </motion.div>
    );
}
