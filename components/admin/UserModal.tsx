'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { X, User as UserIcon, Mail, Lock, Shield, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Tenant } from '@/types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  tenants: Tenant[];
  onSave: (data: any) => Promise<{ success: boolean; message?: string }>;
}

export default function UserModal({ isOpen, onClose, user, tenants, onSave }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SALES',
    tenantId: '',
    status: 'active'
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      let tId = '';
      if (user.tenantId) {
        tId = typeof user.tenantId === 'string' ? user.tenantId : (user.tenantId._id || user.tenantId.id || '');
      }
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'SALES',
        tenantId: tId,
        status: user.status || 'active'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'TENANT_ADMIN',
        tenantId: '',
        status: 'active'
      });
    }
    setErrorMsg(null);
  }, [user, isOpen]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+Rs /.test(formData.email)) {
      setErrorMsg('Invalid email format');
      setSaving(false);
      return;
    }

    // Validate password for new user
    if (!user && formData.password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      setSaving(false);
      return;
    }

    const payload: any = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      status: formData.status
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    if (formData.tenantId) {
      payload.tenantId = formData.tenantId;
    } else {
      payload.tenantId = null; // internal / no tenant
    }

    const res = await onSave(payload);
    setSaving(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message || 'Operation failed');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden relative border border-slate-200 dark:border-slate-800"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">
                    {user ? 'Modify User Profile' : 'Register Global User'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Manage cross-tenant platform credentials and roles.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[75vh] space-y-6">
              {errorMsg && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold uppercase tracking-wider">
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input 
                      required 
                      type="text"
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl dark:text-white outline-none transition-all placeholder:text-slate-400 text-sm font-medium" 
                      placeholder="e.g. Jane Doe" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input 
                      required 
                      type="email"
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl dark:text-white outline-none transition-all placeholder:text-slate-400 text-sm font-medium" 
                      placeholder="e.g. jane@company.com" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    {user ? 'New Password (Optional)' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="password"
                      name="password" 
                      value={formData.password} 
                      onChange={handleChange} 
                      required={!user}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl dark:text-white outline-none transition-all placeholder:text-slate-400 text-sm font-medium" 
                      placeholder={user ? 'Leave blank to keep current' : 'Min. 8 characters'} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">User Role</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <select 
                      name="role" 
                      value={formData.role} 
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl dark:text-white outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                    >
                      <option value="SUPER_ADMIN">SUPER_ADMIN (Platform Owner)</option>
                      <option value="TENANT_ADMIN">TENANT_ADMIN (Shopkeeper Owner)</option>
                      <option value="ADMIN">ADMIN (Tenant Supervisor)</option>
                      <option value="STORE_MANAGER">STORE_MANAGER (Branch Manager)</option>
                      <option value="SALES">SALES (Counter Staff)</option>
                      <option value="ACCOUNTANT">ACCOUNTANT (Financial Auditor)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Tenant Affiliation</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <select 
                      name="tenantId" 
                      value={formData.tenantId} 
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl dark:text-white outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                    >
                      <option value="">None (System / Internal Admin)</option>
                      {tenants.map(t => (
                        <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">User Status</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                      <input 
                        type="radio" 
                        name="status" 
                        value="active" 
                        checked={formData.status === 'active'} 
                        onChange={handleChange}
                        className="accent-indigo-600"
                      />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                      <input 
                        type="radio" 
                        name="status" 
                        value="inactive" 
                        checked={formData.status === 'inactive'} 
                        onChange={handleChange}
                        className="accent-indigo-600"
                      />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Inactive</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-700/30 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Saving User...
                    </>
                  ) : (
                    user ? 'Update User' : 'Register User'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
