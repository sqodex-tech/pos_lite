"use client";

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Package,
    Banknote,
    Users,
    Layers,
    MapPin,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { plansApi, Plan } from '@/lib/api/plans';
import { Button, Input } from '@/components/UI';

export default function ManagePlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await plansApi.getAll();
            setPlans(Array.isArray(response.data.data) ? response.data.data : []);
        } catch (error: any) {
            console.error('Fetch plans error:', error);
            toast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan? It cannot be deleted if in use by active tenants.')) return;
        try {
            await plansApi.delete(id);
            toast.success('Plan deleted successfully');
            fetchPlans();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete plan');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Plan Management</h1>
                    <p className="text-slate-500 mt-1">Create and manage platform subscription plans</p>
                </div>
                <Button onClick={() => { setSelectedPlan(null); setShowModal(true); }} className="gap-2">
                    <Plus className="w-5 h-5" />
                    Create Plan
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan._id}
                            plan={plan}
                            onEdit={() => { setSelectedPlan(plan); setShowModal(true); }}
                            onDelete={() => handleDelete(plan._id)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {plans.length === 0 && (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No plans found</p>
                </div>
            )}

            {showModal && (
                <PlanModal
                    plan={selectedPlan}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { fetchPlans(); setShowModal(false); }}
                />
            )}
        </div>
    );
}

function PlanCard({ plan, onEdit, onDelete }: {
    plan: Plan;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card-premium p-6 flex flex-col h-full"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary" />
                </div>
                <div className="flex gap-2">
                    <button onClick={onEdit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h3>
            <p className="text-3xl font-black text-primary mb-6">Rs {plan.price}
                <span className="text-sm font-medium text-slate-400 ml-1">/{plan.durationInDays} days</span>
            </p>

            <div className="space-y-3 mb-8 flex-1">
                <FeatureItem icon={<Users className="w-4 h-4" />} label={`${plan.maxUsers} Users`} />
                <FeatureItem icon={<Layers className="w-4 h-4" />} label={`${plan.maxItems} Items`} />
                <FeatureItem icon={<MapPin className="w-4 h-4" />} label={`${plan.maxBranches} Branches`} />
            </div>

            <div className="space-y-2">
                {plan.features.slice(0, 3).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="truncate">{f}</span>
                    </div>
                ))}
                {plan.features.length > 3 && (
                    <p className="text-xs text-slate-400">+{plan.features.length - 3} more features</p>
                )}
            </div>
        </motion.div>
    );
}

function FeatureItem({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
            <span className="text-slate-400">{icon}</span>
            <span className="font-medium">{label}</span>
        </div>
    );
}

function PlanModal({ plan, onClose, onSuccess }: {
    plan: Plan | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        name: plan?.name || '',
        description: plan?.description || '',
        price: plan?.price || 0,
        currency: plan?.currency || 'USD',
        durationInDays: plan?.durationInDays || 30,
        maxUsers: plan?.maxUsers || 5,
        maxItems: plan?.maxItems || 1000,
        maxBranches: plan?.maxBranches || 1,
        features: plan?.features.join(', ') || '',
        isActive: plan?.isActive ?? true
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                ...formData,
                features: formData.features.split(',').map(f => f.trim()).filter(Boolean)
            };

            if (plan) {
                await plansApi.update(plan._id, data);
                toast.success('Plan updated successfully');
            } else {
                await plansApi.create(data);
                toast.success('Plan created successfully');
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
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {plan ? 'Edit Plan' : 'Create New Plan'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <XCircle className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Plan Name</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g. Pro Plan"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Price (Rs )</label>
                            <Input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                        <textarea
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 h-24 resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of the plan..."
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Duration (Days)</label>
                            <Input
                                type="number"
                                value={formData.durationInDays}
                                onChange={(e) => setFormData({ ...formData, durationInDays: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Max Users</label>
                            <Input
                                type="number"
                                value={formData.maxUsers}
                                onChange={(e) => setFormData({ ...formData, maxUsers: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Max Items</label>
                            <Input
                                type="number"
                                value={formData.maxItems}
                                onChange={(e) => setFormData({ ...formData, maxItems: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Max Branches</label>
                            <Input
                                type="number"
                                value={formData.maxBranches}
                                onChange={(e) => setFormData({ ...formData, maxBranches: Number(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Features (comma separated)</label>
                        <Input
                            value={formData.features}
                            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                            placeholder="e.g. 24/7 Support, Cloud Storage, Analytics"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">Available for new subscriptions</label>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button type="button" onClick={onClose} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
