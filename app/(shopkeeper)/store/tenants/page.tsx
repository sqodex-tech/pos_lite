"use client";

import React, { useState, useEffect } from 'react';
import {
    Store,
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Ban,
    CheckCircle,
    Mail,
    Phone,
    MapPin,
    CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { tenantsApi, Tenant, TenantCreateUpdate } from '@/lib/api/tenants';
import { plansApi, Plan } from '@/lib/api/plans';
import { Button, Input } from '@/components/UI';

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

    useEffect(() => {
        fetchTenants();
        fetchPlans();
    }, []);

    const fetchTenants = async () => {
        try {
            const response = await tenantsApi.getAll({ page: 1, limit: 100 });
            const tenantData = Array.isArray(response.data.data) ? response.data.data : [];
            setTenants(tenantData);
        } catch (error: any) {
            console.error('Fetch tenants error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch tenants';
            
            // Check if it's a connection error
            if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
                toast.error('Cannot connect to backend API. Please ensure the backend server is running on port 5001.');
            } else if (error.response?.status === 401) {
                toast.error('Authentication failed. Please login again.');
                setTimeout(() => window.location.href = '/login', 2000);
            } else {
                toast.error(errorMessage);
            }
            
            setTenants([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await plansApi.getAll();
            const planData = Array.isArray(response.data.data) ? response.data.data : [];
            setPlans(planData);
        } catch (error: any) {
            console.error('Fetch plans error:', error);
            if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
                console.warn('Cannot connect to backend. Please start the backend server.');
            }
            setPlans([]);
        }
    };

    const handleStatusChange = async (id: string, status: 'active' | 'suspended') => {
        try {
            await tenantsApi.updateStatus(id, status);
            toast.success(`Tenant ${status === 'active' ? 'activated' : 'suspended'}`);
            fetchTenants();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this tenant?')) return;
        try {
            await tenantsApi.delete(id);
            toast.success('Tenant deleted successfully');
            fetchTenants();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete tenant');
        }
    };

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tenant Management</h1>
                    <p className="text-slate-500 mt-1">Manage all registered tenants and their subscriptions</p>
                </div>
                <Button onClick={() => { setSelectedTenant(null); setShowModal(true); }} className="gap-2">
                    <Plus className="w-5 h-5" />
                    Add Tenant
                </Button>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tenants by name or email..."
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Tenants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredTenants.map((tenant) => (
                        <TenantCard
                            key={tenant._id}
                            tenant={tenant}
                            onEdit={() => { setSelectedTenant(tenant); setShowModal(true); }}
                            onDelete={() => handleDelete(tenant._id)}
                            onStatusChange={(status) => handleStatusChange(tenant._id, status)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {filteredTenants.length === 0 && (
                <div className="text-center py-20">
                    <Store className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No tenants found</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <TenantModal
                    tenant={selectedTenant}
                    plans={plans}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { fetchTenants(); setShowModal(false); }}
                />
            )}
        </div>
    );
}

function TenantCard({ tenant, onEdit, onDelete, onStatusChange }: {
    tenant: Tenant;
    onEdit: () => void;
    onDelete: () => void;
    onStatusChange: (status: 'active' | 'suspended') => void;
}) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card-premium p-6 relative"
        >
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    tenant.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                    tenant.status === 'suspended' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                    {tenant.status}
                </span>
            </div>

            {/* Tenant Info */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Store className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate">{tenant.name}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                        {tenant.planId?.name || 'No Active Plan'}
                    </p>
                </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{tenant.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-4 h-4" />
                    <span>{tenant.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{tenant.address}</span>
                </div>
            </div>

            {/* Plan Info */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-primary">Rs {tenant.planId?.price || 0}
                    </span>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 py-2 z-10">
                            <button onClick={() => window.location.href = `/admin/tenants/${tenant._id}`} className="w-full px-4 py-2 text-left text-sm hover:bg-primary-50 flex items-center gap-2 text-primary hover:text-primary-700">
                                <Store className="w-4 h-4" /> View Details
                            </button>
                            <button onClick={onEdit} className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 text-blue-600 hover:text-indigo-700">
                                <Edit className="w-4 h-4" /> Edit
                            </button>
                            {tenant.status === 'active' ? (
                                <button onClick={() => onStatusChange('suspended')} className="w-full px-4 py-2 text-left text-sm hover:bg-amber-50 flex items-center gap-2 text-amber-600 hover:text-amber-700">
                                    <Ban className="w-4 h-4" /> Suspend
                                </button>
                            ) : (
                                <button onClick={() => onStatusChange('active')} className="w-full px-4 py-2 text-left text-sm hover:bg-emerald-50 flex items-center gap-2 text-emerald-600 hover:text-emerald-700">
                                    <CheckCircle className="w-4 h-4" /> Activate
                                </button>
                            )}
                            <button onClick={onDelete} className="w-full px-4 py-2 text-left text-sm hover:bg-rose-50 flex items-center gap-2 text-rose-600 hover:text-rose-700">
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function TenantModal({ tenant, plans, onClose, onSuccess }: {
    tenant: Tenant | null;
    plans: Plan[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState<TenantCreateUpdate>({
        name: tenant?.name || '',
        email: tenant?.email || '',
        phone: tenant?.phone || '',
        address: tenant?.address || '',
        planId: tenant?.planId?._id || '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (tenant) {
                await tenantsApi.update(tenant._id, formData);
                toast.success('Tenant updated successfully');
            } else {
                await tenantsApi.create(formData);
                toast.success('Tenant created successfully');
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    {tenant ? 'Edit Tenant' : 'Add New Tenant'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tenant Name</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address</label>
                        <Input
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Plan</label>
                        <select
                            value={formData.planId}
                            onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                            required
                        >
                            <option value="">Select Plan</option>
                            {plans.map((plan: Plan) => (
                                <option key={plan._id} value={plan._id}>
                                    {plan.name} - ${plan.price}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-2">
                            Note: After creating tenant, activate subscription separately via Subscriptions API
                        </p>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button type="button" onClick={onClose} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? 'Saving...' : tenant ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
