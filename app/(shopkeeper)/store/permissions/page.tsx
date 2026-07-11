"use client";

import React, { useState, useEffect } from 'react';
import {
    Shield,
    Users,
    Search,
    Check,
    X,
    RefreshCw,
    Save,
    AlertCircle,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { permissionsApi, UserPermissions } from '@/lib/api/permissions';
import { usersApi, User } from '@/lib/api/users';
import { Button } from '@/components/UI';

export default function PermissionsManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
    const [allPermissions, setAllPermissions] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [permissionChanges, setPermissionChanges] = useState<{
        grant: Set<string>;
        revoke: Set<string>;
    }>({ grant: new Set(), revoke: new Set() });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, permsRes] = await Promise.all([
                usersApi.getAll({ page: 1, limit: 100 }),
                permissionsApi.getAll()
            ]);

            const userData = Array.isArray(usersRes.data.data) ? usersRes.data.data : [];
            
            // Get current user role from localStorage
            const currentUser = typeof window !== 'undefined' 
                ? JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.user 
                : null;
            
            // Filter users based on current user role
            let filteredUsers = userData;
            if (currentUser?.role === 'ADMIN') {
                // ADMIN can only see STORE_MANAGER, SALES, ACCOUNTANT in their tenant
                filteredUsers = userData.filter((u: User) => 
                    ['STORE_MANAGER', 'SALES', 'ACCOUNTANT'].includes(u.role) &&
                    u.tenantId?._id === currentUser.tenantId
                );
            } else if (currentUser?.role === 'SUPER_ADMIN') {
                // SUPER_ADMIN can see all users except other SUPER_ADMINs
                filteredUsers = userData.filter((u: User) => u.role !== 'SUPER_ADMIN');
            }
            
            setUsers(filteredUsers);
            setAllPermissions(permsRes.data.data);
        } catch (error: any) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load permissions data');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserPermissions = async (userId: string) => {
        try {
            const response = await permissionsApi.getUserPermissions(userId);
            setUserPermissions(response.data.data);
            setPermissionChanges({ grant: new Set(), revoke: new Set() });
        } catch (error: any) {
            console.error('Error fetching user permissions:', error);
            toast.error('Failed to load user permissions');
        }
    };

    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        fetchUserPermissions(user._id);
    };

    const togglePermission = (permission: string) => {
        if (!userPermissions) return;

        const hasPermission = userPermissions.permissions.includes(permission);
        const newChanges = { ...permissionChanges };

        if (hasPermission) {
            // Currently has permission - mark for revoke
            newChanges.revoke.add(permission);
            newChanges.grant.delete(permission);
        } else {
            // Currently doesn't have permission - mark for grant
            newChanges.grant.add(permission);
            newChanges.revoke.delete(permission);
        }

        setPermissionChanges(newChanges);
    };

    const isPermissionActive = (permission: string): boolean => {
        if (!userPermissions) return false;

        const hasPermission = userPermissions.permissions.includes(permission);
        const willBeGranted = permissionChanges.grant.has(permission);
        const willBeRevoked = permissionChanges.revoke.has(permission);

        if (willBeGranted) return true;
        if (willBeRevoked) return false;
        return hasPermission;
    };

    const hasChanges = (): boolean => {
        return permissionChanges.grant.size > 0 || permissionChanges.revoke.size > 0;
    };

    const handleSave = async () => {
        if (!selectedUser || !hasChanges()) return;

        setSaving(true);
        try {
            await permissionsApi.updateUserPermissions(selectedUser._id, {
                grantPermissions: Array.from(permissionChanges.grant),
                revokePermissions: Array.from(permissionChanges.revoke)
            });

            toast.success('Permissions updated successfully');
            fetchUserPermissions(selectedUser._id);
        } catch (error: any) {
            console.error('Error updating permissions:', error);
            toast.error(error.response?.data?.message || 'Failed to update permissions');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!selectedUser) return;

        if (!confirm('Are you sure you want to reset permissions to role defaults? This will remove all custom permissions.')) {
            return;
        }

        try {
            await permissionsApi.resetUserPermissions(selectedUser._id);
            toast.success('Permissions reset to role defaults');
            fetchUserPermissions(selectedUser._id);
        } catch (error: any) {
            console.error('Error resetting permissions:', error);
            toast.error(error.response?.data?.message || 'Failed to reset permissions');
        }
    };

    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Permission Management</h1>
                <p className="text-slate-500 mt-1">Manage user permissions and access control</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User List */}
                <div className="lg:col-span-1">
                    <div className="card-premium p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Users className="w-5 h-5 text-primary" />
                            <h2 className="font-bold text-slate-900 dark:text-white">Users</h2>
                        </div>

                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* User List */}
                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {filteredUsers.map((user) => (
                                <button
                                    key={user._id}
                                    onClick={() => handleUserSelect(user)}
                                    className={`w-full text-left p-3 rounded-xl transition-all ${
                                        selectedUser?._id === user._id
                                            ? 'bg-primary text-white'
                                            : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <p className={`font-medium text-sm ${
                                        selectedUser?._id === user._id ? 'text-white' : 'text-slate-900 dark:text-white'
                                    }`}>
                                        {user.name}
                                    </p>
                                    <p className={`text-xs mt-1 ${
                                        selectedUser?._id === user._id ? 'text-white/80' : 'text-slate-500'
                                    }`}>
                                        {user.email}
                                    </p>
                                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                                        selectedUser?._id === user._id
                                            ? 'bg-white/20 dark:bg-slate-900/20 text-white'
                                            : 'bg-slate-200 text-slate-700 dark:text-slate-300'
                                    }`}>
                                        {user.role}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Permissions Panel */}
                <div className="lg:col-span-2">
                    {selectedUser && userPermissions ? (
                        <div className="card-premium p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-6 h-6 text-primary" />
                                    <div>
                                        <h2 className="font-bold text-slate-900 dark:text-white">{selectedUser.name}</h2>
                                        <p className="text-sm text-slate-500">{selectedUser.role} Permissions</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleReset}
                                        className="gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Reset
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={!hasChanges() || saving}
                                        className="gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </div>

                            {/* Changes Summary */}
                            <AnimatePresence>
                                {hasChanges() && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl"
                                    >
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-amber-900">Unsaved Changes</p>
                                                <p className="text-xs text-amber-700 mt-1">
                                                    {permissionChanges.grant.size} permission(s) to grant, {permissionChanges.revoke.size} to revoke
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Permissions by Category */}
                            <div className="space-y-3">
                                {allPermissions?.permissionsByCategory && Object.entries(allPermissions.permissionsByCategory).map(([category, perms]: [string, any]) => (
                                    <div key={category} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleCategory(category)}
                                            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <span className="font-medium text-slate-900 dark:text-white capitalize">{category}</span>
                                            {expandedCategories.has(category) ? (
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-slate-400" />
                                            )}
                                        </button>

                                        <AnimatePresence>
                                            {expandedCategories.has(category) && (
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: 'auto' }}
                                                    exit={{ height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-4 space-y-2">
                                                        {perms.map((perm: any) => {
                                                            const isActive = isPermissionActive(perm.value);
                                                            const hasChange = permissionChanges.grant.has(perm.value) || permissionChanges.revoke.has(perm.value);

                                                            return (
                                                                <button
                                                                    key={perm.value}
                                                                    onClick={() => togglePermission(perm.value)}
                                                                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                                                                        isActive
                                                                            ? hasChange
                                                                                ? 'bg-emerald-100 border-2 border-emerald-500'
                                                                                : 'bg-emerald-50 border border-emerald-200'
                                                                            : hasChange
                                                                                ? 'bg-rose-100 border-2 border-rose-500'
                                                                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                                    }`}
                                                                >
                                                                    <div className="flex-1 text-left">
                                                                        <p className={`text-sm font-medium ${
                                                                            isActive ? 'text-emerald-900' : 'text-slate-700 dark:text-slate-300'
                                                                        }`}>
                                                                            {perm.description}
                                                                        </p>
                                                                        <p className="text-xs text-slate-500 mt-1">{perm.value}</p>
                                                                    </div>
                                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                                        isActive
                                                                            ? 'bg-emerald-600'
                                                                            : 'bg-slate-300'
                                                                    }`}>
                                                                        {isActive ? (
                                                                            <Check className="w-4 h-4 text-white" />
                                                                        ) : (
                                                                            <X className="w-4 h-4 text-white" />
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="card-premium p-12 text-center">
                            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">Select a user to manage permissions</p>
                            <p className="text-sm text-slate-400 mt-2">Choose a user from the list to view and edit their permissions</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
