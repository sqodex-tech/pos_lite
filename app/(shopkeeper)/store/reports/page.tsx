"use client";

import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    Download,
    Banknote,
    ShoppingCart,
    Package,
    Users,
    Calendar,
    TrendingDown,
    ArrowUpRight,
    FileText,
    Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button, AccessDenied } from '@/components/UI';
import { transactionsApi } from '@/lib/api/transactions';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';
import { inventoryApi } from '@/lib/api/inventory';
import { customersApi } from '@/lib/api/customers';
import { expensesApi } from '@/lib/api/expenses';
import { reportsApi } from '@/lib/api/reports';
import {
    ResponsiveContainer,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Bar
} from 'recharts';

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [dateFilter, setDateFilter] = useState('1_month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [stats, setStats] = useState({
        totalSales: 0,
        totalTransactions: 0,
        totalExpenses: 0,
        totalProfit: 0,
        profitMargin: 0,
        avgTransactionValue: 0,
        topProducts: [] as any[],
        chartData: [] as any[],
        recentTransactions: [] as any[],
        daysDifference: 30
    });
    const { hasPermission, loading: permissionsLoading } = usePermissions();

    useEffect(() => {
        if (dateFilter === 'custom' && (!customStart || !customEnd)) return;
        fetchReports();
    }, [dateFilter, customStart, customEnd]);

    const fetchReports = async () => {
        try {
            setLoading(true);

            const storeId = localStorage.getItem('storeId');
            if (!storeId) {
                setLoading(false);
                return;
            }

            // Calculate date range
            let start = new Date();
            let end = new Date();
            start.setHours(0, 0, 0, 0);

            if (dateFilter === 'today') {
                // start is today
            } else if (dateFilter === '7_days') {
                start.setDate(start.getDate() - 7);
            } else if (dateFilter === '15_days') {
                start.setDate(start.getDate() - 15);
            } else if (dateFilter === '1_month') {
                start.setMonth(start.getMonth() - 1);
            } else if (dateFilter === '3_months') {
                start.setMonth(start.getMonth() - 3);
            } else if (dateFilter === 'custom') {
                if (customStart && customEnd) {
                    start = new Date(customStart);
                    start.setHours(0, 0, 0, 0);
                    end = new Date(customEnd);
                    end.setHours(23, 59, 59, 999);
                }
            } else {
                start.setDate(start.getDate() - 30);
            }
            
            const params: any = { storeId };
            // Ensure we format dates as ISO strings
            params.startDate = start.toISOString();
            params.endDate = end.toISOString();

            const res = await reportsApi.getProfitLoss(params);
            const reportData = res.data.data;
            
            let daysDifference = 1;
            if (dateFilter === 'today') daysDifference = 1;
            else if (dateFilter === '7_days') daysDifference = 7;
            else if (dateFilter === '15_days') daysDifference = 15;
            else if (dateFilter === '1_month') daysDifference = 30;
            else if (dateFilter === '3_months') daysDifference = 90;
            else if (dateFilter === 'custom' && customStart && customEnd) {
                daysDifference = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            }

            setStats({
                totalSales: reportData.revenue?.totalSales || 0,
                totalTransactions: reportData.revenue?.salesCount || 0,
                totalExpenses: reportData.costs?.totalExpenses || 0,
                totalProfit: reportData.profit?.netProfit || 0,
                profitMargin: reportData.profit?.profitMargin || 0,
                avgTransactionValue: reportData.revenue?.averageSale ? Number(reportData.revenue.averageSale) : 0,
                topProducts: [], // Need separate endpoint for top products
                chartData: (reportData.chartData?.daily || []).map((d: any) => ({
                    date: d.date,
                    Sales: d.sales || 0,
                    Expenses: d.expenses || 0,
                    Profit: d.profit || 0
                })),
                recentTransactions: [], // Need separate query if we still want this
                daysDifference
            } as any);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    };

    const handleExport = () => {
        // Create CSV content
        const csvContent = [
            ['Report Period', dateFilter],
            ['Generated', new Date().toLocaleString()],
            [''],
            ['Metric', 'Value'],
            ['Total Sales', `Rs ${stats.totalSales.toFixed(2)}`],
            ['Total Transactions', stats.totalTransactions],
            ['Total Expenses', `Rs ${stats.totalExpenses.toFixed(2)}`],
            ['Total Profit', `Rs ${stats.totalProfit.toFixed(2)}`],
            ['Profit Margin', `${stats.profitMargin.toFixed(2)}%`],
            ['Avg Transaction Value', `Rs ${stats.avgTransactionValue.toFixed(2)}`],
        ].map(row => row.join(',')).join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast.success('Report exported successfully');
    };

    if (initialLoad || permissionsLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!hasPermission(PERMISSIONS.VIEW_FINANCIAL_REPORTS)) {
        return <AccessDenied />;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
                    <p className="text-slate-500 mt-1">View sales reports and business insights</p>
                </div>
                <div className="flex gap-2">
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        >
                            <option value="today">Today</option>
                            <option value="7_days">7 Days</option>
                            <option value="15_days">15 Days</option>
                            <option value="1_month">1 Month</option>
                            <option value="3_months">3 Months</option>
                            <option value="custom">Custom Dates</option>
                        </select>
                        {dateFilter === 'custom' && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <span className="text-slate-400 font-bold">to</span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        )}
                    <Button onClick={handleExport} className="gap-2 ml-2">
                        <Download className="w-5 h-5" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Sales"
                    value={`Rs ${stats.totalSales.toFixed(2)}`}
                    icon={<Banknote className="w-6 h-6" />}
                    color="emerald"
                    trend={stats.totalSales > 0 ? 'up' : 'neutral'}
                    loading={loading}
                />
                <MetricCard
                    title="Transactions"
                    value={stats.totalTransactions.toString()}
                    icon={<ShoppingCart className="w-6 h-6" />}
                    color="blue"
                    trend={stats.totalTransactions > 0 ? 'up' : 'neutral'}
                    loading={loading}
                />
                <MetricCard
                    title="Total Expenses"
                    value={`Rs ${stats.totalExpenses.toFixed(2)}`}
                    icon={<Wallet className="w-6 h-6" />}
                    color="rose"
                    trend="down"
                    loading={loading}
                />
                <MetricCard
                    title="Net Profit"
                    value={`Rs ${stats.totalProfit.toFixed(2)}`}
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="purple"
                    trend={stats.totalProfit > 0 ? 'up' : 'down'}
                    loading={loading}
                />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Profit Margin</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {loading ? <span className="inline-block w-24 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></span> : `${stats.profitMargin.toFixed(2)}%`}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        {stats.profitMargin > 20 ? 'Excellent' : stats.profitMargin > 10 ? 'Good' : 'Needs Improvement'}
                    </p>
                </div>
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Avg Transaction</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {loading ? <span className="inline-block w-24 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></span> : `Rs ${stats.avgTransactionValue.toFixed(2)}`}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Per transaction</p>
                </div>
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Daily Average</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {loading ? <span className="inline-block w-24 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></span> : `Rs ${(stats.totalSales / (stats.daysDifference || 1)).toFixed(2)}`}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Per day</p>
                </div>
            </div>


            {/* Professional Analytics Chart */}
            {stats.chartData.length > 0 && (
                <div className="card-premium p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-6 h-6 text-primary" />
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Revenue & Expenses Overview</h2>
                        </div>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b', fontSize: 12 }} 
                                    dy={10} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b', fontSize: 12 }} 
                                    dx={-10} 
                                    tickFormatter={(value) => `Rs ${value}`} 
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '14px', fontWeight: 600 }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="Sales" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Bar dataKey="Profit" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Top Products & Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Package className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Top Products</h2>
                    </div>
                    <div className="space-y-3">
                        {stats.topProducts.map((product: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                                        <p className="text-xs text-slate-500">{product.sales} units sold</p>
                                    </div>
                                </div>
                                <p className="font-bold text-primary">Rs {(product.revenue || 0).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <FileText className="w-6 h-6 text-emerald-600" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
                    </div>
                    <div className="space-y-3">
                        {stats.recentTransactions.slice(0, 5).map((transaction: any, idx: number) => (
                            <div key={transaction.id || transaction._id || idx} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        Transaction #{(transaction.transactionNumber || transaction._id || transaction.id || '').slice(-6)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(transaction.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-emerald-600">Rs {(transaction.total || transaction.totalAmount || 0).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-slate-500">{transaction.paymentMethod}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-premium p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Financial Summary</h3>
                    <div className="space-y-3">
                        <SummaryRow label="Gross Sales" value={`Rs ${stats.totalSales.toFixed(2)}`} positive />
                        <SummaryRow label="Total Expenses" value={`Rs ${stats.totalExpenses.toFixed(2)}`} negative />
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                            <SummaryRow
                                label="Net Profit"
                                value={`Rs ${stats.totalProfit.toFixed(2)}`}
                                positive={stats.totalProfit > 0}
                                bold
                            />
                        </div>
                    </div>
                </div>

                <div className="card-premium p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Performance Indicators</h3>
                    <div className="space-y-3">
                        <IndicatorRow
                            label="Profit Margin"
                            value={`${stats.profitMargin.toFixed(2)}%`}
                            status={stats.profitMargin > 20 ? 'good' : stats.profitMargin > 10 ? 'warning' : 'poor'}
                        />
                        <IndicatorRow
                            label="Transaction Count"
                            value={stats.totalTransactions.toString()}
                            status={stats.totalTransactions > 50 ? 'good' : stats.totalTransactions > 20 ? 'warning' : 'poor'}
                        />
                        <IndicatorRow
                            label="Avg Transaction"
                            value={`Rs ${stats.avgTransactionValue.toFixed(2)}`}
                            status={stats.avgTransactionValue > 50 ? 'good' : stats.avgTransactionValue > 25 ? 'warning' : 'poor'}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, color, trend, loading }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: 'emerald' | 'blue' | 'rose' | 'purple';
    trend: 'up' | 'down' | 'neutral';
    loading?: boolean;
}) {
    const colorClasses = {
        emerald: 'from-emerald-500 to-emerald-600',
        blue: 'from-blue-500 to-blue-600',
        rose: 'from-rose-500 to-rose-600',
        purple: 'from-purple-500 to-purple-600'
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
                {trend !== 'neutral' && (
                    <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                        {trend === 'up' ? (
                            <ArrowUpRight className="w-4 h-4" />
                        ) : (
                            <TrendingDown className="w-4 h-4" />
                        )}
                    </div>
                )}
            </div>
            <p className="text-sm text-slate-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {loading ? <span className="inline-block w-24 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></span> : value}
            </p>
        </motion.div>
    );
}

function SummaryRow({ label, value, positive, negative, bold }: {
    label: string;
    value: string;
    positive?: boolean;
    negative?: boolean;
    bold?: boolean;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className={`text-slate-600 dark:text-slate-400 ${bold ? 'font-bold' : ''}`}>{label}</span>
            <span className={`${bold ? 'font-bold text-lg' : 'font-medium'} ${positive ? 'text-emerald-600' : negative ? 'text-rose-600' : 'text-slate-900 dark:text-white'
                }`}>
                {value}
            </span>
        </div>
    );
}

function IndicatorRow({ label, value, status }: {
    label: string;
    value: string;
    status: 'good' | 'warning' | 'poor';
}) {
    const statusColors = {
        good: 'bg-emerald-100 text-emerald-700',
        warning: 'bg-amber-100 text-amber-700',
        poor: 'bg-rose-100 text-rose-700'
    };

    return (
        <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">{label}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusColors[status]}`}>
                {value}
            </span>
        </div>
    );
}
