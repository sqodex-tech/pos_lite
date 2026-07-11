"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Store, X, Building2, Phone, Mail, MapPin, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { storesApi, Store as StoreType } from '@/lib/api/stores';
import { storeSchema, StoreFormValues } from '@/lib/validations/store';
import { Button } from '@/components/UI';

interface StoreModalProps {
    store: StoreType | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function StoreModal({ store, onClose, onSuccess }: StoreModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<StoreFormValues>({
        resolver: zodResolver(storeSchema),
        defaultValues: {
            name: store?.name || '',
            code: store?.code || '',
            address: store?.address || '',
            phone: store?.phone || '',
            email: store?.email || '',
            status: (store?.status as 'active' | 'inactive') || 'active',
        }
    });

    useEffect(() => {
        if (store) {
            reset({
                name: store.name,
                code: store.code,
                address: store.address || '',
                phone: store.phone || '',
                email: store.email || '',
                status: (store.status as 'active' | 'inactive') || 'active',
            });
        }
    }, [store, reset]);

    const onSubmit = async (data: StoreFormValues) => {
        try {
            if (store) {
                const storeId = store.id || store._id;
                if (!storeId) throw new Error('Invalid store ID');
                await storesApi.update(storeId, data);
                toast.success('Node reconfigured successfully');
            } else {
                await storesApi.create(data);
                toast.success('Store created successfully');
            }
            onSuccess();
        } catch (error: any) {
            console.error('Store operation error:', error);
            const errorMessage = error.response?.data?.error?.message || 
                               error.response?.data?.message || 
                               'Failed to save store';
            toast.error(errorMessage);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                            {store ? 'Edit Store' : 'Create New Store'}
                        </h2>
                        <p className="text-sm font-medium text-slate-500">
                            {store ? 'Update branch details and configuration' : 'Register a new business location'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                Store Name
                            </label>
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    {...register('name')}
                                    className={`w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 ${errors.name ? 'border-rose-500 bg-rose-50/30' : ''}`}
                                    placeholder="San Francisco HQ"
                                />
                            </div>
                            {errors.name && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                Store Code
                            </label>
                            <div className="relative group">
                                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    {...register('code')}
                                    className={`w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 ${errors.code ? 'border-rose-500 bg-rose-50/30' : ''}`}
                                    placeholder="SF-001"
                                />
                            </div>
                            {errors.code && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.code.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                            Physical Address
                        </label>
                        <div className="relative group">
                            <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <textarea
                                {...register('address')}
                                rows={3}
                                className={`w-full py-3 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 resize-none ${errors.address ? 'border-rose-500 bg-rose-50/30' : ''}`}
                                placeholder="123 Innovation Drive, Suite 400..."
                            />
                        </div>
                        {errors.address && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.address.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                Contact Phone
                            </label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    {...register('phone')}
                                    className={`w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 ${errors.phone ? 'border-rose-500 bg-rose-50/30' : ''}`}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            {errors.phone && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.phone.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                Store Email
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    {...register('email')}
                                    className={`w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 ${errors.email ? 'border-rose-500 bg-rose-50/30' : ''}`}
                                    placeholder="sf-branch@sumbox.pro"
                                />
                            </div>
                            {errors.email && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.email.message}</p>}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Active Status</p>
                            <p className="text-[10px] font-medium text-slate-500">Enable or disable this store location</p>
                        </div>
                        <select
                            {...register('status')}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
                        >
                            <option value="active" className="text-emerald-600">Active</option>
                            <option value="inactive" className="text-rose-600">Inactive</option>
                        </select>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 rounded-xl font-black uppercase tracking-widest text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Processing...</span>
                                </div>
                            ) : (
                                <span>{store ? 'Update Branch' : 'Register Branch'}</span>
                            )}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
