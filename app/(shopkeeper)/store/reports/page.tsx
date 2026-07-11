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

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');
    const [stats, setStats] = useState({
        totalSales: 0,
        totalTransactions: 0,
        totalExpenses: 0,
        totalProfit: 0,
        profitMargin: 0,
        avgTransactionValue: 0,
        topProducts: [] as any[],
        salesByDay: [] as any[],
        recentTransactions: [] as any[]
    });
    const { hasPermission, loading: permissionsLoading } = usePermissions();

    useEffect(() => {
        fetchReports();
    }, [period]);

    const fetchReports = async () => {
        try {
            setLoading(true);

            const storeId = localStorage.getItem('storeId');
            if (!storeId) {
                setLoading(false);
                return;
            }

            // Fetch all data in parallel
            const [transRes, invRes, custRes, expRes] = await Promise.all([
                transactionsApi.getAll(storeId, {}).catch(() => ({ data: { data: [] } })),
                inventoryApi.getAll(storeId).catch(() => ({ data: { data: [] } })),
                customersApi.getAll(storeId).catch(() => ({ data: { data: [] } })),
                expensesApi.getAll(storeId, {}).catch(() => ({ data: { data: [] } }))
            ]);

            const transactions = Array.isArray(transRes.data.data) ? transRes.data.data : [];
            const inventory = Array.isArray(invRes.data.data) ? invRes.data.data : [];
            const expenses = Array.isArray(expRes.data.data) ? expRes.data.data : [];

            // Calculate date range
            const daysAgo = parseInt(period);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysAgo);

            // Filter transactions by period
            const periodTransactions = transactions.filter((t: any) =>
                new Date(t.createdAt) >= startDate
            );

            // Calculate total sales
            const totalSales = periodTransactions.reduce((sum: number, t: any) =>
                sum + (t.totalAmount || 0), 0
            );

            // Calculate total expenses
            const periodExpenses = expenses.filter((e: any) =>
                new Date(e.date) >= startDate
            );
            const totalExpenses = periodExpenses.reduce((sum: number, e: any) =>
                sum + (e.amount || 0), 0
            );

            // Calculate profit
            const totalProfit = totalSales - totalExpenses;
            const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

            // Calculate average transaction value
            const avgTransactionValue = periodTransactions.length > 0
                ? totalSales / periodTransactions.length
                : 0;

            // Group sales by day
            const salesByDay: any = {};
            periodTransactions.forEach((t: any) => {
                const date = new Date(t.createdAt).toLocaleDateString();
                if (!salesByDay[date]) {
                    salesByDay[date] = 0;
                }
                salesByDay[date] += t.totalAmount || 0;
            });

            const salesByDayArray = Object.entries(salesByDay).map(([date, amount]) => ({
                date,
                amount
            }));

            // Get top products (mock data - would need transaction items)
            const topProducts = inventory.slice(0, 5).map((item: any) => ({
                name: item.name,
                sales: Math.floor(Math.random() * 100),
                revenue: item.salePrice * Math.floor(Math.random() * 50)
            }));

            setStats({
                totalSales,
                totalTransactions: periodTransactions.length,
                totalExpenses,
                totalProfit,
                profitMargin,
                avgTransactionValue,
                topProducts,
                salesByDay: salesByDayArray,
                recentTransactions: periodTransactions.slice(0, 10)
            });
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        // Create CSV content
        const csvContent = [
            ['Report Period', `Last ${period} days`],
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

    if (loading || permissionsLoading) {
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
                    {['7', '30', '90'].map((p) => (
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
                />
                <MetricCard
                    title="Transactions"
                    value={stats.totalTransactions.toString()}
                    icon={<ShoppingCart className="w-6 h-6" />}
                    color="blue"
                    trend={stats.totalTransactions > 0 ? 'up' : 'neutral'}
                />
                <MetricCard
                    title="Total Expenses"
                    value={`Rs ${stats.totalExpenses.toFixed(2)}`}
                    icon={<Wallet className="w-6 h-6" />}
                    color="rose"
                    trend="down"
                />
                <MetricCard
                    title="Net Profit"
                    value={`Rs ${stats.totalProfit.toFixed(2)}`}
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="purple"
                    trend={stats.totalProfit > 0 ? 'up' : 'down'}
                />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Profit Margin</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.profitMargin.toFixed(2)}%</h3>
                    <p className="text-xs text-slate-500 mt-1">
                        {stats.profitMargin > 20 ? 'Excellent' : stats.profitMargin > 10 ? 'Good' : 'Needs Improvement'}
                    </p>
                </div>
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Avg Transaction</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Rs {stats.avgTransactionValue.toFixed(2)}</h3>
                    <p className="text-xs text-slate-500 mt-1">Per transaction</p>
                </div>
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Daily Average</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Rs {(stats.totalSales / parseInt(period)).toFixed(2)}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Per day</p>
                </div>
            </div>

            {/* Sales Trend Chart */}
            {stats.salesByDay.length > 0 && (
                <div className="card-premium p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-primary" />
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sales Trend</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Total Revenue</p>
                            <p className="text-2xl font-bold text-primary">Rs {stats.totalSales.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="h-64 flex items-end gap-2">
                        {stats.salesByDay.slice(-30).map((item: any, index: number) => {
                            const maxSales = Math.max(...stats.salesByDay.map((s: any) => s.amount));
                            const height = maxSales > 0 ? (item.amount / maxSales) * 100 : 0;
                            return (
                                <div
                                    key={index}
                                    className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-all cursor-pointer group relative"
                                    style={{ height: `${height}%`, minHeight: '4px' }}
                                >
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">Rs {item.amount.toFixed(2)}
                                        <br />
                                        {item.date}
                                    </div>
                                </div>
                            );
                        })}
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
                                <p className="font-bold text-primary">Rs {product.revenue.toFixed(2)}</p>
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
                        {stats.recentTransactions.slice(0, 5).map((transaction: any) => (
                            <div key={transaction._id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        Transaction #{transaction._id.slice(-6)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(transaction.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-emerald-600">Rs {transaction.totalAmount.toFixed(2)}
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

function MetricCard({ title, value, icon, color, trend }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: 'emerald' | 'blue' | 'rose' | 'purple';
    trend: 'up' | 'down' | 'neutral';
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
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
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
