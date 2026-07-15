"use client";

import React, { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Search,
    Edit,
    Trash2,
    Mail,
    Phone,
    Banknote,
    UserCheck,
    TrendingUp,
    Receipt,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { customersApi, Customer } from '@/lib/api/customers';
import { Button, Input, AccessDenied } from '@/components/UI';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';

export default function CustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1, hasMore: false });
    const [stats, setStats] = useState({ total: 0, retail: 0, wholesale: 0, totalBalance: 0 });

    const { hasPermission, loading: permissionsLoading } = usePermissions();

    useEffect(() => {
        fetchCustomers();
    }, [page, search, typeFilter]);

    const fetchCustomers = async () => {
        try {
            const storeId = localStorage.getItem('storeId') || '';
            const params: any = {
                page,
                limit: 20,
                search: search || undefined
            };
            
            const [response, statsRes] = await Promise.all([
                customersApi.getAll(storeId, params),
                customersApi.getStats(storeId)
            ]);
            
            const customerData = Array.isArray(response.data.data) ? response.data.data : [];
            setCustomers(customerData);
            
            if (response.data.meta) {
                setMeta(response.data.meta);
            }
            
            if (statsRes.data.data) {
                setStats(statsRes.data.data);
            }
        } catch (error: any) {
            console.error('Fetch customers error:', error);
            if (error.code === 'ERR_NETWORK') {
                toast.error('Backend server not running');
            }
            setCustomers([]);
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        try {
            const storeId = localStorage.getItem('storeId') || '';
            await customersApi.delete(id, storeId);
            toast.success('Customer deleted successfully');
            fetchCustomers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete customer');
        }
    };

    // We rely on backend stats now

    if (initialLoad || permissionsLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!hasPermission(PERMISSIONS.VIEW_CUSTOMERS)) {
        return <AccessDenied />;
    }

    const canManage = hasPermission(PERMISSIONS.MANAGE_CUSTOMERS);

    return (
        <div className={`max-w-7xl mx-auto space-y-8 transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none animate-pulse' : 'opacity-100'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Customers</h1>
                    <p className="text-slate-500 mt-1">Manage your customer database</p>
                </div>
                {canManage && (
                    <Button onClick={() => { setSelectedCustomer(null); setShowModal(true); }} className="gap-2">
                        <Plus className="w-5 h-5" />
                        Add Customer
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Total Customers</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</h3>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Retail</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.retail}</h3>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Wholesale</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.wholesale}</h3>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Banknote className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Total Balance</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Rs {stats.totalBalance.toFixed(2)}</h3>
                </motion.div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search customers by name, email, or phone..."
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shrink-0"
                >
                    <option value="ALL">All Types</option>
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                </select>
            </div>

            {/* Table */}
            <div className="card-premium overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Customer</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Contact</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Type</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Balance</th>
                            {canManage && (
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => (
                            <tr 
                                key={customer.id} 
                                onClick={() => router.push(`/store/customers/${customer.id}`)}
                                className="border-b border-slate-50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer"
                            >
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <Users className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-slate-200">{customer.name}</p>
                                            <p className="text-xs text-slate-400">{customer.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <Phone className="w-4 h-4" />
                                        {customer.phone}
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${customer.customerType === 'WHOLESALE'
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-blue-50 text-blue-600'
                                        }`}>
                                        {customer.customerType}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`font-bold ${(customer.outstandingBalance || 0) > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                                        Rs {Math.abs(customer.outstandingBalance || 0).toFixed(2)}
                                    </span>
                                </td>
                                {canManage && (
                                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => { setSelectedCustomer(customer); setShowModal(true); }}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                                title="Edit Customer"
                                            >
                                                <Edit className="w-4 h-4 text-slate-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                className="p-2 hover:bg-rose-50 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4 text-rose-400" />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                {meta.totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-sm text-slate-500 font-medium">
                            Showing page {meta.page} of {meta.totalPages} ({meta.total} total customers)
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
                
                {customers.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">No customers found</p>
                        <p className="text-sm text-slate-400 mt-2">Add your first customer to get started</p>
                    </div>
                )}
            </div>

            {showModal && (
                <CustomerModal
                    customer={selectedCustomer}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { fetchCustomers(); setShowModal(false); }}
                />
            )}
        </div>
    );
}

function CustomerModal({ customer, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        name: customer?.name || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        customerType: customer?.customerType || 'RETAIL',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const storeId = localStorage.getItem('storeId') || 'default-store-id';

            if (customer) {
                await customersApi.update(customer.id, storeId, formData);
                toast.success('Customer updated successfully');
            } else {
                await customersApi.create(storeId, formData);
                toast.success('Customer created successfully');
            }
            onSuccess();
        } catch (error: any) {
            const message = error.response?.data?.message || error.response?.data?.error?.message || 'Operation failed';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    {customer ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                        <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Customer Type</label>
                        <select
                            value={formData.customerType}
                            onChange={(e) => setFormData({ ...formData, customerType: e.target.value as any })}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                            required
                        >
                            <option value="RETAIL">Retail</option>
                            <option value="WHOLESALE">Wholesale</option>
                        </select>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button type="button" onClick={onClose} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? 'Saving...' : customer ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}


