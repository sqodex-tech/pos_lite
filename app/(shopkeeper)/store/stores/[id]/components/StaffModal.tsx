"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, User, Mail, Phone, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { usersApi } from '@/lib/api/users';
import { userSchema, UserFormValues } from '@/lib/validations/user';
import { Button } from '@/components/UI';

interface StaffModalProps {
    storeId: string;
    staff: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function StaffModal({ storeId, staff, onClose, onSuccess }: StaffModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting }
    } = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: staff?.name || '',
            email: staff?.email || '',
            phone: staff?.phone || '',
            role: staff?.role || 'SALES',
            status: staff?.status || 'active',
            password: '',
        }
    });

    useEffect(() => {
        if (staff) {
            reset({
                name: staff.name,
                email: staff.email,
                phone: staff.phone || '',
                role: staff.role,
                status: staff.status,
                password: '',
            });
        }
    }, [staff, reset]);

    const onSubmit = async (data: UserFormValues) => {
        try {
            // Get current user's tenantId from localStorage if possible
            const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
            let tenantId = null;
            if (userStr) {
                const currentUser = JSON.parse(userStr);
                tenantId = currentUser.tenantId?.id || currentUser.tenantId?._id || currentUser.tenantId;
            }

            if (staff) {
                // Update existing staff
                const { password, ...updateData } = data;
                const payload: any = { ...updateData, storeId };
                if (password && password.length >= 8) {
                    payload.password = password;
                }
                await usersApi.update(staff.id || staff._id, payload);
                toast.success('Staff member updated successfully');
            } else {
                // Create new staff
                if (!data.password || data.password.length < 8) {
                    toast.error('Password is required for new staff (min 8 characters)');
                    return;
                }
                const createData = {
                    ...data,
                    storeId,
                    tenantId,
                    assignedStores: [storeId],
                    defaultStoreId: storeId,
                };
                await usersApi.create(createData);
                toast.success('Staff member onboarded successfully');
            }
            onSuccess();
        } catch (error: any) {
            console.error('Staff operation error:', error);
            const errorMessage = error.response?.data?.error?.message || 
                               error.response?.data?.message || 
                               'Failed to save staff data';
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
                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
                        <User className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                            {staff ? 'Update Staff Member' : 'Onboard New Staff'}
                        </h2>
                        <p className="text-sm font-medium text-slate-500">
                            {staff ? 'Modify permissions and personal details' : 'Register a new operator for this node'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                            Full Legal Name
                        </label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                {...register('name')}
                                className={`w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 ${errors.name ? 'border-rose-500 bg-rose-50/30' : ''}`}
                                placeholder="Alexander Hamilton"
                            />
                        </div>
                        {errors.name && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                Email Address (Login ID)
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    {...register('email')}
                                    className={`w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 ${errors.email ? 'border-rose-500 bg-rose-50/30' : ''}`}
                                    placeholder="alex@sumbox.pro"
                                />
                            </div>
                            {errors.email && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                Communication Line (Phone)
                            </label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    {...register('phone')}
                                    className={`w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 ${errors.phone ? 'border-rose-500 bg-rose-50/30' : ''}`}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            {errors.phone && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.phone.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                Secure Access Key (Password)
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="password"
                                    {...register('password')}
                                    className={`w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 ${errors.password ? 'border-rose-500 bg-rose-50/30' : ''}`}
                                    placeholder={staff ? 'Leave blank to retain current' : 'At least 8 characters...'}
                                />
                            </div>
                            {errors.password && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.password.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                Functional Designation (Role)
                            </label>
                            <div className="relative group">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <select
                                    {...register('role')}
                                    className={`w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all font-black text-xs uppercase tracking-widest text-slate-700 dark:text-slate-300 ${errors.role ? 'border-rose-500 bg-rose-50/30' : ''}`}
                                >
                                    <option value="SALES">Operations / Sales</option>
                                    <option value="STORE_MANAGER">Branch Commander (Manager)</option>
                                    <option value="ACCOUNTANT">Financial Auditor (Accountant)</option>
                                </select>
                            </div>
                            {errors.role && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.role.message}</p>}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Personnel Status</p>
                            <p className="text-[10px] font-medium text-slate-500">Enable or suspend system access</p>
                        </div>
                        <select
                            {...register('status')}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                        >
                            <option value="active" className="text-emerald-600 font-bold">Active</option>
                            <option value="inactive" className="text-amber-600 font-bold">Suspended</option>
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
                            className="flex-1 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Syncing...</span>
                                </div>
                            ) : (
                                <span>{staff ? 'Update Personnel' : 'Finalize Onboarding'}</span>
                            )}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
