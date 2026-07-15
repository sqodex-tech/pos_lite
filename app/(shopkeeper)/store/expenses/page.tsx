"use client";

import React, { useState, useEffect } from 'react';
import { Wallet, Plus, TrendingDown, Calendar, Tag, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { expensesApi, Expense } from '@/lib/api/expenses';
import { Button, Input, AccessDenied } from '@/components/UI';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [dateFilter, setDateFilter] = useState('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const { hasPermission, loading: permissionsLoading } = usePermissions();

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const storeId = localStorage.getItem('storeId') || 'default-store-id';
            const response = await expensesApi.getAll(storeId);
            const expenseData = Array.isArray(response.data.data) ? response.data.data : [];
            setExpenses(expenseData);
        } catch (error: any) {
            console.error('Fetch expenses error:', error);

            // Check if it's a connection error
            if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
                console.warn('Backend API is not running. Please start the backend server on port 5001.');
            } else if (error.response?.status === 401) {
                console.error('Authentication failed. Redirecting to login...');
                setTimeout(() => window.location.href = '/login', 2000);
            }

            setExpenses([]);
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            await expensesApi.delete(id);
            toast.success('Expense deleted successfully');
            fetchExpenses();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete expense');
        }
    };

    const filteredExpenses = expenses.filter(exp => {
        let matchesDate = true;
        if (dateFilter !== 'all' && exp.date) {
            const expDate = new Date(exp.date);
            let start = new Date();
            let end = new Date();
            start.setHours(0, 0, 0, 0);

            if (dateFilter === 'today') {
                // start is already today at 00:00
            } else if (dateFilter === '15_days') {
                start.setDate(start.getDate() - 15);
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
                    matchesDate = true;
                }
            }
            if (dateFilter !== 'custom' || (customStart && customEnd)) {
                matchesDate = expDate >= start && expDate <= end;
            }
        }
        return matchesDate;
    });

    const stats = {
        total: filteredExpenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0),
        thisMonth: filteredExpenses
            .filter((exp: Expense) => new Date(exp.date).getMonth() === new Date().getMonth())
            .reduce((sum: number, exp: Expense) => sum + exp.amount, 0),
        categories: new Set(filteredExpenses.map((exp: Expense) => exp.category)).size
    };

    if (initialLoad || permissionsLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!hasPermission(PERMISSIONS.VIEW_EXPENSES)) {
        return <AccessDenied />;
    }

    const canManage = hasPermission(PERMISSIONS.CREATE_EXPENSE);

    return (
        <div className={`max-w-7xl mx-auto space-y-8 transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none animate-pulse' : 'opacity-100'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Store Expenses</h1>
                    <p className="text-slate-500 mt-1">Track and manage store expenses</p>
                </div>
                {canManage && (
                    <Button onClick={() => setShowModal(true)} className="gap-2">
                        <Plus className="w-5 h-5" />
                        Add Expense
                    </Button>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shrink-0"
                >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="15_days">15 Days</option>
                    <option value="1_month">1 Month</option>
                    <option value="3_months">3 Months</option>
                    <option value="custom">Custom Dates</option>
                </select>
                
                {dateFilter === 'custom' && (
                    <div className="flex items-center gap-2 shrink-0">
                        <input 
                            type="date" 
                            value={customStart} 
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <span className="text-slate-400 font-bold">to</span>
                        <input 
                            type="date" 
                            value={customEnd} 
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Wallet className="w-5 h-5 text-rose-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Total Expenses</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Rs {stats.total.toFixed(2)}</h3>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingDown className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">This Month</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Rs {stats.thisMonth.toFixed(2)}</h3>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Tag className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Categories</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.categories}</h3>
                </motion.div>
            </div>

            <div className="card-premium overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Description</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Category</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.map((expense) => (
                            <tr key={expense._id} className="border-b border-slate-50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">{expense.description}</td>
                                <td className="py-4 px-4">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600">
                                        {expense.category}
                                    </span>
                                </td>
                                <td className="py-4 px-4 font-bold text-rose-600">Rs {expense.amount.toFixed(2)}</td>
                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                    {new Date(expense.date).toLocaleDateString()}
                                </td>
                                <td className="py-4 px-4">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
                                        {expense.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredExpenses.length === 0 && (
                    <div className="p-8 text-center">
                        <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No expenses found</h3>
                        <p className="text-slate-500 mt-1">Try adjusting your date filter or add a new expense.</p>
                    </div>
                )}
            </div>

            {showModal && (
                <ExpenseModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { fetchExpenses(); setShowModal(false); }}
                />
            )}
        </div>
    );
}

function ExpenseModal({ onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [customCategory, setCustomCategory] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const storeId = localStorage.getItem('storeId') || 'default-store-id';
            const finalCategory = formData.category === 'Other' ? customCategory : formData.category;
            await expensesApi.create(storeId, {
                ...formData,
                category: finalCategory,
                amount: parseFloat(formData.amount)
            });
            toast.success('Expense added successfully');
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add expense');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full"
            >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Add Expense</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Amount</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date</label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                            required
                        >
                            <option value="">Select Category</option>
                            <option value="Rent">Rent</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Salaries">Salaries</option>
                            <option value="Supplies">Supplies</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Personal">Personal</option>
                            <option value="Profit Out">Profit Out</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    {formData.category === 'Other' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Custom Category</label>
                            <Input
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                placeholder="Enter custom category"
                                required
                            />
                        </div>
                    )}
                    <div className="flex gap-4 pt-4">
                        <Button type="button" onClick={onClose} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? 'Adding...' : 'Add Expense'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
