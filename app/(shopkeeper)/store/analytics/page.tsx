"use client";

import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Banknote,
    Users,
    CreditCard,
    Activity,
    AlertCircle,
    Calendar,
    BarChart3,
    PieChart,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { analyticsApi, DashboardAnalytics } from '@/lib/api/analytics';
import { Button } from '@/components/UI';

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await analyticsApi.getDashboard({ period });
            setAnalytics(response.data.data);
        } catch (error: any) {
            console.error('Fetch analytics error:', error);
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No analytics data available</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">SaaS Analytics</h1>
                    <p className="text-slate-500 mt-1">Comprehensive business metrics and insights</p>
                </div>
                <div className="flex gap-2">
                    {['7', '30', '90', '365'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors ${period === p
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                }`}
                        >
                            {p}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Monthly Recurring Revenue"
                    value={`Rs ${analytics?.revenue?.mrr?.toLocaleString() || '0'}`}
                    change={analytics?.revenue?.revenueGrowth || 0}
                    icon={<Banknote className="w-6 h-6" />}
                    color="emerald"
                />
                <MetricCard
                    title="Annual Recurring Revenue"
                    value={`Rs ${analytics?.revenue?.arr?.toLocaleString() || '0'}`}
                    subtitle="Projected yearly"
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="blue"
                />
                <MetricCard
                    title="Active Subscriptions"
                    value={(analytics?.overview?.activeSubscriptions || 0).toString()}
                    change={analytics?.performance?.subscriptionGrowth || 0}
                    icon={<CreditCard className="w-6 h-6" />}
                    color="purple"
                />
                <MetricCard
                    title="Average Revenue Per User"
                    value={`Rs ${(analytics?.revenue?.averageRevenuePerUser || 0).toFixed(2)}`}
                    subtitle="Per subscription"
                    icon={<Users className="w-6 h-6" />}
                    color="amber"
                />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PerformanceCard
                    title="Churn Rate"
                    value={`${analytics?.performance?.churnRate || 0}%`}
                    status={parseFloat((analytics?.performance?.churnRate || 0).toString()) < 5 ? 'good' : 'warning'}
                    icon={<Activity className="w-5 h-5" />}
                />
                <PerformanceCard
                    title="Trial Conversion"
                    value={`${analytics?.performance?.trialConversionRate || 0}%`}
                    status={parseFloat((analytics?.performance?.trialConversionRate || 0).toString()) > 20 ? 'good' : 'warning'}
                    icon={<TrendingUp className="w-5 h-5" />}
                />
                <PerformanceCard
                    title="Active Rate"
                    value={`${analytics?.performance?.activeRate || 0}%`}
                    status={parseFloat((analytics?.performance?.activeRate || 0).toString()) > 80 ? 'good' : 'warning'}
                    icon={<Users className="w-5 h-5" />}
                />
                <PerformanceCard
                    title="Expiring Soon"
                    value={(analytics?.overview?.expiringSoon || 0).toString()}
                    status={(analytics?.overview?.expiringSoon || 0) > 10 ? 'warning' : 'good'}
                    icon={<AlertCircle className="w-5 h-5" />}
                />
            </div>

            {/* Subscription Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart3 className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subscription Status</h2>
                    </div>
                    <div className="space-y-4">
                        <StatusBar
                            label="Active"
                            value={analytics?.overview?.activeSubscriptions || 0}
                            total={analytics?.overview?.totalSubscriptions || 0}
                            color="emerald"
                        />
                        <StatusBar
                            label="Trial"
                            value={analytics?.overview?.trialSubscriptions || 0}
                            total={analytics?.overview?.totalSubscriptions || 0}
                            color="blue"
                        />
                        <StatusBar
                            label="Pending"
                            value={analytics?.overview?.pendingSubscriptions || 0}
                            total={analytics?.overview?.totalSubscriptions || 0}
                            color="amber"
                        />
                        <StatusBar
                            label="Cancelled"
                            value={analytics?.overview?.cancelledSubscriptions || 0}
                            total={analytics?.overview?.totalSubscriptions || 0}
                            color="rose"
                        />
                        <StatusBar
                            label="Expired"
                            value={analytics?.overview?.expiredSubscriptions || 0}
                            total={analytics?.overview?.totalSubscriptions || 0}
                            color="slate"
                        />
                    </div>
                </div>

                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <PieChart className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Plan Distribution</h2>
                    </div>
                    <div className="space-y-3">
                        {(analytics?.planDistribution || []).map((plan, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">{plan.plan}</p>
                                    <p className="text-xs text-slate-500">{plan.subscribers} subscribers</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary">Rs {(plan.revenue || 0).toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">{plan.percentage}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Revenue Trend */}
            {(analytics?.revenue?.revenueByPeriod?.length ?? 0) > 0 && (
                <div className="card-premium p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-primary" />
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Revenue Trend</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Total Revenue</p>
                            <p className="text-2xl font-bold text-primary">Rs {(analytics?.revenue?.totalRevenue || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="h-64 flex items-end gap-2">
                        {analytics.revenue.revenueByPeriod.slice(-30).map((item, index) => {
                            const maxRevenue = Math.max(...analytics.revenue.revenueByPeriod.map(r => r.revenue));
                            const height = (item.revenue / maxRevenue) * 100;
                            return (
                                <div
                                    key={index}
                                    className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-all cursor-pointer group relative"
                                    style={{ height: `${height}%` }}
                                >
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Rs {item.revenue.toFixed(2)}
                                        <br />
                                        {new Date(item.date).toLocaleDateString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <ArrowUpRight className="w-6 h-6 text-emerald-600" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Subscriptions</h2>
                    </div>
                    <div className="space-y-3">
                        {(analytics?.recentActivities?.newSubscriptions || []).slice(0, 5).map((sub: any) => (
                            <div key={sub._id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">{sub.tenantId?.name || 'N/A'}</p>
                                    <p className="text-xs text-slate-500">{sub.planId?.name || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-emerald-600">Rs {sub.priceSnapshot?.amount || 0}</p>
                                    <p className="text-xs text-slate-500">
                                        {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <ArrowDownRight className="w-6 h-6 text-rose-600" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Cancellations</h2>
                    </div>
                    <div className="space-y-3">
                        {(analytics?.recentActivities?.cancellations || []).slice(0, 5).map((sub: any) => (
                            <div key={sub._id} className="flex items-center justify-between p-3 bg-rose-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">{sub.tenantId?.name || 'N/A'}</p>
                                    <p className="text-xs text-slate-500">{sub.cancelReason || 'No reason provided'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-rose-600">-${sub.priceSnapshot?.amount || 0}</p>
                                    <p className="text-xs text-slate-500">
                                        {sub.cancelledAt ? new Date(sub.cancelledAt).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, change, subtitle, icon, color }: {
    title: string;
    value: string;
    change?: number;
    subtitle?: string;
    icon: React.ReactNode;
    color: 'emerald' | 'blue' | 'purple' | 'amber';
}) {
    const colorClasses = {
        emerald: 'from-emerald-500 to-emerald-600',
        blue: 'from-blue-500 to-blue-600',
        purple: 'from-purple-500 to-purple-600',
        amber: 'from-amber-500 to-amber-600'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium p-6"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white`}>
                    {icon}
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-bold ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                        {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
            <p className="text-sm text-slate-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </motion.div>
    );
}

function PerformanceCard({ title, value, status, icon }: {
    title: string;
    value: string;
    status: 'good' | 'warning';
    icon: React.ReactNode;
}) {
    return (
        <div className={`p-4 rounded-xl border-2 ${status === 'good' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
            }`}>
            <div className="flex items-center gap-2 mb-2">
                <div className={status === 'good' ? 'text-emerald-600' : 'text-amber-600'}>
                    {icon}
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</p>
            </div>
            <p className={`text-2xl font-bold ${status === 'good' ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                {value}
            </p>
        </div>
    );
}

function StatusBar({ label, value, total, color }: {
    label: string;
    value: number;
    total: number;
    color: 'emerald' | 'blue' | 'amber' | 'rose' | 'slate';
}) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const colorClasses = {
        emerald: 'bg-emerald-500',
        blue: 'bg-blue-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500',
        slate: 'bg-slate-400'
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{value} ({percentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`h-full ${colorClasses[color]} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
