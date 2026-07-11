"use client";

import React, { useState, useEffect } from 'react';
import {
    Truck,
    Plus,
    Search,
    Edit,
    Trash2,
    Mail,
    Phone,
    Banknote,
    Calendar,
    User
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { suppliersApi, Supplier } from '@/lib/api/suppliers';
import { Button, Input, AccessDenied } from '@/components/UI';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [stats, setStats] = useState({
        total: 0,
        totalBalance: 0,
        avgPaymentTerms: 0
    });
    const { hasPermission, loading: permissionsLoading } = usePermissions();

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await suppliersApi.getAll();
            const supplierData = Array.isArray(response.data.data) ? response.data.data : [];
            setSuppliers(supplierData);

            // Calculate stats
            const totalBalance = supplierData.reduce((sum: number, s: Supplier) => sum + (s.balance || 0), 0);
            const avgPaymentTerms = supplierData.length > 0
                ? supplierData.reduce((sum: number, s: Supplier) => sum + s.paymentTermsDays, 0) / supplierData.length
                : 0;

            setStats({
                total: supplierData.length,
                totalBalance,
                avgPaymentTerms: Math.round(avgPaymentTerms)
            });
        } catch (error: any) {
            console.error('Fetch suppliers error:', error);
            if (error.code === 'ERR_NETWORK') {
                toast.error('Backend server not running');
            }
            setSuppliers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this supplier?')) return;
        try {
            const storeId = localStorage.getItem('storeId') || '';
            await suppliersApi.delete(id, storeId);
            toast.success('Supplier deleted successfully');
            fetchSuppliers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete supplier');
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.contactPerson.toLowerCase().includes(search.toLowerCase())
    );

    if (loading || permissionsLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!hasPermission(PERMISSIONS.VIEW_SUPPLIERS)) {
        return <AccessDenied />;
    }

    const canManage = hasPermission(PERMISSIONS.MANAGE_SUPPLIERS);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Suppliers</h1>
                    <p className="text-slate-500 mt-1">Manage your supplier relationships</p>
                </div>
                {canManage && (
                    <Button onClick={() => { setSelectedSupplier(null); setShowModal(true); }} className="gap-2">
                        <Plus className="w-5 h-5" />
                        Add Supplier
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Truck className="w-5 h-5 text-primary" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Total Suppliers</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</h3>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Banknote className="w-5 h-5 text-rose-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Total Payable</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Rs {stats.totalBalance.toFixed(2)}</h3>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Avg Payment Terms</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgPaymentTerms} days</h3>
                </motion.div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search suppliers by name, email, or contact person..."
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="card-premium overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Supplier</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Contact Person</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Contact Info</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Payment Terms</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Balance</th>
                            {canManage && (
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSuppliers.map((supplier) => (
                            <tr key={supplier.id} className="border-b border-slate-50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <Truck className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-slate-200">{supplier.name}</p>
                                            <p className="text-xs text-slate-400">{supplier.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <User className="w-4 h-4" />
                                        {supplier.contactPerson}
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                            <Mail className="w-3 h-3" />
                                            {supplier.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                            <Phone className="w-3 h-3" />
                                            {supplier.phone}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600">
                                        {supplier.paymentTermsDays} days
                                    </span>
                                </td>
                                <td className="py-4 px-4">
                                    <span className={`font-bold ${(supplier.balance || 0) > 0 ? 'text-rose-600' : 'text-slate-600 dark:text-slate-400'
                                        }`}>Rs {(supplier.balance || 0).toFixed(2)}
                                    </span>
                                </td>
                                {canManage && (
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => { setSelectedSupplier(supplier); setShowModal(true); }}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                            >
                                                <Edit className="w-4 h-4 text-slate-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(supplier.id)}
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

                {filteredSuppliers.length === 0 && (
                    <div className="text-center py-12">
                        <Truck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">No suppliers found</p>
                        <p className="text-sm text-slate-400 mt-2">Add your first supplier to get started</p>
                    </div>
                )}
            </div>

            {showModal && (
                <SupplierModal
                    supplier={selectedSupplier}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { fetchSuppliers(); setShowModal(false); }}
                />
            )}
        </div>
    );
}

function SupplierModal({ supplier, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        name: supplier?.name || '',
        contactPerson: supplier?.contactPerson || '',
        email: supplier?.email || '',
        phone: supplier?.phone || '',
        paymentTermsDays: supplier?.paymentTermsDays || 30,
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const storeId = localStorage.getItem('storeId') || 'default-store-id';

            if (supplier) {
                await suppliersApi.update(supplier.id, storeId, formData);
                toast.success('Supplier updated successfully');
            } else {
                await suppliersApi.create(storeId, formData);
                toast.success('Supplier created successfully');
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
                    {supplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Company Name</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contact Person</label>
                        <Input
                            value={formData.contactPerson}
                            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
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
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Payment Terms (Days)</label>
                        <Input
                            type="number"
                            value={formData.paymentTermsDays}
                            onChange={(e) => setFormData({ ...formData, paymentTermsDays: parseInt(e.target.value) })}
                            required
                            min="0"
                        />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button type="button" onClick={onClose} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? 'Saving...' : supplier ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
