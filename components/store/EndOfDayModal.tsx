"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calculator, CreditCard, Clock, Receipt, Banknote } from 'lucide-react';
import { transactionsApi } from '@/lib/api/transactions';
import { Button } from '@/components/UI';
import toast from 'react-hot-toast';

interface EndOfDayModalProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
}

export default function EndOfDayModal({ isOpen, onClose, storeId }: EndOfDayModalProps) {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<any>(null);

    useEffect(() => {
        if (isOpen && storeId) {
            fetchTodayTransactions();
        }
    }, [isOpen, storeId]);

    const fetchTodayTransactions = async () => {
        try {
            setLoading(true);
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            
            const end = new Date();
            end.setHours(23, 59, 59, 999);

            const res = await transactionsApi.getAll(storeId, {
                limit: 1000,
                startDate: start.toISOString(),
                endDate: end.toISOString()
            });

            const transactions = Array.isArray(res.data?.data) ? res.data.data : [];

            let cashSales = 0;
            let cardSales = 0;
            let creditSales = 0;
            
            let cashPurchases = 0;
            let cardPurchases = 0;
            let creditPurchases = 0;

            transactions.forEach(tx => {
                const total = tx.total || tx.totalAmount || 0;
                const method = tx.paymentMethod || 'CASH';
                
                if (tx.type === 'SALE') {
                    if (method === 'CASH') cashSales += total;
                    else if (method === 'CARD') cardSales += total;
                    else if (method === 'CREDIT') creditSales += total;
                    else if (method === 'MIXED' && tx.paymentDetails) {
                        cashSales += tx.paymentDetails.cash || 0;
                        cardSales += tx.paymentDetails.card || 0;
                        creditSales += tx.paymentDetails.credit || 0;
                    }
                } else if (tx.type === 'PURCHASE') {
                    if (method === 'CASH') cashPurchases += total;
                    else if (method === 'CARD') cardPurchases += total;
                    else if (method === 'CREDIT') creditPurchases += total;
                    else if (method === 'MIXED' && tx.paymentDetails) {
                        cashPurchases += tx.paymentDetails.cash || 0;
                        cardPurchases += tx.paymentDetails.card || 0;
                        creditPurchases += tx.paymentDetails.credit || 0;
                    }
                }
            });

            const expectedCash = cashSales - cashPurchases;

            setReport({
                cashSales,
                cardSales,
                creditSales,
                cashPurchases,
                cardPurchases,
                creditPurchases,
                expectedCash,
                totalTransactions: transactions.length
            });

        } catch (error) {
            console.error('Failed to fetch transactions', error);
            toast.error('Failed to generate end of day report');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800"
                >
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Calculator className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-slate-800 dark:text-white">End of Day Report</h3>
                                <p className="text-xs font-bold text-slate-400">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-full transition-colors shadow-sm no-print"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 pos-cart-container">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <p className="text-sm font-bold text-slate-400">Calculating totals...</p>
                            </div>
                        ) : report ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                                            <Banknote className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase">Cash Sales</span>
                                        </div>
                                        <p className="text-xl font-black text-slate-800 dark:text-white">Rs {report.cashSales.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                                            <CreditCard className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase">Card Sales</span>
                                        </div>
                                        <p className="text-xl font-black text-slate-800 dark:text-white">Rs {report.cardSales.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase">Credit Sales</span>
                                        </div>
                                        <p className="text-xl font-black text-slate-800 dark:text-white">Rs {report.creditSales.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-4 border border-rose-100 dark:border-rose-900/50">
                                        <div className="flex items-center gap-2 text-rose-500 mb-2">
                                            <Receipt className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase">Cash Paid Out</span>
                                        </div>
                                        <p className="text-xl font-black text-rose-600 dark:text-rose-400">Rs {report.cashPurchases.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Expected Cash</p>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Cash Sales - Cash Paid Out</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-primary">Rs {report.expectedCash.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-slate-500">No data available.</p>
                        )}
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 no-print">
                        <Button variant="outline" onClick={onClose}>Close</Button>
                        <Button 
                            className="bg-primary hover:bg-primary-dark text-white font-black shadow-lg shadow-primary/20"
                            onClick={() => window.print()}
                        >
                            Print Summary
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
