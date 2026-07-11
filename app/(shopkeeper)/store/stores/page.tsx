"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Store, Plus, Search, Filter, RefreshCw, 
    MoreHorizontal, Edit, Trash2, MapPin, 
    Phone, Mail, Building2, Store as StoreIcon,
    ChevronRight, LayoutGrid, List, SlidersHorizontal,
    Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { storesApi, Store as StoreType } from '@/lib/api/stores';
import { Button, AccessDenied } from '@/components/UI';
import { useRouter } from 'next/navigation';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';
import StoreModal from './components/StoreModal';

const ContextToggle = ({ isActive, onToggle }: { isActive: boolean, onToggle: (e: React.MouseEvent) => void }) => (
    <div className="flex items-center gap-3">
        <button
            onClick={onToggle}
            disabled={isActive}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isActive 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 cursor-default' 
                    : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-emerald-400 shadow-sm active:scale-95'
            }`}
        >
            {isActive ? '✓ Current Store' : 'Set as Current'}
        </button>
    </div>
);

export default function StoresPage() {
    const router = useRouter();
    const { hasPermission, loading: permissionsLoading } = usePermissions();
    
    const [stores, setStores] = useState<StoreType[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    
    const [showModal, setShowModal] = useState(false);
    const [editingStore, setEditingStore] = useState<StoreType | null>(null);

    const fetchStores = useCallback(async () => {
        try {
            setLoading(true);
            const params: any = {
                search: searchTerm || undefined,
            };
            
            const response = await storesApi.getAll(params);
            let data = Array.isArray(response.data.data) ? response.data.data : [];
            
            if (statusFilter !== 'all') {
                data = data.filter(s => s.status === statusFilter);
            }
            
            setStores(data);
        } catch (error: any) {
            console.error('Error fetching stores:', error);
            toast.error('Failed to load stores cluster data');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setActiveStoreId(localStorage.getItem('storeId'));
        }
        if (!permissionsLoading) {
            fetchStores();
        }
    }, [fetchStores, permissionsLoading]);

    const handleCreate = () => {
        setEditingStore(null);
        setShowModal(true);
    };

    const handleAccessStore = (store: any) => {
        const id = store.id || store._id;
        localStorage.setItem('storeId', id as string);
        localStorage.setItem('storeDetails', JSON.stringify({
            _id: id,
            name: store.name,
            address: store.address
        }));
        
        window.location.href = `/store/stores/${id}`;
    };

    const handleSetAsActive = (e: React.MouseEvent, store: any) => {
        e.stopPropagation();
        const id = store.id || store._id;
        
        if (activeStoreId === id) {
            // Deselect context
            localStorage.removeItem('storeId');
            localStorage.removeItem('storeDetails');
        } else {
            // Select context
            localStorage.setItem('storeId', id as string);
            localStorage.setItem('storeDetails', JSON.stringify({
                _id: id,
                name: store.name,
                address: store.address
            }));
        }
        
        window.location.reload();
    };

    const handleEdit = (e: React.MouseEvent, store: StoreType) => {
        e.stopPropagation();
        setEditingStore(store);
        setShowModal(true);
    };

    const handleDelete = async (e: React.MouseEvent, store: StoreType) => {
        e.stopPropagation();
        const storeId = store.id || store._id;
        if (!storeId) {
            toast.error('Invalid store ID');
            return;
        }
        if (!confirm(`Confirm decommissioning of branch: ${store.name}?`)) return;

        try {
            await storesApi.delete(storeId);
            toast.success('Branch decommissioned successfully');
            fetchStores();
        } catch (error: any) {
            console.error('Error deleting store:', error);
            const msg = error.response?.data?.error?.message || 'Decommissioning failed';
            toast.error(msg);
        }
    };

    if (permissionsLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Synchronizing Permissions...</p>
            </div>
        );
    }

    if (!hasPermission(PERMISSIONS.VIEW_STORES)) {
        return <AccessDenied />;
    }

    const canManageStores = hasPermission(PERMISSIONS.MANAGE_STORES);

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        Infrastructure <span className="text-emerald-500 italic">Nodes</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-2 max-w-md">
                        Manage regional hubs, retail outlets, and distribution centers across your enterprise network.
                    </p>
                </div>
                {canManageStores && (
                    <Button 
                        onClick={handleCreate} 
                        className="h-12 px-6 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black gap-2 shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-1 transition-all uppercase tracking-widest text-xs"
                    >
                        <Plus className="w-4 h-4" />
                        Initialize Node
                    </Button>
                )}
            </div>

            {/* Matrix Controls */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search by Node ID or Location Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all font-bold text-sm text-slate-700 dark:text-slate-300"
                    />
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <button 
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setStatusFilter('active')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${statusFilter === 'active' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Online
                        </button>
                        <button 
                            onClick={() => setStatusFilter('inactive')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${statusFilter === 'inactive' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Offline
                        </button>
                    </div>

                    <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block" />

                    <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-400'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-400'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <button 
                        onClick={() => fetchStores()}
                        className="p-3 bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 hover:text-emerald-600 rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-64 bg-slate-100/50 dark:bg-slate-800/50 animate-pulse rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50" />
                    ))}
                </div>
            ) : stores.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6">
                        <Building2 className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Infrastructure Detected</h3>
                    <p className="text-slate-500 font-medium mb-8 text-center max-w-sm">
                        Zero active nodes found matching your current matrix filters.
                    </p>
                    {canManageStores && (
                        <Button onClick={handleCreate} className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-xs">
                            Initialize First Node
                        </Button>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {stores.map((store, index) => (
                            <motion.div
                                key={store.id || store._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                onClick={() => handleAccessStore(store)}
                                className={`group relative rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden border ${
                                    activeStoreId === (store.id || store._id) 
                                        ? 'bg-emerald-50/10 dark:bg-emerald-900/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
                                        : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                {activeStoreId === (store.id || store._id) && (
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
                                )}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                                
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                                            <StoreIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{store.name}</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">NODE_UID: {store.code}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 items-center">
                                        {activeStoreId === (store.id || store._id) && (
                                            <div className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                                                Active Context
                                            </div>
                                        )}
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${
                                            store.status === 'active' 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                : 'bg-rose-50 text-rose-600 border-rose-100'
                                        }`}>
                                            {store.status === 'active' ? 'Online' : 'Offline'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{store.address}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{store.phone}</span>
                                    </div>
                                    {store.email && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{store.email}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <ContextToggle 
                                        isActive={activeStoreId === (store.id || store._id)} 
                                        onToggle={(e) => handleSetAsActive(e, store)} 
                                    />
                                    
                                    {canManageStores && (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={(e) => handleEdit(e, store)}
                                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                title="Reconfigure"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDelete(e, store)}
                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                title="Decommission"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 dark:border-slate-700/60 shadow-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Node Cluster</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Code/ID</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Info</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stores.map((store) => {
                                const isActive = activeStoreId === (store.id || store._id);
                                return (
                                <tr 
                                    key={store.id || store._id} 
                                    onClick={() => router.push(`/store/stores/${store.id || store._id}`)}
                                    className={`cursor-pointer transition-colors duration-300 ${
                                        isActive 
                                            ? 'bg-emerald-50/40 dark:bg-emerald-900/10 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20' 
                                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                                    }`}
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl flex items-center justify-center shrink-0">
                                                <StoreIcon className="w-4 h-4" />
                                            </div>
                                            <span className="font-black text-slate-900 dark:text-white">{store.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <code className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-400">{store.code}</code>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                                <Phone className="w-3 h-3 text-slate-400" /> {store.phone}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                <MapPin className="w-3 h-3" /> {store.address.split(',')[0]}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                            store.status === 'active' 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                : 'bg-rose-50 text-rose-600 border-rose-100'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${store.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            {store.status === 'active' ? 'Online' : 'Offline'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex justify-end items-center gap-4">
                                            <div className="flex items-center gap-2 mr-2">
                                                <ContextToggle 
                                                    isActive={isActive} 
                                                    onToggle={(e) => handleSetAsActive(e, store)} 
                                                />
                                            </div>
                                            {canManageStores && (
                                                <>
                                                    <button 
                                                        onClick={() => router.push(`/store/stores/${store._id}/permissions`)}
                                                        className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                                        title="Manage Node Permissions"
                                                    >
                                                        <Shield className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleEdit(e, store)}
                                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDelete(e, store)}
                                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Subsystem */}
            <AnimatePresence>
                {showModal && (
                    <StoreModal
                        store={editingStore}
                        onClose={() => setShowModal(false)}
                        onSuccess={() => {
                            setShowModal(false);
                            fetchStores();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
