"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Store,
    Package,
    Receipt,
    Wallet,
    BarChart3,
    Users,
    Settings,
    ChevronLeft,
    ShoppingCart,
    UserCheck,
    Truck,
    Ruler,
    ClipboardCheck,
    Coins,
    FolderTree,
    Headphones,
    Tag
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Menu item type
interface MenuItem {
    icon: any;
    label: string;
    href: string;
    permissions: string[];
    roles?: string[];
}

// Unified Menu items for Tenant
const menuItems: MenuItem[] = [
    {
        icon: LayoutDashboard,
        label: 'Dashboard',
        href: '/store',
        permissions: [] // Dashboard visible to all store users
    },
    {
        icon: Store,
        label: 'Stores',
        href: '/store/stores',
        permissions: [PERMISSIONS.VIEW_STORES, PERMISSIONS.MANAGE_STORES],
        roles: ['ADMIN'] // Only ADMIN can manage stores
    },
    {
        icon: ShoppingCart,
        label: 'POS Checkout',
        href: '/store/pos',
        permissions: [PERMISSIONS.CREATE_TRANSACTION],
        roles: ['ADMIN', 'STORE_MANAGER', 'SALES'] // ADMIN can also use POS
    },
    {
        icon: Package,
        label: 'Inventory',
        href: '/store/inventory',
        permissions: [PERMISSIONS.VIEW_INVENTORY, PERMISSIONS.MANAGE_INVENTORY],
        roles: ['ADMIN', 'STORE_MANAGER', 'SALES', 'ACCOUNTANT'] // All can view
    },
    {
        icon: FolderTree,
        label: 'Categories',
        href: '/store/categories',
        permissions: [PERMISSIONS.VIEW_INVENTORY, PERMISSIONS.MANAGE_INVENTORY],
        roles: ['ADMIN', 'STORE_MANAGER'] // ADMIN and Manager can manage categories
    },
    {
        icon: Tag,
        label: 'Brands',
        href: '/store/brands',
        permissions: [PERMISSIONS.VIEW_INVENTORY, PERMISSIONS.MANAGE_INVENTORY],
        roles: ['ADMIN', 'STORE_MANAGER'] // ADMIN and Manager can manage brands
    },
    {
        icon: Ruler,
        label: 'Units',
        href: '/store/units',
        permissions: [PERMISSIONS.VIEW_INVENTORY, PERMISSIONS.MANAGE_INVENTORY],
        roles: ['ADMIN', 'STORE_MANAGER'] // ADMIN and Manager can manage units
    },
    {
        icon: UserCheck,
        label: 'Customers',
        href: '/store/customers',
        permissions: [PERMISSIONS.VIEW_CUSTOMERS, PERMISSIONS.MANAGE_CUSTOMERS],
        roles: ['ADMIN', 'STORE_MANAGER', 'SALES', 'ACCOUNTANT'] // All can view
    },
    {
        icon: Truck,
        label: 'Suppliers',
        href: '/store/suppliers',
        permissions: [PERMISSIONS.VIEW_SUPPLIERS, PERMISSIONS.MANAGE_SUPPLIERS],
        roles: ['ADMIN', 'STORE_MANAGER', 'ACCOUNTANT'] // ADMIN, Manager, Accountant
    },
    {
        icon: Receipt,
        label: 'Transactions',
        href: '/store/transactions',
        permissions: [PERMISSIONS.VIEW_TRANSACTIONS],
        roles: ['ADMIN', 'STORE_MANAGER', 'SALES', 'ACCOUNTANT'] // All can view
    },
    {
        icon: Wallet,
        label: 'Store Expenses',
        href: '/store/expenses',
        permissions: [PERMISSIONS.VIEW_EXPENSES, PERMISSIONS.CREATE_EXPENSE],
        roles: ['ADMIN', 'STORE_MANAGER', 'ACCOUNTANT'] // ADMIN, Manager, Accountant
    },
    {
        icon: BarChart3,
        label: 'Reports',
        href: '/store/reports',
        permissions: [PERMISSIONS.VIEW_REPORTS],
        roles: ['ADMIN', 'STORE_MANAGER', 'SALES', 'ACCOUNTANT'] // All can view
    },
    {
        icon: Settings,
        label: 'Store Settings',
        href: '/store/settings',
        permissions: [PERMISSIONS.VIEW_SETTINGS, PERMISSIONS.MANAGE_SETTINGS],
        roles: ['ADMIN', 'STORE_MANAGER'] // ADMIN and Manager can manage settings
    },
    {
        icon: ClipboardCheck,
        label: 'Approvals',
        href: '/store/approvals',
        permissions: [PERMISSIONS.MANAGE_SUBSCRIPTIONS],
        roles: ['SUPER_ADMIN']
    },
    {
        icon: Coins,
        label: 'Plan Management',
        href: '/store/plans/manage',
        permissions: [PERMISSIONS.MANAGE_PLANS],
        roles: ['SUPER_ADMIN']
    },
    {
        icon: Store,
        label: 'All Stores',
        href: '/store/stores-admin',
        permissions: [],
        roles: ['SUPER_ADMIN']
    },
    {
        icon: Receipt,
        label: 'Billing History',
        href: '/store/billing',
        permissions: [],
        roles: ['ADMIN']
    },
    {
        icon: Headphones,
        label: 'Support',
        href: '/support',
        permissions: [],
        roles: ['SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES', 'ACCOUNTANT']
    },
];

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();
    const { hasAnyPermission, user } = usePermissions();

    // Filter menu items based on permissions and roles
    const visibleMenuItems = menuItems.filter(item => {
        // Check role restriction first
        if (item.roles && item.roles.length > 0) {
            if (!user || !item.roles.includes(user.role)) {
                return false;
            }
        }

        // If no permissions required, show to everyone
        if (!item.permissions || item.permissions.length === 0) {
            return true;
        }

        // Check if user has any of the required permissions
        return hasAnyPermission(item.permissions);
    });

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 80 : 260 }}
            className="h-screen bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 flex flex-col relative transition-all duration-300 shadow-xl z-50 rounded-r-3xl"
        >
            {/* Logo Section */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <Store className="text-white w-6 h-6" />
                </div>
                {!isCollapsed && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-bold text-xl tracking-tight"
                    >
                        SumboxPro
                    </motion.span>
                )}
            </div>

            {/* User Info */}
            {!isCollapsed && user && (
                <div className="px-6 pb-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                            Logged in as
                        </p>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate mb-2">{user.email}</p>

                        {user.tenantId?.subscriptionPlan && (
                            <div className="mb-3 py-2 px-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 group/sub">
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Subscription</p>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{user.tenantId.subscriptionPlan.name}</span>
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                        {user.tenantId.subscriptionPlan.durationInDays}d
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '65%' }} // Simulated progress, ideally calculated from dates
                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">
                                {user.role.replace('_', ' ')}
                            </div>
                            {user.role === 'ADMIN' && (
                                <Link
                                    href="/store/plans"
                                    className="text-[10px] font-black text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1.5 bg-white dark:bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-all hover:scale-105"
                                >
                                    <Package className="w-3 h-3" />
                                    Change
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto overflow-x-hidden">
                {visibleMenuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group relative",
                                isActive
                                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <item.icon className={cn(
                                "w-6 h-6 shrink-0 transition-transform group-hover:scale-110",
                                isActive ? "text-primary" : ""
                            )} />
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="font-medium"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                            {isActive && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-4 top-20 w-8 h-8 bg-white dark:bg-slate-900 text-sidebar shadow-md rounded-full flex items-center justify-center hover:scale-110 transition-transform border border-slate-100 dark:border-slate-800"
            >
                {isCollapsed ? <ChevronLeft className="w-5 h-5 rotate-180" /> : <ChevronLeft className="w-5 h-5" />}
            </button>

            {/* User Support Card (Optional Bottom) */}
            {!isCollapsed && (
                <div className="p-4 m-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Need help?</p>
                    <Link
                        href="/support"
                        className="block w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-center text-sm font-medium transition-colors"
                    >
                        Contact Support
                    </Link>
                </div>
            )}
        </motion.aside>
    );
}
