"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Building2,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Users,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    AlertCircle,
    RefreshCw,
    Edit,
    Trash2,
    Package,
    Activity,
    Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { tenantsApi, Tenant } from '@/lib/api/tenants';
import { subscriptionsApi, Subscription } from '@/lib/api/subscriptions';
import { plansApi, Plan } from '@/lib/api/plans';
import { usersApi, UserCreateUpdate } from '@/lib/api/users';
import { Button } from '@/components/UI';

export default function TenantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const tenantId = params.id as string;

    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
    const [subscriptionHistory, setSubscriptionHistory] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showChangePlanModal, setShowChangePlanModal] = useState(false);
    const [showActivateModal, setShowActivateModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [tenantAdmin, setTenantAdmin] = useState<any>(null);
    const [loadingAdmin, setLoadingAdmin] = useState(false);

    useEffect(() => {
        if (tenantId) {
            fetchTenantDetails();
        }
    }, [tenantId]);

    const fetchTenantDetails = async () => {
        try {
            setLoading(true);
            
            // Fetch tenant details
            const tenantRes = await tenantsApi.getById(tenantId);
            setTenant(tenantRes.data.data);

            // Fetch tenant admin
            fetchTenantAdmin();

            // Fetch active subscription
            try {
                const subscriptionRes = await subscriptionsApi.getActive(tenantId);
                setActiveSubscription(subscriptionRes.data.data);
            } catch (error: any) {
                if (error.response?.status !== 404) {
                    console.error('Error fetching subscription:', error);
                }
                setActiveSubscription(null);
            }

            // Fetch subscription history
            try {
                const historyRes = await subscriptionsApi.getHistory(tenantId, { limit: 10 });
                const historyData = historyRes.data.data;
                setSubscriptionHistory(Array.isArray(historyData) ? historyData : []);
            } catch (error) {
                console.error('Error fetching history:', error);
                setSubscriptionHistory([]);
            }
        } catch (error: any) {
            console.error('Fetch error:', error);
            if (error.code === 'ERR_NETWORK') {
                toast.error('Cannot connect to backend. Please ensure the server is running.');
            } else if (error.response?.status === 404) {
                toast.error('Tenant not found');
                router.push('/admin/tenants');
            } else {
                toast.error('Failed to load tenant details');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchTenantAdmin = async () => {
        try {
            setLoadingAdmin(true);
            const response = await usersApi.getAll({ tenantId, role: 'ADMIN', limit: 1 });
            const users = response.data.data;
            if (Array.isArray(users) && users.length > 0) {
                setTenantAdmin(users[0]);
            } else {
                setTenantAdmin(null);
            }
        } catch (error) {
            console.error('Error fetching tenant admin:', error);
            setTenantAdmin(null);
        } finally {
            setLoadingAdmin(false);
        }
    };

    const handleRenewSubscription = async () => {
        if (!activeSubscription) return;
        
        if (!confirm('Are you sure you want to renew this subscription?')) return;

        try {
            await subscriptionsApi.renew(activeSubscription._id);
            toast.success('Subscription renewed successfully');
            fetchTenantDetails();
        } catch (error: any) {
            console.error('Renew error:', error);
            toast.error(error.response?.data?.message || 'Failed to renew subscription');
        }
    };

    const handleDeleteTenant = async () => {
        if (!tenant) return;
        
        if (!confirm(`Are you sure you want to delete ${tenant.name}? This action cannot be undone.`)) return;

        try {
            await tenantsApi.delete(tenant._id);
            toast.success('Tenant deleted successfully');
            router.push('/admin/tenants');
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete tenant');
        }
    };

    const handleStatusChange = async (newStatus: 'active' | 'suspended') => {
        if (!tenant) return;
        
        if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'suspend'} this tenant?`)) return;

        try {
            await tenantsApi.updateStatus(tenant._id, newStatus);
            toast.success(`Tenant ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
            fetchTenantDetails();
        } catch (error: any) {
            console.error('Status change error:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">Tenant not found</p>
                <Button onClick={() => router.push('/admin/tenants')}>
                    Back to Tenants
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/admin/tenants')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{tenant.name}</h1>
                        <p className="text-slate-500 mt-1">Tenant Details & Subscription Management</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {tenant.status === 'active' ? (
                        <Button
                            onClick={() => handleStatusChange('suspended')}
                            className="gap-2 bg-amber-50 text-amber-600 hover:bg-amber-100"
                        >
                            <XCircle className="w-4 h-4" />
                            Suspend
                        </Button>
                    ) : (
                        <Button
                            onClick={() => handleStatusChange('active')}
                            className="gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Activate
                        </Button>
                    )}
                    <Button
                        onClick={handleDeleteTenant}
                        className="gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Tenant Info Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card-premium p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{tenant.name}</h2>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                tenant.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                                tenant.status === 'suspended' ? 'bg-amber-50 text-amber-600' :
                                'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                                {tenant.status.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <Mail className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">Email</p>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{tenant.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <Phone className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">Phone</p>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{tenant.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl md:col-span-2">
                            <MapPin className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">Address</p>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{tenant.address}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                    <div className="card-premium p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Users className="w-5 h-5 text-primary" />
                            <h3 className="font-bold text-slate-900 dark:text-white">Subscription Limits</h3>
                        </div>
                        {activeSubscription ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Max Users</span>
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                                        {activeSubscription.limitsSnapshot?.maxUsers || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Max Items</span>
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                                        {activeSubscription.limitsSnapshot?.maxItems || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Max Branches</span>
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                                        {activeSubscription.limitsSnapshot?.maxBranches || 0}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">No active subscription</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Tenant Admin Management */}
            <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tenant Administrator</h2>
                    </div>
                    {tenantAdmin ? (
                        <Button
                            onClick={() => setShowAdminModal(true)}
                            className="gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                            <Edit className="w-4 h-4" />
                            Manage Admin
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setShowAdminModal(true)}
                            className="gap-2"
                        >
                            <Users className="w-4 h-4" />
                            Create Admin
                        </Button>
                    )}
                </div>

                {loadingAdmin ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : tenantAdmin ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Name</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {tenantAdmin.name}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <Mail className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">Email</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{tenantAdmin.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <Activity className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">Status</p>
                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                    tenantAdmin.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                    {tenantAdmin.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <Calendar className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">Created</p>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                    {new Date(tenantAdmin.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-slate-400 mb-4">No administrator assigned to this tenant</p>
                        <p className="text-sm text-slate-500 mb-4">
                            Create an admin user to manage this tenant's stores and staff
                        </p>
                    </div>
                )}
            </div>

            {/* Active Subscription */}
            {activeSubscription ? (
                <div className="card-premium p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-6 h-6 text-primary" />
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Subscription</h2>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setShowChangePlanModal(true)}
                                className="gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Change Plan
                            </Button>
                            <Button
                                onClick={handleRenewSubscription}
                                className="gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Renew
                            </Button>
                            <Button
                                onClick={() => setShowCancelModal(true)}
                                className="gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100"
                            >
                                <XCircle className="w-4 h-4" />
                                Cancel
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Current Plan</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeSubscription.planId?.name || 'N/A'}</p>
                            <p className="text-sm text-primary font-bold mt-1">Rs {activeSubscription.priceSnapshot?.amount || 0}/{activeSubscription.priceSnapshot?.durationInDays || 0}d
                            </p>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-xl">
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Status</p>
                            <div className="flex items-center gap-2 mt-2">
                                {activeSubscription.status === 'active' ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-rose-600" />
                                )}
                                <span className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                                    {activeSubscription.status}
                                </span>
                            </div>
                            {activeSubscription.isTrial && (
                                <span className="inline-block mt-2 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">
                                    TRIAL
                                </span>
                            )}
                        </div>

                        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-xl">
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Days Remaining</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{activeSubscription.daysRemaining || 0}</p>
                            <p className="text-xs text-slate-500 mt-1">
                                {activeSubscription.autoRenew ? 'Auto-renews' : 'No auto-renewal'}
                            </p>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-50/50 rounded-xl">
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Next Billing</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {new Date(activeSubscription.endDate).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 capitalize">
                                Payment: {activeSubscription.paymentStatus}
                            </p>
                        </div>
                    </div>

                    {/* Subscription Details */}
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500 mb-1">Start Date</p>
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {new Date(activeSubscription.startDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 mb-1">End Date</p>
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {new Date(activeSubscription.endDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 mb-1">Duration</p>
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {activeSubscription.priceSnapshot?.durationInDays || 0} days
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Plan Features */}
                    {activeSubscription.planId?.features && activeSubscription.planId.features.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-3">Plan Features</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {activeSubscription.planId.features.map((feature: string, index: number) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="card-premium p-12 text-center">
                    <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Active Subscription</h3>
                    <p className="text-slate-500 mb-6">This tenant doesn't have an active subscription</p>
                    <Button onClick={() => setShowActivateModal(true)} className="gap-2">
                        <Package className="w-4 h-4" />
                        Activate Subscription
                    </Button>
                </div>
            )}

            {/* Subscription History */}
            {subscriptionHistory.length > 0 && (
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Clock className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subscription History</h2>
                    </div>

                    <div className="space-y-3">
                        {subscriptionHistory.map((sub) => (
                            <div
                                key={sub._id}
                                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${
                                        sub.status === 'active' ? 'bg-emerald-500' :
                                        sub.status === 'expired' ? 'bg-slate-400' :
                                        sub.status === 'cancelled' ? 'bg-rose-500' :
                                        'bg-amber-500'
                                    }`} />
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">{sub.planId?.name || 'Unknown Plan'}</p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-900 dark:text-white">Rs {sub.priceSnapshot?.amount || 0}</p>
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                                        sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                        sub.status === 'expired' ? 'bg-slate-200 text-slate-700 dark:text-slate-300' :
                                        sub.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {sub.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {showCancelModal && activeSubscription && (
                    <CancelSubscriptionModal
                        subscription={activeSubscription}
                        onClose={() => setShowCancelModal(false)}
                        onSuccess={() => {
                            setShowCancelModal(false);
                            fetchTenantDetails();
                        }}
                    />
                )}

                {showChangePlanModal && activeSubscription && (
                    <ChangePlanModal
                        subscription={activeSubscription}
                        onClose={() => setShowChangePlanModal(false)}
                        onSuccess={() => {
                            setShowChangePlanModal(false);
                            fetchTenantDetails();
                        }}
                    />
                )}

                {showActivateModal && (
                    <ActivateSubscriptionModal
                        tenantId={tenantId}
                        onClose={() => setShowActivateModal(false)}
                        onSuccess={() => {
                            setShowActivateModal(false);
                            fetchTenantDetails();
                        }}
                    />
                )}

                {showAdminModal && (
                    <ManageTenantAdminModal
                        tenantId={tenantId}
                        existingAdmin={tenantAdmin}
                        onClose={() => setShowAdminModal(false)}
                        onSuccess={() => {
                            setShowAdminModal(false);
                            fetchTenantAdmin();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Manage Tenant Admin Modal
function ManageTenantAdminModal({ tenantId, existingAdmin, onClose, onSuccess }: {
    tenantId: string;
    existingAdmin: any;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        name: existingAdmin?.name || '',
        email: existingAdmin?.email || '',
        password: '',
        confirmPassword: '',
        status: existingAdmin?.status || 'active'
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+Rs /.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!existingAdmin) {
            // Creating new admin - password required
            if (!formData.password) {
                newErrors.password = 'Password is required';
            } else if (formData.password.length < 8) {
                newErrors.password = 'Password must be at least 8 characters';
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        } else {
            // Updating existing admin - password optional
            if (formData.password) {
                if (formData.password.length < 8) {
                    newErrors.password = 'Password must be at least 8 characters';
                }
                if (formData.password !== formData.confirmPassword) {
                    newErrors.confirmPassword = 'Passwords do not match';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            if (existingAdmin) {
                // Update existing admin
                const updateData: any = {
                    name: formData.name,
                    email: formData.email,
                    status: formData.status
                };

                // Only include password if it's being changed
                if (formData.password) {
                    updateData.password = formData.password;
                }

                await usersApi.update(existingAdmin._id, updateData);
                toast.success('Admin updated successfully');
            } else {
                // Create new admin
                const createData: UserCreateUpdate = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: 'ADMIN',
                    tenantId: tenantId,
                    status: formData.status as 'active' | 'inactive'
                };
                await usersApi.create(createData);
                toast.success('Admin created successfully');
            }
            onSuccess();
        } catch (error: any) {
            console.error('Admin operation error:', error);
            toast.error(error.response?.data?.error?.message || `Failed to ${existingAdmin ? 'update' : 'create'} admin`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors((prev: any) => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {existingAdmin ? 'Manage' : 'Create'} Tenant Administrator
                        </h2>
                        <p className="text-sm text-slate-500">
                            {existingAdmin ? 'Update admin details and password' : 'Create an admin user for this tenant'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Field */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 ${
                                errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                            }`}
                            placeholder="John Doe"
                        />
                        {errors.name && (
                            <p className="text-xs text-rose-500 mt-1">{errors.name}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Email <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 ${
                                errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                            }`}
                            placeholder="admin@example.com"
                        />
                        {errors.email && (
                            <p className="text-xs text-rose-500 mt-1">{errors.email}</p>
                        )}
                    </div>

                    {/* Password Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Password {!existingAdmin && <span className="text-rose-500">*</span>}
                                {existingAdmin && <span className="text-slate-400 text-xs">(leave blank to keep current)</span>}
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 ${
                                    errors.password ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                                }`}
                                placeholder="••••••••"
                            />
                            {errors.password && (
                                <p className="text-xs text-rose-500 mt-1">{errors.password}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Confirm Password {!existingAdmin && <span className="text-rose-500">*</span>}
                            </label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 ${
                                    errors.confirmPassword ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                                }`}
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && (
                                <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword}</p>
                            )}
                        </div>
                    </div>

                    {/* Status Toggle */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.status === 'active'}
                                onChange={(e) => handleChange('status', e.target.checked ? 'active' : 'inactive')}
                                className="w-5 h-5 text-primary rounded"
                            />
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Active Status</p>
                                <p className="text-xs text-slate-500">
                                    {formData.status === 'active' ? 'Admin can login and manage tenant' : 'Admin account is disabled'}
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Info Box */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Administrator Permissions</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• Full access to tenant stores and data</li>
                                    <li>• Can create and manage staff (STORE_MANAGER, SALES, ACCOUNTANT)</li>
                                    <li>• Can customize user permissions</li>
                                    <li>• Cannot access other tenants or platform settings</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? (existingAdmin ? 'Updating...' : 'Creating...') : (existingAdmin ? 'Update Admin' : 'Create Admin')}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}


// Cancel Subscription Modal
function CancelSubscriptionModal({ subscription, onClose, onSuccess }: {
    subscription: Subscription;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [reason, setReason] = useState('');
    const [immediate, setImmediate] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleCancel = async () => {
        setLoading(true);
        try {
            await subscriptionsApi.cancel(subscription._id, { reason, immediate });
            toast.success(`Subscription ${immediate ? 'cancelled immediately' : 'will cancel at end of period'}`);
            onSuccess();
        } catch (error: any) {
            console.error('Cancel error:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel subscription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full"
            >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Cancel Subscription</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Are you sure you want to cancel this subscription?
                </p>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Cancellation Reason (Optional)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                            rows={3}
                            placeholder="Why are you cancelling?"
                        />
                    </div>

                    <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                        <input
                            type="checkbox"
                            checked={immediate}
                            onChange={(e) => setImmediate(e.target.checked)}
                            className="w-5 h-5 text-primary rounded"
                        />
                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">Cancel Immediately</p>
                            <p className="text-xs text-slate-500">
                                {immediate
                                    ? 'Subscription will end now and tenant will be suspended'
                                    : 'Subscription will continue until end of billing period'}
                            </p>
                        </div>
                    </label>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={onClose}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    >
                        Keep Subscription
                    </Button>
                    <Button
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex-1 bg-rose-600 hover:bg-rose-700"
                    >
                        {loading ? 'Cancelling...' : 'Cancel Subscription'}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

// Change Plan Modal
function ChangePlanModal({ subscription, onClose, onSuccess }: {
    subscription: Subscription;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [immediate, setImmediate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingPlans, setLoadingPlans] = useState(true);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await plansApi.getAll();
            const planData = Array.isArray(response.data.data) ? response.data.data : [];
            setPlans(planData.filter((p: Plan) => p._id !== subscription.planId?._id));
        } catch (error) {
            console.error('Failed to load plans:', error);
            toast.error('Failed to load plans');
        } finally {
            setLoadingPlans(false);
        }
    };

    const handleChangePlan = async () => {
        if (!selectedPlanId) {
            toast.error('Please select a plan');
            return;
        }

        setLoading(true);
        try {
            await subscriptionsApi.changePlan(subscription._id, {
                newPlanId: selectedPlanId,
                immediate
            });
            toast.success(immediate ? 'Plan changed successfully' : 'Plan change scheduled for next billing cycle');
            onSuccess();
        } catch (error: any) {
            console.error('Change plan error:', error);
            toast.error(error.response?.data?.message || 'Failed to change plan');
        } finally {
            setLoading(false);
        }
    };

    const selectedPlan = plans.find(p => p._id === selectedPlanId);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Change Subscription Plan</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Current Plan: <span className="font-bold text-primary">{subscription.planId?.name || 'N/A'}</span> (${subscription.planId?.price || 0}/month)
                </p>

                {loadingPlans ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : plans.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No other plans available</p>
                    </div>
                ) : (
                    <div className="space-y-4 mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Select New Plan
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                            {plans.map((plan) => (
                                <label
                                    key={plan._id}
                                    className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                        selectedPlanId === plan._id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="plan"
                                            value={plan._id}
                                            checked={selectedPlanId === plan._id}
                                            onChange={(e) => setSelectedPlanId(e.target.value)}
                                            className="w-5 h-5 text-primary"
                                        />
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{plan.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {plan.maxUsers} users • {plan.maxItems} items • {plan.maxBranches} branches
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primary">Rs {plan.price}</p>
                                        <p className="text-xs text-slate-500">per month</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {selectedPlan && selectedPlan.features && selectedPlan.features.length > 0 && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Plan Features</h3>
                                <ul className="space-y-1">
                                    {selectedPlan.features.map((feature: string, index: number) => (
                                        <li key={index} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                            <input
                                type="checkbox"
                                checked={immediate}
                                onChange={(e) => setImmediate(e.target.checked)}
                                className="w-5 h-5 text-primary rounded"
                            />
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Apply Change Immediately</p>
                                <p className="text-xs text-slate-500">
                                    {immediate
                                        ? 'Current subscription will be cancelled and new plan will start now'
                                        : 'Change will take effect at the end of current billing period'}
                                </p>
                            </div>
                        </label>

                        {selectedPlan && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                    <div className="text-sm text-amber-800">
                                        <p className="font-medium mb-1">Price Change</p>
                                        <p>
                                            {selectedPlan.price > (subscription.planId?.price || 0) ? (
                                                <>Upgrading from ${subscription.planId?.price || 0} to ${selectedPlan.price} per month</>
                                            ) : (
                                                <>Downgrading from ${subscription.planId?.price || 0} to ${selectedPlan.price} per month</>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-3">
                    <Button
                        onClick={onClose}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleChangePlan}
                        disabled={loading || !selectedPlanId || loadingPlans || plans.length === 0}
                        className="flex-1"
                    >
                        {loading ? 'Changing Plan...' : immediate ? 'Change Now' : 'Schedule Change'}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

// Activate Subscription Modal
function ActivateSubscriptionModal({ tenantId, onClose, onSuccess }: {
    tenantId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [autoRenew, setAutoRenew] = useState(false);
    const [isTrial, setIsTrial] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingPlans, setLoadingPlans] = useState(true);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await plansApi.getAll();
            const planData = Array.isArray(response.data.data) ? response.data.data : [];
            setPlans(planData);
        } catch (error) {
            console.error('Failed to load plans:', error);
            toast.error('Failed to load plans');
        } finally {
            setLoadingPlans(false);
        }
    };

    const handleActivate = async () => {
        if (!selectedPlanId) {
            toast.error('Please select a plan');
            return;
        }

        setLoading(true);
        try {
            await subscriptionsApi.activate(tenantId, {
                planId: selectedPlanId,
                autoRenew,
                isTrial
            });
            toast.success('Subscription activated successfully');
            onSuccess();
        } catch (error: any) {
            console.error('Activate error:', error);
            toast.error(error.response?.data?.message || 'Failed to activate subscription');
        } finally {
            setLoading(false);
        }
    };

    const selectedPlan = plans.find(p => p._id === selectedPlanId);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Activate Subscription</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Select a plan to activate subscription for this tenant
                </p>

                {loadingPlans ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : plans.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 mb-4">No plans available</p>
                        <p className="text-sm text-slate-400">Please create a plan first</p>
                    </div>
                ) : (
                    <div className="space-y-4 mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Select Plan
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                            {plans.map((plan) => (
                                <label
                                    key={plan._id}
                                    className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                        selectedPlanId === plan._id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="plan"
                                            value={plan._id}
                                            checked={selectedPlanId === plan._id}
                                            onChange={(e) => setSelectedPlanId(e.target.value)}
                                            className="w-5 h-5 text-primary"
                                        />
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{plan.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {plan.maxUsers} users • {plan.maxItems} items • {plan.maxBranches} branches
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primary">Rs {plan.price}</p>
                                        <p className="text-xs text-slate-500">per {plan.durationInDays || 30} days</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {selectedPlan && selectedPlan.features && selectedPlan.features.length > 0 && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Plan Features</h3>
                                <ul className="space-y-1">
                                    {selectedPlan.features.map((feature: string, index: number) => (
                                        <li key={index} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoRenew}
                                    onChange={(e) => setAutoRenew(e.target.checked)}
                                    className="w-5 h-5 text-primary rounded"
                                />
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">Auto-Renew</p>
                                    <p className="text-xs text-slate-500">
                                        Automatically renew subscription at the end of billing period
                                    </p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isTrial}
                                    onChange={(e) => setIsTrial(e.target.checked)}
                                    className="w-5 h-5 text-amber-600 rounded"
                                />
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">Trial Subscription</p>
                                    <p className="text-xs text-slate-500">
                                        Mark this as a trial subscription
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <Button
                        onClick={onClose}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleActivate}
                        disabled={loading || !selectedPlanId || loadingPlans || plans.length === 0}
                        className="flex-1"
                    >
                        {loading ? 'Activating...' : 'Activate Subscription'}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
