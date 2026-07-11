"use client";

import React, { useState, useEffect } from 'react';
import { Receipt, Calendar, Banknote, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { transactionsApi, Transaction } from '@/lib/api/transactions';
import { AccessDenied } from '@/components/UI';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission, loading: permissionsLoading } = usePermissions();

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const storeId = localStorage.getItem('storeId');
            if (!storeId) {
                setLoading(false);
                return;
            }
            
            const response = await transactionsApi.getAll(storeId);
            const txnData = Array.isArray(response.data.data) ? response.data.data : [];
            setTransactions(txnData);
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
        }
    };

    if (loading || permissionsLoading) {
        return <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>;
    }

    if (!hasPermission(PERMISSIONS.VIEW_TRANSACTIONS)) {
        return <AccessDenied />;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Transaction History</h1>
                <p className="text-slate-500 mt-1">View all sales and transactions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Banknote className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Today's Sales</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Rs 0.00</h3>
                </div>
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Receipt className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Transactions</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{transactions.length}</h3>
                </div>
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Avg. Transaction</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Rs 0.00</h3>
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
                            <tr key={txn._id} className="border-b border-slate-50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">{txn.transactionNumber}</td>
                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                    {new Date(txn.createdAt).toLocaleDateString()}
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
            </div>
        </div>
    );
}
