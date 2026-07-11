"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    Shield, Check, X, Lock, Info, 
    ArrowLeft, RefreshCw, Save, AlertTriangle,
    Search, Filter, ChevronDown, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { permissionsApi } from '@/lib/api/permissions';
import { Button } from '@/components/UI';
import { ROLES, MODULES, MODULE_ACTIONS, MODULE_LABELS } from '@/lib/constants/permissions';

type MatrixData = Record<string, Record<string, string[]>>;

export default function PermissionMatrixPage() {
    const { id: storeId } = useParams() as { id: string };
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [matrix, setMatrix] = useState<MatrixData>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRole, setActiveRole] = useState<string>('STORE_MANAGER');

    const rolesOrder = ['ADMIN', 'STORE_MANAGER', 'SALES', 'ACCOUNTANT'];

    useEffect(() => {
        fetchMatrix();
    }, [storeId]);

    const fetchMatrix = async () => {
        try {
            setLoading(true);
            const response = await permissionsApi.getMatrix(storeId);
            setMatrix(response.data.data);
        } catch (error: any) {
            toast.error('Failed to load permission cluster');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAction = async (role: string, module: string, action: string) => {
        const currentActions = matrix[role]?.[module] || [];
        const isGranted = currentActions.includes(action);
        
        // Optimistic UI update
        const newActions = isGranted 
            ? currentActions.filter(a => a !== action)
            : [...currentActions, action];
            
        setMatrix(prev => ({
            ...prev,
            [role]: {
                ...prev[role],
                [module]: newActions
            }
        }));

        try {
            setSaving(`${role}-${module}-${action}`);
            if (isGranted) {
                await permissionsApi.revokeAction(role, module, storeId, { action });
            } else {
                await permissionsApi.grantAction(role, module, storeId, { action });
            }
        } catch (error) {
            // Revert on error
            setMatrix(prev => ({
                ...prev,
                [role]: {
                    ...prev[role],
                    [module]: currentActions
                }
            }));
            toast.error('Permission sync failed');
        } finally {
            setSaving(null);
        }
    };

    const handleResetRole = async (role: string) => {
        if (!confirm(`Reset all ${role} permissions to system defaults for this branch?`)) return;
        
        try {
            setLoading(true);
            await permissionsApi.resetRoleDefaults(role, storeId);
            toast.success(`${role} permissions reset`);
            fetchMatrix();
        } catch (error) {
            toast.error('Reset operation failed');
        } finally {
            setLoading(false);
        }
    };

    if (loading && Object.keys(matrix).length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-6">
                <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <div className="text-center">
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Accessing Neural Matrix</p>
                    <p className="text-xs text-slate-500 mt-2">Syncing store-scoped permissions...</p>
                </div>
            </div>
        );
    }

    const filteredModules = Object.entries(MODULE_ACTIONS).filter(([mod, _]) => 
        MODULE_LABELS[mod].toLowerCase().includes(searchTerm.toLowerCase()) ||
        mod.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => router.back()}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            Permission <span className="text-blue-500 italic underline decoration-blue-500/30">Matrix</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">
                            Configure granular security protocols for <span className="text-slate-900 dark:text-white font-bold">Branch ID: {storeId.slice(-6)}</span>
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    {rolesOrder.map(role => (
                        <button
                            key={role}
                            onClick={() => setActiveRole(role)}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeRole === role ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-600/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            {role.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Matrix Console */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Search modules (e.g. inventory, staff)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-sm text-slate-700 dark:text-slate-300"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={fetchMatrix}
                            className="flex items-center gap-2 px-5 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Sync Node
                        </button>
                        <button 
                            onClick={() => handleResetRole(activeRole)}
                            className="flex items-center gap-2 px-5 h-12 bg-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-black transition-all shadow-lg shadow-slate-900/10"
                        >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            Reset Defaults
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/80">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">Functional Module</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">Capability Protocol</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 text-right">Integrity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredModules.map(([module, actions]) => {
                                const currentActions = matrix[activeRole]?.[module] || [];
                                const hasAny = currentActions.length > 0;
                                const hasAll = currentActions.length === actions.length;

                                return (
                                    <motion.tr 
                                        key={module}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${hasAny ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{MODULE_LABELS[module]}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{module}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {hasAll ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Full Access
                                                </div>
                                            ) : hasAny ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    Partial
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200/50 dark:border-slate-700/50">
                                                    Locked
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-wrap gap-2">
                                                {actions.map(action => {
                                                    const isActive = currentActions.includes(action);
                                                    const isSaving = saving === `${activeRole}-${module}-${action}`;

                                                    return (
                                                        <button
                                                            key={action}
                                                            onClick={() => handleToggleAction(activeRole, module, action)}
                                                            disabled={isSaving}
                                                            className={`h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${
                                                                isActive 
                                                                    ? 'bg-white dark:bg-slate-900 border-blue-200 text-blue-600 shadow-sm ring-4 ring-blue-500/5' 
                                                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300'
                                                            }`}
                                                        >
                                                            {isSaving ? (
                                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                                            ) : isActive ? (
                                                                <Check className="w-3 h-3 stroke-[3]" />
                                                            ) : (
                                                                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                                            )}
                                                            {action}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 text-slate-200">
                                                {hasAll && <Lock className="w-4 h-4 text-emerald-400/30" />}
                                                {activeRole === 'ADMIN' && (
                                                    <span title="Critical role override" className="cursor-help">
                                                        <Info className="w-4 h-4 text-blue-400/30" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredModules.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs">No modules detected</p>
                        <p className="text-slate-400 text-xs mt-2 font-medium">Try adjusting your search sequence</p>
                    </div>
                )}
            </div>
            
            <div className="flex items-center justify-center gap-8 text-slate-400">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/40" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Node Online</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/40" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Matrix Synchronized</span>
                </div>
            </div>
        </div>
    );
}
