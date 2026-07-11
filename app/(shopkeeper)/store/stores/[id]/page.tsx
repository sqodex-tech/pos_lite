"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Store as StoreIcon, MapPin, 
    Phone, Mail, Plus, Edit, 
    Trash2, AlertCircle, RefreshCw,
    Search, Shield, Calendar, ChevronRight,
    Building2, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { storesApi, Store as StoreType } from '@/lib/api/stores';
import { Button } from '@/components/UI';

export default function StoreDetailPage() {
    const params = useParams();
    const router = useRouter();
    const storeId = params.id as string;

    const [store, setStore] = useState<StoreType | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchStoreDetails = useCallback(async () => {
        try {
            setLoading(true);
            const response = await storesApi.getById(storeId);
            setStore(response.data.data);
        } catch (error: any) {
            console.error('Error fetching store:', error);
            toast.error('Failed to fetch store details');
        } finally {
            setLoading(false);
        }
    }, [storeId]);

    useEffect(() => {
        if (storeId) {
            fetchStoreDetails();
        }
    }, [fetchStoreDetails, storeId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Loading store details...</p>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-rose-50/30 rounded-[3rem] border border-dashed border-rose-200">
                <AlertCircle className="w-20 h-20 text-rose-300 mb-6" />
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Store Not Found</h3>
                <p className="text-slate-500 font-medium mb-8 text-center max-w-sm">
                    The requested store could not be located or you do not have permission to view it.
                </p>
                <Button onClick={() => router.push('/store/stores')} className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-xs ring-offset-2">
                    Return to Stores
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Navigation */}
            <div className="flex items-center gap-6">
                <button
                    onClick={() => router.push('/store/stores')}
                    className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-900 transition-all shadow-sm active:scale-90"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{store.name}</h1>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            store.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                            {store.status === 'active' ? '● Online' : '○ Offline'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Store Profile Card */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                        
                        <div className="w-20 h-20 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-slate-900/20 dark:shadow-white/10">
                            <StoreIcon className="w-10 h-10" />
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">Asset Identifier</p>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{store.code}</h2>
                            </div>

                            <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl">
                                    <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Geolocation</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{store.address}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl">
                                    <Phone className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Operation Line</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{store.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl">
                                    <Mail className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Digital Channel</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{store.email || "N/A"}</p>
                                    </div>
                                </div>
                            </div>

                            <Button 
                                className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs gap-3 shadow-xl"
                                onClick={() => router.push('/store/stores')}
                            >
                                <Edit className="w-4 h-4" />
                                Global Hub
                            </Button>
                        </div>
                    </div>

                    {/* Stats Snapshot */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-[2rem]">
                            <Activity className="w-6 h-6 text-emerald-600 mb-3" />
                            <p className="text-[10px] font-black uppercase text-emerald-600/60 tracking-widest">Operational Status</p>
                            <p className="text-2xl font-black text-emerald-700">99.9%</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
