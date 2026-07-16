"use client";

import React, { useState, useEffect } from 'react';
import { Receipt, Calendar, Banknote, CreditCard, X, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { transactionsApi, Transaction } from '@/lib/api/transactions';
import { reportsApi } from '@/lib/api/reports';
import { AccessDenied, Button } from '@/components/UI';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [dateFilter, setDateFilter] = useState<'today' | '7days' | '15days' | '1month' | '3months' | '6months' | '12months' | 'custom' | 'all'>('today');
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1, hasMore: false });
    const [pageStats, setPageStats] = useState({ sales: 0, transactions: 0 });
    const { hasPermission, loading: permissionsLoading } = usePermissions();

    useEffect(() => {
        fetchTransactions();
        
        const intervalId = setInterval(() => {
            fetchTransactions();
        }, 15000);
        
        return () => clearInterval(intervalId);
    }, [dateFilter, customDateRange, page]);

    const fetchTransactions = async () => {
        try {
            const storeId = localStorage.getItem('storeId');
            if (!storeId) {
                setLoading(false);
                return;
            }
            
            const params: any = {};
            const end = new Date();
            const start = new Date();
            start.setHours(0, 0, 0, 0);

            if (dateFilter !== 'all') {
                if (dateFilter === '7days') start.setDate(start.getDate() - 7);
                else if (dateFilter === '15days') start.setDate(start.getDate() - 15);
                else if (dateFilter === '1month') start.setMonth(start.getMonth() - 1);
                else if (dateFilter === '3months') start.setMonth(start.getMonth() - 3);
                else if (dateFilter === '6months') start.setMonth(start.getMonth() - 6);
                else if (dateFilter === '12months') start.setFullYear(start.getFullYear() - 1);
                else if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
                    start.setTime(new Date(customDateRange.start).getTime());
                    end.setTime(new Date(customDateRange.end).getTime());
                    end.setHours(23, 59, 59, 999);
                }

                if (dateFilter !== 'custom' || (customDateRange.start && customDateRange.end)) {
                    params.startDate = start.toISOString();
                    params.endDate = end.toISOString();
                }
            } else {
                // For 'all', we still need to provide dates to the reports API
                const allStart = new Date(2000, 0, 1);
                params.startDate = allStart.toISOString();
                params.endDate = end.toISOString();
            }
            
            params.page = page;
            params.limit = 20;
            
            const [response, statsRes] = await Promise.all([
                transactionsApi.getAll(storeId, params),
                reportsApi.getProfitLoss({ 
                    storeId, 
                    startDate: params.startDate || new Date(2000, 0, 1).toISOString(), 
                    endDate: params.endDate || new Date().toISOString() 
                })
            ]);
            
            const txnData = Array.isArray(response.data.data) ? response.data.data : [];
            setTransactions(txnData);
            if (response.data.meta) {
                setMeta(response.data.meta);
            }
            if (statsRes.data.data) {
                setPageStats({
                    sales: statsRes.data.data.revenue?.totalSales || 0,
                    transactions: statsRes.data.data.revenue?.salesCount || 0
                });
            }
        } catch (error: any) {
            console.error('Fetch transactions error:', error);

            // Check if it's a connection error
            if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
                console.warn('Backend API is not running. Please start the backend server on port 5001.');
            } else if (error.response?.status === 401) {
                console.error('Authentication failed. Redirecting to login...');
                setTimeout(() => window.location.href = '/login', 2000);
            }

            setTransactions([]);
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    };

    if (initialLoad || permissionsLoading) {
        return <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>;
    }

    if (!hasPermission(PERMISSIONS.VIEW_TRANSACTIONS)) {
        return <AccessDenied />;
    }

    // Removed client-side aggregations

    return (
        <div className={`max-w-7xl mx-auto space-y-8 transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none animate-pulse' : 'opacity-100'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Transaction History</h1>
                    <p className="text-slate-500 mt-1">View all sales and transactions</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select 
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as any)}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="today">Today</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="15days">Last 15 Days</option>
                        <option value="1month">Last 1 Month</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="6months">Last 6 Months</option>
                        <option value="12months">Last 12 Months</option>
                        <option value="all">All Time</option>
                        <option value="custom">Custom Date</option>
                    </select>

                    {dateFilter === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input 
                                type="date"
                                value={customDateRange.start}
                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <span className="text-slate-400">to</span>
                            <input 
                                type="date"
                                value={customDateRange.end}
                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Receipt className="w-5 h-5 text-primary" />
                        <span className="text-xs font-bold text-slate-400 uppercase">
                            {dateFilter === 'today' ? "Today's Bill" : 'Total Billed'}
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Rs {pageStats.sales.toFixed(2)}</h3>
                </div>
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Banknote className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Avg Transaction</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Rs {(pageStats.transactions > 0 ? pageStats.sales / pageStats.transactions : 0).toFixed(2)}</h3>
                </div>
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Receipt className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Transactions</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{pageStats.transactions}</h3>
                </div>
            </div>

            <div className="card-premium overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Transaction #</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Items</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Total</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Payment</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((txn) => (
                            <tr 
                                key={txn.id} 
                                onClick={() => setSelectedTransaction(txn)}
                                className="border-b border-slate-50 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                            >
                                <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">{txn.transactionNumber}</td>
                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                    {new Date(txn.createdAt).toLocaleDateString()}
                                    <div className="text-[10px] opacity-70 mt-0.5">{new Date(txn.createdAt).toLocaleTimeString()}</div>
                                </td>
                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">{txn.items.length}</td>
                                <td className="py-4 px-4 font-bold text-primary">Rs {txn.total.toFixed(2)}</td>
                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">{txn.paymentMethod}</td>
                                <td className="py-4 px-4">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
                                        {txn.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {transactions.length === 0 && (
                    <div className="text-center py-12">
                        <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400">No transactions found</p>
                    </div>
                )}
                
                {/* Pagination Controls */}
                {meta.totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-sm text-slate-500 font-medium">
                            Showing page {meta.page} of {meta.totalPages} ({meta.total} total records)
                        </span>
                        <div className="flex gap-2">
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="px-4 py-2"
                            >
                                Previous
                            </Button>
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                disabled={!meta.hasMore}
                                onClick={() => setPage(page + 1)}
                                className="px-4 py-2"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            {/* Transaction Details Modal */}
            <AnimatePresence>
                {selectedTransaction && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTransaction(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Receipt className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                            {selectedTransaction.transactionNumber}
                                        </h2>
                                        <p className="text-sm text-slate-500 font-medium">
                                            {new Date(selectedTransaction.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedTransaction(null)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-6">
                                    {/* Order Items */}
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Purchased Items</h3>
                                        <div className="space-y-3">
                                            {selectedTransaction.items.map((item, idx) => (
                                                <div key={item.itemId || idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-sm">
                                                            <Package className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-slate-200">{item.itemName}</p>
                                                            <p className="text-sm text-slate-500">{item.quantity} × Rs {item.price.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-200">Rs {item.total.toFixed(2)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 space-y-3">
                                        <div className="flex justify-between text-sm font-medium text-slate-500">
                                            <span>Subtotal</span>
                                            <span>Rs {selectedTransaction.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-medium text-slate-500">
                                            <span>Tax (10%)</span>
                                            <span>Rs {selectedTransaction.tax.toFixed(2)}</span>
                                        </div>
                                        <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                            <span className="font-bold text-slate-900 dark:text-white">Total Paid ({selectedTransaction.paymentMethod})</span>
                                            <span className="text-xl font-black text-primary">Rs {selectedTransaction.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
