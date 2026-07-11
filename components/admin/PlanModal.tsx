'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plan } from '@/types';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  onSave: (data: Partial<Plan>) => void;
}

export default function PlanModal({ isOpen, onClose, plan, onSave }: PlanModalProps) {
  const [formData, setFormData] = useState<Partial<Plan>>({
    name: '',
    description: '',
    price: 0,
    billingCycle: 'monthly',
    isTrialPlan: false,
    durationInDays: 30,
    status: 'active',
    maxUsers: 5,
    maxBranches: 1,
    maxItems: 1000
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price || 0,
        billingCycle: plan.billingCycle || 'monthly',
        isTrialPlan: plan.isTrialPlan || false,
        durationInDays: plan.durationInDays || 30,
        status: plan.status || 'active',
        maxUsers: plan.maxUsers || 5,
        maxBranches: plan.maxBranches || 1,
        maxItems: plan.maxItems || 1000
      });
    } else {
      setFormData({
        name: '', description: '', price: 0, billingCycle: 'monthly', isTrialPlan: false, durationInDays: 30, status: 'active', maxUsers: 5, maxBranches: 1, maxItems: 1000
      });
    }
  }, [plan, isOpen]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value) }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative border border-slate-200 dark:border-slate-800"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {plan ? 'Edit Plan' : 'Create New Plan'}
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Plan Name</label>
                  <input required name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-xl dark:text-white outline-none transition-all placeholder:text-slate-400" placeholder="e.g. Professional Plan" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-xl dark:text-white outline-none transition-all placeholder:text-slate-400 min-h-[80px]" placeholder="Briefly describe what this plan offers..." />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-slate-400">Rs </span>
                    <input type="number" step="0.01" required name="price" value={formData.price} onChange={handleChange} className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-xl dark:text-white outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Billing Cycle</label>
                  <select name="billingCycle" value={formData.billingCycle} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-xl dark:text-white outline-none transition-all appearance-none cursor-pointer">
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex flex-wrap gap-6 items-center my-1 p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.isTrialPlan ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'}`}>
                      <input type="checkbox" name="isTrialPlan" checked={formData.isTrialPlan} onChange={handleChange} className="hidden" />
                      {formData.isTrialPlan && <X className="w-3.5 h-3.5 text-white rotate-45" />}
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Enable Trial Period</span>
                  </label>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Trial Duration (Days)</label>
                    <input type="number" required name="durationInDays" value={formData.durationInDays} onChange={handleChange} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Max Stores</label>
                  <input type="number" name="maxBranches" value={formData.maxBranches} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-xl dark:text-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Max Staff Users</label>
                  <input type="number" name="maxUsers" value={formData.maxUsers} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-xl dark:text-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Max Inventory Items</label>
                  <input type="number" name="maxItems" value={formData.maxItems} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-xl dark:text-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-xl dark:text-white outline-none transition-all appearance-none cursor-pointer">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold transition-all">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95">Save Plan</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
