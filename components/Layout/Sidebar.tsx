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
    group: string;
}

const menuItems: MenuItem[] = [
    {
        icon: LayoutDashboard,
        label: 'Dashboard',
        href: '/store',
        permissions: [],
        group: 'Core'
    },
    {
        icon: ShoppingCart,
        label: 'POS Checkout',
        href: '/store/pos',
        permissions: [PERMISSIONS.CREATE_TRANSACTION],
        roles: ['ADMIN', 'STORE_MANAGER', 'SALES'],
        group: 'Core'
    },
    {
        icon: Store,
        label: 'Stores',
        href: '/store/stores',
        permissions: [PERMISSIONS.VIEW_STORES, PERMISSIONS.MANAGE_STORES],
        roles: ['ADMIN'],
        group: 'Administration'
    },
    {
        icon: Package,
        label: 'Inventory',
        href: '/store/inventory',
        permissions: [PERMISSIONS.VIEW_INVENTORY, PERMISSIONS.MANAGE_INVENTORY],
        roles: ['ADMIN', 'STORE_MANAGER', 'SALES', 'ACCOUNTANT'],
        group: 'Inventory'
    },
    {
        icon: FolderTree,
        label: 'Categories',
        href: '/store/categories',
        permissions: [PERMISSIONS.VIEW_INVENTORY, PERMISSIONS.MANAGE_INVENTORY],
        roles: ['ADMIN', 'STORE_MANAGER'],
        group: 'Inventory'
    },
    {
        icon: Tag,
        label: 'Brands',
        href: '/store/brands',
        permissions: [PERMISSIONS.VIEW_INVENTORY, PERMISSIONS.MANAGE_INVENTORY],
        roles: ['ADMIN', 'STORE_MANAGER'],
        group: 'Inventory'
    },
    {
        icon: Ruler,
        label: 'Units',
        href: '/store/units',
        permissions: [PERMISSIONS.VIEW_INVENTORY, PERMISSIONS.MANAGE_INVENTORY],
        roles: ['ADMIN', 'STORE_MANAGER'],
        group: 'Inventory'
    },
    {
        icon: UserCheck,
        label: 'Customers',
        href: '/store/customers',
        permissions: [PERMISSIONS.VIEW_CUSTOMERS, PERMISSIONS.MANAGE_CUSTOMERS],
        roles: ['ADMIN', 'STORE_MANAGER', 'SALES', 'ACCOUNTANT'],
        group: 'Parties'
    },
    {
        icon: Truck,
        label: 'Suppliers',
        href: '/store/suppliers',
        permissions: [PERMISSIONS.VIEW_SUPPLIERS, PERMISSIONS.MANAGE_SUPPLIERS],
        roles: ['ADMIN', 'STORE_MANAGER', 'ACCOUNTANT'],
        group: 'Parties'
    },
    {
        icon: Receipt,
        label: 'Transactions',
        href: '/store/transactions',
        permissions: [PERMISSIONS.VIEW_TRANSACTIONS],
        roles: ['ADMIN', 'STORE_MANAGER', 'SALES', 'ACCOUNTANT'],
        group: 'Finance'
    },
    {
        icon: Wallet,
        label: 'Store Expenses',
        href: '/store/expenses',
        permissions: [PERMISSIONS.VIEW_EXPENSES, PERMISSIONS.CREATE_EXPENSE],
        roles: ['ADMIN', 'STORE_MANAGER', 'ACCOUNTANT'],
        group: 'Finance'
    },
    {
        icon: BarChart3,
        label: 'Reports',
        href: '/store/reports',
        permissions: [PERMISSIONS.VIEW_REPORTS],
        roles: ['ADMIN', 'STORE_MANAGER', 'SALES', 'ACCOUNTANT'],
        group: 'Finance'
    },
    {
        icon: Settings,
        label: 'Store Settings',
        href: '/store/settings',
        permissions: [PERMISSIONS.VIEW_SETTINGS, PERMISSIONS.MANAGE_SETTINGS],
        roles: ['ADMIN', 'STORE_MANAGER'],
        group: 'Administration'
    },
    {
        icon: ClipboardCheck,
        label: 'Approvals',
        href: '/store/approvals',
        permissions: [PERMISSIONS.MANAGE_SUBSCRIPTIONS],
        roles: ['SUPER_ADMIN'],
        group: 'Administration'
    },
    {
        icon: Coins,
        label: 'Plan Management',
        href: '/store/plans/manage',
        permissions: [PERMISSIONS.MANAGE_PLANS],
        roles: ['SUPER_ADMIN'],
        group: 'Administration'
    },
    {
        icon: Store,
        label: 'All Stores',
        href: '/store/stores-admin',
        permissions: [],
        roles: ['SUPER_ADMIN'],
        group: 'Administration'
    },
    {
        icon: Receipt,
        label: 'Billing History',
        href: '/store/billing',
        permissions: [],
        roles: ['ADMIN'],
        group: 'Administration'
    },
    {
        icon: Headphones,
        label: 'Support',
        href: '/support',
        permissions: [],
        roles: ['SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES', 'ACCOUNTANT'],
        group: 'Administration'
    }
];
// Replaced above

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

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6">
                {['Core', 'Inventory', 'Parties', 'Finance', 'Administration'].map((group) => {
                    const groupItems = visibleMenuItems.filter(item => item.group === group);
                    if (groupItems.length === 0) return null;

                    return (
                        <div key={group} className="space-y-1">
                            {!isCollapsed && (
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-3">
                                    {group}
                                </h4>
                            )}
                            {groupItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={item.href} href={item.href}>
                                        <motion.div
                                            whileHover={{ x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={cn(
                                                "relative flex items-center p-3 my-1 rounded-xl cursor-pointer group transition-all duration-200",
                                                isActive
                                                    ? "bg-primary/10 text-primary font-bold shadow-sm"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
                                            )}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="sidebar-active"
                                                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                                                />
                                            )}
                                            <div className="flex items-center min-w-[24px]">
                                                <item.icon className={cn(
                                                    "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                                                    isActive ? "text-primary" : ""
                                                )} />
                                            </div>

                                            {!isCollapsed && (
                                                <span className="ml-3 truncate font-semibold">
                                                    {item.label}
                                                </span>
                                            )}
                                            
                                            {isCollapsed && (
                                                <div className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg font-medium">
                                                    {item.label}
                                                </div>
                                            )}
                                        </motion.div>
                                    </Link>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

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
