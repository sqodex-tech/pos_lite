"use client";

import React, { useState, useEffect } from 'react';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    ArrowUpRight,
    Coins,
    Clock,
    CreditCard,
    Banknote,
    LayoutDashboard,
    Package,
    Plus,
    Receipt,
    ShoppingCart,
    Store,
    TrendingUp,
    Users,
    Zap,
    Printer
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { storesApi } from '@/lib/api/stores';
import { transactionsApi } from '@/lib/api/transactions';
import { inventoryApi } from '@/lib/api/inventory';
import { reportsApi } from '@/lib/api/reports';
import { Button } from '@/components/UI';
import EndOfDayModal from '@/components/store/EndOfDayModal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TenantDashboard() {
    const { user } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
    const [lowStockItems, setLowStockItems] = useState<any[]>([]);
    const [currentStore, setCurrentStore] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [isEndOfDayOpen, setIsEndOfDayOpen] = useState(false);
    const [printingTx, setPrintingTx] = useState<any>(null);

    const [dateFilter, setDateFilter] = useState('today');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    useEffect(() => {
        if (dateFilter !== 'custom') {
            fetchDashboardData();
        }
    }, [dateFilter]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const storeId = localStorage.getItem('storeId');

            if (!storeId) {
                toast.error('No store selected. Please select a store first.');
                return;
            }

            let start = new Date();
            let end = new Date();

            if (dateFilter === 'today') {
                start.setHours(0, 0, 0, 0);
            } else if (dateFilter === '7_days') {
                start.setDate(start.getDate() - 7);
                start.setHours(0, 0, 0, 0);
            } else if (dateFilter === '15_days') {
                start.setDate(start.getDate() - 15);
                start.setHours(0, 0, 0, 0);
            } else if (dateFilter === '1_month') {
                start.setMonth(start.getMonth() - 1);
            } else if (dateFilter === '3_months') {
                start.setMonth(start.getMonth() - 3);
            } else if (dateFilter === 'custom') {
                if (customStart && customEnd) {
                    start = new Date(customStart);
                    end = new Date(customEnd);
                    end.setHours(23, 59, 59, 999);
                } else {
                    start.setHours(0, 0, 0, 0); // fallback
                }
            } else {
                start.setHours(0, 0, 0, 0);
            }

            const [statsRes, transRes, invRes, storeDetails, reportsRes] = await Promise.all([
                storesApi.getStats(storeId, {
                    startDate: start.toISOString(),
                    endDate: end.toISOString()
                }).catch(() => ({
                    data: {
                        data: {
                            todaySales: 0,
                            todayPurchases: 0,
                            todayOrders: 0,
                            purchaseOrders: 0,
                            totalItems: 0,
                            lowStockCount: 0,
                            activeCustomers: 0
                        }
                    }
                })),
                transactionsApi.getAll(storeId, { limit: 5, startDate: start.toISOString(), endDate: end.toISOString() }).catch(() => ({ data: { data: [] } })),
                inventoryApi.getAll(storeId, { limit: 1000, status: 'active' }).catch(() => ({ data: { data: [] } })),
                storesApi.getById(storeId).catch(() => ({ data: { data: null } })),
                reportsApi.getProfitLoss({ storeId, startDate: start.toISOString(), endDate: end.toISOString() }).catch(() => ({ data: { data: null } }))
            ]);

            setStats(statsRes.data.data);
            setRecentTransactions(Array.isArray(transRes.data.data) ? transRes.data.data : []);
            setLowStockItems(Array.isArray(invRes.data.data) ? invRes.data.data.filter((i: any) => (i.stock || 0) <= (i.lowStockAlert || 5)) : []);
            setCurrentStore(storeDetails.data.data);
            
            if (reportsRes.data?.data?.chartData) {
                setChartData(Object.values(reportsRes.data.data.chartData));
            } else {
                setChartData([]);
            }
        } catch (error: any) {
            console.error('Dashboard load error:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    };

    if (initialLoad) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-500 font-medium animate-pulse">Loading your store snapshot...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
            {/* Header / Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <LayoutDashboard className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Dashboard Overview</h2>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Welcome back, <span className="text-primary">{user?.name?.split(' ')[0] || 'Store Admin'}</span>!
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Here's what's happening at <span className="text-slate-900 dark:text-white font-bold">{currentStore?.name || 'your store'}</span> today.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm"
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
                                    className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm"
                                />
                                <span className="text-slate-400 text-xs font-bold">to</span>
                                <input 
                                    type="date" 
                                    value={customEnd} 
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm"
                                />
                                <Button size="sm" className="py-1.5 px-3 text-xs" onClick={fetchDashboardData}>Apply</Button>
                            </div>
                        )}
                    </div>
                    
                    <Button 
                        variant="outline" 
                        onClick={() => setIsEndOfDayOpen(true)}
                        className="rounded-2xl px-6 h-14 font-black text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    >
                        Z-Report
                    </Button>

                    <Link href="/store/pos">
                        <Button className="rounded-2xl px-8 h-14 bg-primary hover:bg-primary-dark text-white font-black gap-2 shadow-xl shadow-primary/20 hover:shadow-2xl transition-all group">
                            <Zap className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                            Open POS
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardStatCard
                    title="Gross Sales"
                    value={`Rs ${(stats?.todaySales || 0).toLocaleString()}`}
                    icon={<Coins className="w-6 h-6" />}
                    color="emerald"
                    trend={dateFilter === 'today' ? `${stats?.todayOrders || 0} orders today` : `${stats?.todayOrders || 0} orders in range`}
                    loading={loading}
                />
                <DashboardStatCard
                    title="Gross Purchases"
                    value={`Rs ${(stats?.todayPurchases || 0).toLocaleString()}`}
                    icon={<Receipt className="w-6 h-6" />}
                    color="rose"
                    trend={dateFilter === 'today' ? `${stats?.purchaseOrders || 0} purchases today` : `${stats?.purchaseOrders || 0} purchases in range`}
                    loading={loading}
                />
                <DashboardStatCard
                    title="Inventory Status"
                    value={(stats?.totalItems || 0).toString()}
                    subtitle={`${stats?.lowStockCount || 0} low stock alerts`}
                    icon={<Package className="w-6 h-6" />}
                    color="purple"
                    alert={stats?.lowStockCount > 0}
                    loading={loading}
                />
                <DashboardStatCard
                    title="Active Customers"
                    value={(stats?.activeCustomers || 0).toString()}
                    icon={<Users className="w-6 h-6" />}
                    color="amber"
                    trend="Loyalty members"
                    loading={loading}
                />
            </div>

            {/* Sales Trend Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-700/60 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Sales & Purchases Trend</h2>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Revenue Flow Over Time</p>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    {chartData && chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} tickFormatter={(val) => `Rs ${val}`} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                    formatter={(value: number) => [`Rs ${value.toFixed(2)}`, undefined]}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" name="Sales" />
                                <Area type="monotone" dataKey="purchases" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorPurchases)" name="Purchases" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Activity className="w-12 h-12 mb-3 opacity-20" />
                            <p className="font-bold">No trend data available for this period</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Transactions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                <Receipt className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Recent Transactions</h2>
                        </div>
                        <Link href="/store/transactions" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                            View All <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-700/60 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Order ID</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Time</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Method</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentTransactions.length > 0 ? recentTransactions.map((tx: any, index: number) => (
                                        <tr key={tx._id || tx.id || index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">#{tx.transactionNumber?.slice(-6) || 'N/A'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                                                    {tx.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-sm font-black text-slate-900 dark:text-white">Rs {(tx.total || tx.totalAmount || 0).toFixed(2)}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => setPrintingTx(tx)}
                                                    className="p-2 bg-slate-100 hover:bg-primary/10 text-slate-500 hover:text-primary rounded-lg transition-colors"
                                                    title="Print Receipt"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center">
                                                    <ShoppingCart className="w-12 h-12 text-slate-200 mb-2" />
                                                    <p className="text-slate-400 font-medium">No transactions found today</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Quick Actions & Alerts */}
                <div className="space-y-8">
                    {/* Quick Actions */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white px-2">Quick Actions</h2>
                        <div className="grid grid-cols-1 gap-3">
                            <QuickActionLink
                                href="/store/inventory"
                                icon={<Plus className="w-5 h-5" />}
                                label="Add New Product"
                                color="emerald"
                            />
                            <QuickActionLink
                                href="/store/customers"
                                icon={<Users className="w-5 h-5" />}
                                label="Register Customer"
                                color="blue"
                            />
                            <QuickActionLink
                                href="/store/reports"
                                icon={<TrendingUp className="w-5 h-5" />}
                                label="View Sales Reports"
                                color="purple"
                            />
                        </div>
                    </div>

                    {/* Low Stock Alerts */}
                    {lowStockItems.length > 0 && (
                        <div className="bg-rose-50 rounded-[2rem] p-6 border border-rose-100 space-y-4">
                            <div className="flex items-center gap-2 text-rose-600">
                                <AlertCircle className="w-5 h-5" />
                                <h2 className="font-black uppercase tracking-widest text-xs">Low Stock Alerts</h2>
                            </div>
                            <div className="space-y-3">
                                {lowStockItems.slice(0, 3).map((item: any, index: number) => (
                                    <div key={item._id || item.id || index} className="flex items-center justify-between gap-3 bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-rose-200/50">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{item.name}</p>
                                            <p className="text-[10px] text-rose-500 font-bold uppercase">{item.stock || 0} units left</p>
                                        </div>
                                        <Link href={`/store/inventory?search=${item.name}`}>
                                            <button className="p-2 h-8 w-8 bg-rose-600 text-white rounded-lg flex items-center justify-center hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                            <Link href="/store/inventory?filter=low-stock" className="block text-center text-xs font-black text-rose-600 hover:underline uppercase tracking-widest pt-2">
                                Manage Inventory
                            </Link>
                        </div>
                    )}

                    {/* Store Card */}
                    <div className="relative bg-gradient-to-br from-primary to-primary-dark dark:from-slate-800 dark:to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-primary/20 dark:shadow-slate-900/20 overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 dark:bg-slate-900/5 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/10 dark:bg-slate-900/10 rounded-2xl flex items-center justify-center mb-4">
                                <Store className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-black mb-1">{currentStore?.name || 'My Store'}</h3>
                            <p className="text-slate-400 text-sm font-medium mb-6">Store ID: #{currentStore?._id?.slice(-8).toUpperCase() || 'N/A'}</p>

                            <Link href="/store/settings">
                                <button className="w-full py-3 bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                    Store Settings
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <EndOfDayModal 
                isOpen={isEndOfDayOpen} 
                onClose={() => setIsEndOfDayOpen(false)} 
                storeId={currentStore?.id} 
            />

            {/* Print Receipt Modal / Layout */}
            {printingTx && (
                <div className="fixed inset-0 z-[200] bg-white flex flex-col print:bg-white print:static print:z-auto">
                    <div className="p-4 flex justify-between items-center bg-slate-100 border-b no-print">
                        <h2 className="font-bold">Print Receipt</h2>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setPrintingTx(null)}>Cancel</Button>
                            <Button onClick={() => window.print()} className="bg-primary text-white">Print</Button>
                        </div>
                    </div>
                    <div className="flex-1 flex justify-center p-8 print:p-0 pos-cart-container" style={{ width: '100%' }}>
                        <div className="w-[80mm] bg-white text-black p-4 text-xs mx-auto print:mx-0 print:p-0">
                            <div className="text-center mb-4">
                                <h1 className="font-black text-lg uppercase">{currentStore?.name || 'Store'}</h1>
                                <p>Receipt: #{printingTx.transactionNumber?.slice(-6) || 'N/A'}</p>
                                <p>{new Date(printingTx.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="border-t border-b border-dashed border-black py-2 mb-2">
                                {printingTx.items?.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between mb-1">
                                        <span className="truncate pr-2">{item.quantity}x {item.name || item.product?.name || 'Item'}</span>
                                        <span className="font-bold">{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between font-black text-sm">
                                <span>TOTAL</span>
                                <span>Rs {(printingTx.total || printingTx.totalAmount || 0).toFixed(2)}</span>
                            </div>
                            <div className="text-center mt-4">
                                <p>Thank you for shopping!</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DashboardStatCard({ title, value, subtitle, icon, color, trend, alert, loading }: any) {
    const colorVariants: any = {
        emerald: "bg-emerald-500 shadow-emerald-500/30",
        blue: "bg-blue-500 shadow-blue-500/30",
        purple: "bg-purple-500 shadow-purple-500/30",
        amber: "bg-amber-500 shadow-amber-500/30",
        rose: "bg-rose-500 shadow-rose-500/30"
    };

    const gradientBg: any = {
        emerald: "from-emerald-500/10 to-transparent",
        blue: "from-blue-500/10 to-transparent",
        purple: "from-purple-500/10 to-transparent",
        amber: "from-amber-500/10 to-transparent",
        rose: "from-rose-500/10 to-transparent"
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`bg-white dark:bg-slate-900 rounded-[2.5rem] p-7 border border-slate-200/60 dark:border-slate-700/60 shadow-xl relative overflow-hidden group bg-gradient-to-br ${gradientBg[color]}`}
        >
            <div className={`w-14 h-14 ${colorVariants[color]} rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500`}>
                {icon}
            </div>

            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                    {loading ? <span className="inline-block w-24 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></span> : value}
                </h3>
                {alert && <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>}
            </div>

            {(trend || subtitle) && (
                <p className={`mt-3 text-xs font-bold ${alert ? 'text-rose-500' : 'text-slate-500'}`}>
                    {trend || subtitle}
                </p>
            )}
        </motion.div>
    );
}

function QuickActionLink({ href, icon, label, color }: any) {
    const colorClasses: any = {
        emerald: "text-emerald-600 hover:bg-emerald-50",
        blue: "text-blue-600 hover:bg-blue-50",
        purple: "text-purple-600 hover:bg-purple-50"
    };

    return (
        <Link href={href}>
            <div className={`flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl transition-all cursor-pointer group shadow-sm hover:shadow-md ${colorClasses[color]}`}>
                <div className="flex items-center gap-3">
                    <div className="transition-transform group-hover:scale-110">
                        {icon}
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </div>
        </Link>
    );
}
