"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Store as StoreIcon,
    Plus,
    Search,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Building2,
    Phone,
    MapPin,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Store, adminStoresApi } from '@/lib/api/stores';
import { tenantsApi, Tenant } from '@/lib/api/tenants';
import { Button } from '@/components/UI';
import StoreModal from './components/StoreModal';

export default function StoresAdminPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [tenantFilter, setTenantFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);

    const fetchStores = useCallback(async () => {
        try {
            setLoading(true);
            const params: any = { page: 1, limit: 200 };
            if (search) params.search = search;
            if (tenantFilter) params.tenantId = tenantFilter;
            const res = await adminStoresApi.getAll(params);
            const data = Array.isArray(res.data.data) ? res.data.data : [];
            setStores(data);
        } catch (error: any) {
            console.error('Fetch stores error:', error);
            if (error.code === 'ERR_NETWORK') {
                toast.error('Cannot connect to backend API.');
            } else if (error.response?.status === 401) {
                toast.error('Authentication failed. Please login again.');
                setTimeout(() => window.location.href = '/login', 2000);
            } else {
                toast.error(error.response?.data?.message || 'Failed to fetch stores');
            }
            setStores([]);
        } finally {
            setLoading(false);
        }
    }, [search, tenantFilter]);

    const fetchTenants = async () => {
        try {
            const res = await tenantsApi.getAll({ page: 1, limit: 200 });
            setTenants(Array.isArray(res.data.data) ? res.data.data : []);
        } catch {
            setTenants([]);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    const handleDelete = async (store: Store) => {
        if (!confirm(`Are you sure you want to delete "${store.name}"?`)) return;
        try {
            const tid = typeof store.tenantId === 'string' ? store.tenantId : store.tenantId._id;
            await adminStoresApi.delete(tid, store._id);
            toast.success('Store deleted successfully');
            fetchStores();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete store');
        }
    };

    const handleToggleStatus = async (store: Store) => {
        try {
            const tid = typeof store.tenantId === 'string' ? store.tenantId : store.tenantId._id;
            const newStatus = store.status === 'active' ? 'inactive' : 'active';
            await adminStoresApi.update(tid, store._id, { status: newStatus });
            toast.success(`Store ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
            fetchStores();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const getTenantName = (store: Store) => {
        if (typeof store.tenantId === 'object' && store.tenantId?.name) {
            return store.tenantId.name;
        }
        return 'Unknown Tenant';
    };

    // Stats
    const activeCount = stores.filter((s) => s.status === 'active').length;
    const inactiveCount = stores.filter((s) => s.status === 'inactive').length;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Store Management</h1>
                    <p className="text-slate-500 mt-1">
                        Manage all stores across tenants • {stores.length} total stores
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => fetchStores()}
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => { setSelectedStore(null); setShowModal(true); }}
                        className="gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Store
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <StoreIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800 dark:text-slate-200">{stores.length}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Stores</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <ToggleRight className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800 dark:text-slate-200">{activeCount}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <ToggleLeft className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800 dark:text-slate-200">{inactiveCount}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inactive</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search stores by name or code..."
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    value={tenantFilter}
                    onChange={(e) => setTenantFilter(e.target.value)}
                    className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 min-w-[200px]"
                >
                    <option value="">All Tenants</option>
                    {tenants.map((t) => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                </select>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
            ) : stores.length === 0 ? (
                <div className="text-center py-20">
                    <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-slate-400">No stores found</p>
                    <p className="text-sm text-slate-400 mt-1">Create the first store for a tenant using the button above.</p>
                </div>
            ) : (
                /* Store Table */
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Store</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Code</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Tenant</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Contact</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Created</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {stores.map((store, idx) => (
                                        <motion.tr
                                            key={store._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="border-b border-slate-50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            {/* Store Name */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                                        <StoreIcon className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{store.name}</p>
                                                        {store.address && (
                                                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                                <MapPin className="w-3 h-3" /> {store.address}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Code */}
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-mono font-bold">
                                                    {store.code}
                                                </span>
                                            </td>

                                            {/* Tenant */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                        {getTenantName(store)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Contact */}
                                            <td className="px-6 py-4">
                                                {store.phone ? (
                                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                                        <Phone className="w-3 h-3" /> {store.phone}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-300">—</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    store.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {store.status}
                                                </span>
                                            </td>

                                            {/* Created */}
                                            <td className="px-6 py-4 text-sm text-slate-400">
                                                {new Date(store.createdAt).toLocaleDateString()}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(store)}
                                                        className={`p-2 rounded-xl transition-colors ${
                                                            store.status === 'active'
                                                                ? 'hover:bg-amber-50 text-amber-500'
                                                                : 'hover:bg-emerald-50 text-emerald-500'
                                                        }`}
                                                        title={store.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {store.status === 'active'
                                                            ? <ToggleRight className="w-5 h-5" />
                                                            : <ToggleLeft className="w-5 h-5" />
                                                        }
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedStore(store); setShowModal(true); }}
                                                        className="p-2 hover:bg-blue-50 rounded-xl transition-colors text-blue-500"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(store)}
                                                        className="p-2 hover:bg-rose-50 rounded-xl transition-colors text-rose-500"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <StoreModal
                    store={selectedStore}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { fetchStores(); setShowModal(false); }}
                />
            )}
        </div>
    );
}
