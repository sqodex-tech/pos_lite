"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Mail, Lock, ArrowRight, Shield, Users, AlertCircle, Building2, Phone, MapPin, LifeBuoy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api/auth';
import { Button, Input, ThemeToggle } from '@/components/UI';
import Image from 'next/image';
import Link from 'next/link';

import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function AuthPage() {
    const router = useRouter();
    const [authType, setAuthType] = useState<'login' | 'register'>('login');
    const [formData, setFormData] = useState({
        name: '', // Business Name
        email: '',
        password: '',
        phone: '',
        address: '',
        role: 'ADMIN' // Always ADMIN for registration
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; phone?: string; address?: string }>({});

    // Check if already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                router.push('/store');
            } catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    }, [router]);

    // Validate form
    const validateForm = () => {
        const newErrors: { name?: string; email?: string; password?: string; phone?: string; address?: string } = {};

        if (authType === 'register') {
            if (!formData.name) newErrors.name = 'Business name is required';
            if (!formData.phone) newErrors.phone = 'Phone number is required';
            if (!formData.address) newErrors.address = 'Business address is required';
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+Rs /.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setLoading(true);

        try {
            if (authType === 'login') {
                // 1. Authenticate with Firebase
                const userCredential = await signInWithEmailAndPassword(auth, formData.email.trim().toLowerCase(), formData.password);
                const token = await userCredential.user.getIdToken();

                // 2. Exchange token with backend for user details
                const response = await authApi.login(token);

                const { user } = response.data.data;
                const accessToken = token;

                if (!user.tenantId) {
                    toast.error('Your account is not associated with any tenant.');
                    setLoading(false);
                    return;
                }

                if (user.tenant.status !== 'active') {
                    toast.error(user.tenant.status === 'suspended' ? 'Your account is suspended.' : 'Your account is inactive.');
                    setLoading(false);
                    return;
                }

                localStorage.setItem('token', accessToken);
                localStorage.setItem('user', JSON.stringify(user));
                
                // Automatically set the active store context if the user has an assigned default store
                if (user.defaultStoreId) {
                    const storeId = typeof user.defaultStoreId === 'string' ? user.defaultStoreId : user.defaultStoreId._id;
                    localStorage.setItem('storeId', storeId);
                    
                    if (typeof user.defaultStoreId === 'object') {
                        localStorage.setItem('storeDetails', JSON.stringify({
                            _id: user.defaultStoreId._id,
                            name: user.defaultStoreId.name,
                            address: user.defaultStoreId.address
                        }));
                    }
                } else {
                    localStorage.removeItem('storeId');
                    localStorage.removeItem('storeDetails');
                }

                // Set tenant details for visual context in the Navbar
                if (user.tenantId && typeof user.tenantId === 'object') {
                    localStorage.setItem('tenantDetails', JSON.stringify({
                        _id: user.tenantId._id,
                        name: user.tenantId.name,
                        email: user.tenantId.email
                    }));
                }

                document.cookie = `token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

                toast.success(`Welcome back, ${user.name}!`);
                window.location.href = '/store';
            } else {
                // Registration Flow
                await authApi.register({
                    name: formData.name,
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password,
                    phone: formData.phone,
                    address: formData.address,
                    role: 'ADMIN'
                });

                toast.success('Registration successful! Signing you in...');
                setAuthType('login');
                setLoading(false);
            }
        } catch (error: any) {
            console.error('Auth error:', error);
            const message = error.response?.data?.error?.message || error.response?.data?.message || 'Action failed. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setErrors({});
        setLoading(true);

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const token = await result.user.getIdToken();

            const response = await authApi.googleLogin(token);

            const { user } = response.data.data;
            const accessToken = token;

            if (!user.tenantId) {
                toast.error('Your account is not associated with any tenant.');
                setLoading(false);
                return;
            }

            if (user.tenant.status !== 'active') {
                toast.error(user.tenant.status === 'suspended' ? 'Your account is suspended.' : 'Your account is inactive.');
                setLoading(false);
                return;
            }

            localStorage.setItem('token', accessToken);
            localStorage.setItem('user', JSON.stringify(user));
            
            if (user.defaultStoreId) {
                const storeId = typeof user.defaultStoreId === 'string' ? user.defaultStoreId : user.defaultStoreId._id;
                localStorage.setItem('storeId', storeId);
                
                if (typeof user.defaultStoreId === 'object') {
                    localStorage.setItem('storeDetails', JSON.stringify({
                        _id: user.defaultStoreId._id,
                        name: user.defaultStoreId.name,
                        address: user.defaultStoreId.address
                    }));
                }
            } else {
                localStorage.removeItem('storeId');
                localStorage.removeItem('storeDetails');
            }

            if (user.tenantId && typeof user.tenantId === 'object') {
                localStorage.setItem('tenantDetails', JSON.stringify({
                    _id: user.tenantId._id,
                    name: user.tenantId.name,
                    email: user.tenantId.email
                }));
            }

            document.cookie = `token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

            toast.success(`Welcome back, ${user.name}!`);
            window.location.href = '/store';
        } catch (error: any) {
            console.error('Google Auth error:', error);
            if (error.code === 'auth/popup-closed-by-user') {
                toast.error('Sign-in popup was closed. Please try again.');
                return;
            }
            const message = error.response?.data?.error?.message || error.response?.data?.message || 'Google authentication failed. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const toggleAuth = (type: 'login' | 'register') => {
        setAuthType(type);
        setErrors({});
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Top Navigation */}
            <div className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
                <div className="lg:hidden flex items-center gap-2">
                    <Store className="text-emerald-500 w-6 h-6" />
                    <span className="font-black text-xl italic tracking-tighter text-slate-900 dark:text-white">
                        Sumbox<span className="text-emerald-500">Pro</span>
                    </span>
                </div>
                <div className="hidden lg:block"></div> {/* Spacer for desktop */}
                <ThemeToggle />
            </div>

            {/* Left Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 pt-24 pb-12 relative z-10">
                <main className="w-full max-w-[460px]">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        {/* Header */}
                        <div className="text-center lg:text-left mb-10">
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                                {authType === 'login' ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                {authType === 'login' ? 'Enter your details to access your dashboard.' : 'Start managing your enterprise business today.'}
                            </p>
                        </div>

                        {/* Selector */}
                        <div className="relative flex bg-slate-200/50 dark:bg-slate-800/80 p-1.5 rounded-2xl mb-10 border border-slate-200 dark:border-slate-700">
                            <motion.div
                                className="absolute inset-y-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
                                initial={false}
                                animate={{
                                    left: authType === 'login' ? '6px' : 'calc(50% + 3px)',
                                    width: 'calc(50% - 9px)'
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                            <button
                                onClick={() => toggleAuth('login')}
                                className={`relative z-10 flex-1 py-2.5 text-xs font-black uppercase tracking-widest transition-colors duration-300 ${authType === 'login' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => toggleAuth('register')}
                                className={`relative z-10 flex-1 py-2.5 text-xs font-black uppercase tracking-widest transition-colors duration-300 ${authType === 'register' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Register
                            </button>
                        </div>

                        {/* Form Fields */}
                        <div className="mb-6">
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full h-14 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black rounded-2xl shadow-sm transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    <path d="M1 1h22v22H1z" fill="none"/>
                                </svg>
                                Continue with Google
                            </button>
                        </div>

                        <div className="relative flex items-center mb-6">
                            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">or email</span>
                            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <AnimatePresence mode="wait">
                                {authType === 'register' && (
                                    <motion.div
                                        key="reg-extra"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-5 overflow-hidden"
                                    >
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Business Name</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Building2 className="w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Acme Corp."
                                                    className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            {errors.name && <p className="text-rose-500 text-[10px] font-bold mt-1.5">{errors.name}</p>}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Phone className="w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        placeholder="+1..."
                                                        className="w-full h-12 pl-11 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    />
                                                </div>
                                                {errors.phone && <p className="text-rose-500 text-[10px] font-bold mt-1.5">{errors.phone}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Location</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <MapPin className="w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="City, Area"
                                                        className="w-full h-12 pl-11 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm"
                                                        value={formData.address}
                                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    />
                                                </div>
                                                {errors.address && <p className="text-rose-500 text-[10px] font-bold mt-1.5">{errors.address}</p>}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="admin@business.com"
                                        className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                {errors.email && <p className="text-rose-500 text-[10px] font-bold mt-1.5">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                {errors.password && <p className="text-rose-500 text-[10px] font-bold mt-1.5">{errors.password}</p>}
                            </div>

                            {authType === 'login' && (
                                <div className="flex items-center justify-between text-xs font-bold mt-2">
                                    <label className="flex items-center gap-2 text-slate-500 cursor-pointer group">
                                        <input type="checkbox" className="w-4 h-4 accent-primary rounded bg-slate-100 border-none cursor-pointer" />
                                        <span>Remember me</span>
                                    </label>
                                    <button type="button" className="text-primary hover:text-primary-dark transition-colors">Forgot password?</button>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 mt-4 bg-primary hover:bg-primary-dark text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>Please wait...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>{authType === 'login' ? 'Sign In' : 'Create Account'}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                )}
                            </Button>
                        </form>
                    </motion.div>
                </main>
            </div>

            {/* Right Side: Visual/Branding (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 dark:bg-black relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -mr-64 -mt-64" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[100px] -ml-64 -mb-64" />
                </div>
                
                <div className="relative z-10 w-full max-w-lg p-12 text-white">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 transform -rotate-6">
                            <Store className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic">
                            Sumbox<span className="text-emerald-400">Pro</span>
                        </h1>
                    </div>
                    
                    <h2 className="text-5xl font-black tracking-tight mb-6 leading-tight">
                        Powering modern <br />
                        <span className="text-emerald-400">retail empires.</span>
                    </h2>
                    
                    <p className="text-lg text-slate-300 font-medium mb-12">
                        Advanced inventory management, intelligent insights, and seamless operations across all your branches.
                    </p>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                            <Users className="w-6 h-6 text-emerald-400 mb-3" />
                            <h3 className="font-bold mb-1">Multi-Tenant</h3>
                            <p className="text-sm text-slate-400">Manage multiple businesses from one account.</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                            <Shield className="w-6 h-6 text-emerald-400 mb-3" />
                            <h3 className="font-bold mb-1">Secure</h3>
                            <p className="text-sm text-slate-400">Enterprise-grade security and permissions.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
