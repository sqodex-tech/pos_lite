"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Store, StoreCreateUpdate, adminStoresApi } from '@/lib/api/stores';
import { tenantsApi, Tenant } from '@/lib/api/tenants';
import { Button, Input } from '@/components/UI';

interface StoreModalProps {
    store: Store | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function StoreModal({ store, onClose, onSuccess }: StoreModalProps) {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(false);
    const [tenantId, setTenantId] = useState(() => {
        if (store?.tenantId) {
            return typeof store.tenantId === 'string' ? store.tenantId : store.tenantId._id;
        }
        return '';
    });
    const [formData, setFormData] = useState<StoreCreateUpdate>({
        name: store?.name || '',
        code: store?.code || '',
        address: store?.address || '',
        phone: store?.phone || '',
        status: store?.status || 'active',
    });

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const res = await tenantsApi.getAll({ page: 1, limit: 200 });
            const data = Array.isArray(res.data.data) ? res.data.data : [];
            setTenants(data);
        } catch {
            toast.error('Failed to load tenants');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenantId) {
            toast.error('Please select a tenant');
            return;
        }
        setLoading(true);
        try {
            if (store) {
                const editTenantId = typeof store.tenantId === 'string' ? store.tenantId : store.tenantId._id;
                await adminStoresApi.update(editTenantId, store._id, formData);
                toast.success('Store updated successfully');
            } else {
                await adminStoresApi.create(tenantId, formData);
                toast.success('Store created successfully');
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            >
                <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                </button>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    {store ? 'Edit Store' : 'Create New Store'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Tenant Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">
                            Tenant *
                        </label>
                        <select
                            value={tenantId}
                            onChange={(e) => setTenantId(e.target.value)}
                            disabled={!!store}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-700 dark:text-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
                            required
                        >
                            <option value="">Select Tenant</option>
                            {tenants.map((t) => (
                                <option key={t._id} value={t._id}>
                                    {t.name} ({t.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Store Name & Code */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Store Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Main Branch"
                            required
                        />
                        <Input
                            label="Store Code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="STORE001"
                            required
                            disabled={!!store}
                        />
                    </div>

                    {/* Address */}
                    <Input
                        label="Address"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Business Ave, City"
                    />

                    {/* Phone & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Phone"
                            value={formData.phone || ''}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 234 567 890"
                        />
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-900 dark:text-white font-bold"
                            >
                                <option value="active" className="text-emerald-600">Active</option>
                                <option value="inactive" className="text-rose-600">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <Button type="button" onClick={onClose} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 shadow-none">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} isLoading={loading} className="flex-1">
                            {store ? 'Update Store' : 'Create Store'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
