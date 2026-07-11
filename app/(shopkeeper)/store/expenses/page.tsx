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
    const [showModal, setShowModal] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        thisMonth: 0,
        categories: 0
    });
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

            // Calculate stats
            const total = expenseData.reduce((sum: number, exp: Expense) => sum + exp.amount, 0);
            const thisMonth = expenseData
                .filter((exp: Expense) => new Date(exp.date).getMonth() === new Date().getMonth())
                .reduce((sum: number, exp: Expense) => sum + exp.amount, 0);
            const categories = new Set(expenseData.map((exp: Expense) => exp.category)).size;

            setStats({ total, thisMonth, categories });
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
            setStats({ total: 0, thisMonth: 0, categories: 0 });
        } finally {
            setLoading(false);
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

    if (loading || permissionsLoading) {
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
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
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
                        {expenses.map((expense) => (
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
                {expenses.length === 0 && (
                    <div className="text-center py-12">
                        <Wallet className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">No expenses recorded yet</p>
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
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const storeId = localStorage.getItem('storeId') || 'default-store-id';
            await expensesApi.create(storeId, {
                ...formData,
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
                            <option value="Other">Other</option>
                        </select>
                    </div>
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
