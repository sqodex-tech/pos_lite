"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, User, LogOut, Store, MapPin, ChevronDown, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { storesApi, Store as StoreType } from '@/lib/api/stores';
import { NotificationDropdown } from '@/components/shared/NotificationDropdown';
import { useTheme } from 'next-themes';
import { ThemeToggle } from '@/components/UI';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

interface StoreDetails {
    _id: string;
    name: string;
    address?: string;
}

interface TenantDetails {
    _id: string;
    name: string;
    email: string;
}

export function Navbar() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [storeDetails, setStoreDetails] = useState<StoreDetails | null>(null);
    const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null);
    
    // Store Dropdown state
    const [stores, setStores] = useState<StoreType[]>([]);
    const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
    const storeDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const userData = authApi.getUser();
        setUser(userData);

        // Load store details
        const storeDetailsStr = localStorage.getItem('storeDetails');
        if (storeDetailsStr) {
            try {
                setStoreDetails(JSON.parse(storeDetailsStr));
            } catch (error) {
                console.error('Failed to parse store details:', error);
            }
        }

        // Load tenant details
        const tenantDetailsStr = localStorage.getItem('tenantDetails');
        if (tenantDetailsStr) {
            try {
                setTenantDetails(JSON.parse(tenantDetailsStr));
            } catch (error) {
                console.error('Failed to parse tenant details:', error);
            }
        }

        // Fetch user's stores
        const fetchStores = async () => {
            try {
                const res = await storesApi.getAll({ limit: 100 });
                if (res.data && Array.isArray(res.data.data)) {
                    setStores(res.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch stores:', error);
            }
        };

        if (userData?.role !== 'SUPER_ADMIN') {
            fetchStores();
        }
    }, []);

    // Handle clicking outside the dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target as Node)) {
                setIsStoreDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        authApi.logout();
        router.push('/login');
    };

    const handleSwitchStore = (store: StoreType) => {
        localStorage.setItem('storeId', store._id);
        const newStoreDetails = { _id: store._id, name: store.name, address: store.address };
        localStorage.setItem('storeDetails', JSON.stringify(newStoreDetails));
        setStoreDetails(newStoreDetails);
        setIsStoreDropdownOpen(false);
        // Force reload to apply new store context across the app
        window.location.reload();
    };

    return (
        <header className="h-20 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
            {/* Search Bar */}
            <div className="relative w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Search items, transactions..."
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-600 dark:text-slate-400 placeholder:text-slate-400"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-400 shadow-sm">
                    ⌘ K
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                {/* Store Information Dropdown */}
                {storeDetails && (
                    <div className="relative" ref={storeDropdownRef}>
                        <button
                            onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                            className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left"
                        >
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                <Store className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                                    {storeDetails.name}
                                </span>
                                {storeDetails.address && (
                                    <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {storeDetails.address.length > 25 
                                            ? storeDetails.address.substring(0, 25) + '...' 
                                            : storeDetails.address}
                                    </span>
                                )}
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-400 ml-2 transition-transform duration-200 ${isStoreDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {isStoreDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 py-2"
                                >
                                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Switch Store</p>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto p-2">
                                        {stores.map((store) => (
                                            <button
                                                key={store._id}
                                                onClick={() => handleSwitchStore(store)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left mb-1 ${
                                                    store._id === storeDetails._id 
                                                    ? 'bg-primary/5 border border-primary/20' 
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'
                                                }`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-bold ${store._id === storeDetails._id ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                                                        {store.name}
                                                    </span>
                                                    <span className="text-xs text-slate-500 mt-1 line-clamp-1">{store.address}</span>
                                                </div>
                                                {store._id === storeDetails._id && (
                                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                        <Check className="w-3 h-3 text-primary" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                        {stores.length === 0 && (
                                            <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                                No other stores available.
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Tenant Information (for non-store users or additional context) */}
                {tenantDetails && !storeDetails && (
                    <div className="flex flex-col items-end mr-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                            Organization
                        </span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {tenantDetails.name}
                        </span>
                    </div>
                )}

                <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800" />

                <div className="mt-1 flex items-center gap-2">
                    <ThemeToggle />
                    <NotificationDropdown />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">{user?.name || 'User'}</p>
                            <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">{user?.role || 'User'}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden group-hover:border-primary/50 transition-all">
                            <User className="w-6 h-6 text-slate-400" />
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
