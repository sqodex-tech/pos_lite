"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, Mail, MapPin, Receipt, Wallet, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

import { suppliersApi, Supplier } from '@/lib/api/suppliers';
import { transactionsApi } from '@/lib/api/transactions';
import { Button, Input } from '@/components/UI';
import BalanceDisplay from '@/components/UI/BalanceDisplay';

export default function SupplierProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [statement, setStatement] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [isRecordingPayment, setIsRecordingPayment] = useState(false);

    const [dateFilter, setDateFilter] = useState('1_month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    useEffect(() => {
        if (dateFilter !== 'custom') {
            fetchData();
        }
    }, [id, dateFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const storeId = localStorage.getItem('storeId') || '';
            let end = new Date();
            let start = new Date();
            
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
                    start.setFullYear(start.getFullYear() - 1);
                }
            } else {
                start.setFullYear(start.getFullYear() - 1);
            }
            
            console.log("DEBUG: ID=", id, typeof id);
            console.log("DEBUG: StoreID=", storeId, typeof storeId);

            const [custRes, stmtRes] = await Promise.all([
                suppliersApi.getById(id, storeId),
                transactionsApi.getPartyStatement(id, storeId, {
                    partyType: 'SUPPLIER',
                    startDate: start.toISOString(),
                    endDate: end.toISOString()
                })
            ]);

            setSupplier(custRes.data.data);
            console.log("DEBUG statement res:", stmtRes.data.data);
            setStatement(stmtRes.data.data);
        } catch (error: any) {
            console.error('Supplier profile load error details:');
            console.error('Is Axios Error:', error.isAxiosError);
            console.error('Status:', error.response?.status);
            console.error('Data:', error.response?.data);
            console.error('Message:', error.message);
            console.error('Config URL:', error.config?.url);
            toast.error(error.response?.data?.message || 'Failed to load supplier profile');
        } finally {
            setLoading(false);
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsRecordingPayment(true);
        try {
            const storeId = localStorage.getItem('storeId') || '';
            await suppliersApi.recordPayment(storeId, id, {
                amount: parseFloat(paymentAmount),
                paymentMethod,
                reference: 'Manual Payment'
            });
            toast.success('Payment recorded successfully');
            setPaymentAmount('');
            fetchData();
        } catch (error: any) {
            console.error("Payment error:", error.response?.data);
            toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to record payment');
        } finally {
            setIsRecordingPayment(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!supplier) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <p className="text-slate-500">Supplier not found.</p>
                <Button onClick={() => router.push('/store/suppliers')}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <button 
                onClick={() => router.push('/store/suppliers')}
                className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium text-sm"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Suppliers
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Overview */}
                <div className="lg:col-span-1 space-y-6">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <User className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{supplier.name}</h2>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span>{supplier.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span>{supplier.email || 'N/A'}</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-premium p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-primary" /> Financial Overview
                        </h3>
                        
                        <div className="space-y-4">
                            <BalanceDisplay 
                                balance={statement?.currentBalance ?? supplier.payableBalance ?? 0}
                                partyType="SUPPLIER"
                                size="sm"
                                showBreakdown={true}
                                className="!border-rose-100 dark:!border-rose-900/20"
                            />                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Purchases</p>
                                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                        Rs {(statement?.totalPurchases || 0).toFixed(2)}
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Payments</p>
                                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                        Rs {(statement?.totalPayments || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-premium p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-primary" /> Record Payment
                        </h3>
                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Amount Paid (Rs)</label>
                                <Input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    required
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Payment Method</label>
                                <select 
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="CARD">Card</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                </select>
                            </div>
                            <Button type="submit" disabled={isRecordingPayment} className="w-full">
                                {isRecordingPayment ? 'Processing...' : 'Submit Payment'}
                            </Button>
                        </form>
                    </motion.div>
                </div>

                {/* Transaction History */}
                <div className="lg:col-span-2">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-premium h-full flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 shrink-0">
                                <Activity className="w-5 h-5 text-primary" /> Transaction Ledger
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
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
                                            className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                        />
                                        <span className="text-slate-400 text-xs">to</span>
                                        <input 
                                            type="date" 
                                            value={customEnd} 
                                            onChange={(e) => setCustomEnd(e.target.value)}
                                            className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                        />
                                        <button onClick={fetchData} className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all">Apply</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="text-left p-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Date</th>
                                        <th className="text-left p-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Reference</th>
                                        <th className="text-left p-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Details</th>
                                        <th className="text-right p-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Bill Total</th>
                                        <th className="text-right p-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Paid</th>
                                        <th className="text-right p-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...(statement?.transactions || [])].reverse().map((txn: any, i: number) => {
                                        const isPayment = txn.type === 'PAYMENT_SENT';
                                        const billTotal = isPayment ? 0 : (txn.total || 0);
                                        const paid = isPayment ? (txn.total || 0) : ((txn.total || 0) - (txn.impact || 0));
                                        
                                        return (
                                        <tr key={i} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4 text-slate-600 dark:text-slate-400">
                                                {new Date(txn.date).toLocaleDateString()}
                                                <div className="text-[10px] opacity-70">{new Date(txn.date).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                                                {txn.transactionNumber || 'Manual Payment'}
                                                <div className="text-[10px] text-slate-400 uppercase mt-0.5">{txn.type}</div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                                {txn.items && txn.items.length > 0 && (
                                                    <div className="mb-1 leading-tight max-w-[200px] truncate">
                                                        <span className="font-bold text-slate-500">Items: </span>
                                                        <span className="text-xs" title={txn.items.map((i: any) => `${i.itemName} x${i.quantity}`).join(', ')}>
                                                            {txn.items.map((i: any) => `${i.itemName} x${i.quantity}`).join(', ')}
                                                        </span>
                                                    </div>
                                                )}
                                                {txn.paymentMethod && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                            {txn.paymentMethod}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-right text-slate-800 dark:text-slate-200 font-medium">
                                                {billTotal > 0 ? `Rs ${billTotal.toFixed(2)}` : '-'}
                                            </td>
                                            <td className="p-4 text-right text-emerald-600 font-medium">
                                                {paid > 0 ? `Rs ${paid.toFixed(2)}` : '-'}
                                            </td>
                                            <td className="p-4 text-right font-black text-slate-900 dark:text-white">
                                                Rs {txn.balance.toFixed(2)}
                                            </td>
                                        </tr>
                                    )})}
                                    {(!statement?.transactions || statement.transactions.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="text-center p-12 text-slate-400 font-medium">
                                                No transactions found for this supplier.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
