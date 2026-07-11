'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { X, FileText, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tenant } from '@/types';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'cheque', 'manual'];
const STATUSES = ['paid', 'pending', 'failed', 'refunded'];

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onSave: (data: any) => Promise<void>;
  tenantId?: string; // fallback if tenant object isn't full
}

export default function InvoiceModal({ isOpen, onClose, tenant, onSave, tenantId }: InvoiceModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    status: 'paid',
    paymentMethod: 'manual',
    description: '',
    invoiceUrl: '',
  });
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Valid amount required');
      return;
    }
    if (!tenant && !tenantId) {
      toast.error('Select a tenant first');
      return;
    }
    
    setProcessing(true);
    await onSave({ ...formData, amount: parseFloat(formData.amount) });
    setProcessing(false);
    setFormData({ amount: '', currency: 'USD', status: 'paid', paymentMethod: 'manual', description: '', invoiceUrl: '' });
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
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden relative border border-slate-200 dark:border-slate-800"
          >
            <div className="flex justify-between items-center p-8 border-b border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Quick Invoice</h2>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{tenant?.name || 'Manual Entry'}</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-3 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Grand Total</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">Rs </span>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      name="amount"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={handleChange}
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl text-sm font-bold dark:text-white outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Currency</label>
                  <div className="relative">
                    <select name="currency" value={formData.currency} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl text-sm font-bold dark:text-white outline-none transition-all appearance-none cursor-pointer">
                      <option value="USD">USD (Rs )</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="PKR">PKR (₨)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Payment Status</label>
                  <div className="relative">
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl text-sm font-bold dark:text-white outline-none transition-all appearance-none cursor-pointer">
                      {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Method</label>
                  <div className="relative">
                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl text-sm font-bold dark:text-white outline-none transition-all appearance-none cursor-pointer">
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Memo / Description</label>
                <input
                  type="text"
                  name="description"
                  placeholder="e.g. Manual payment for over-limit usage"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl text-sm font-medium dark:text-white outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Invoice Reference Link</label>
                <input
                  type="url"
                  name="invoiceUrl"
                  placeholder="https://cloud.sumbox.pro/invoices/..."
                  value={formData.invoiceUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl text-sm font-medium dark:text-white outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 px-6 py-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl font-bold text-sm transition-all active:scale-95"
                >
                  Dismiss
                </button>
                <button 
                  type="submit" 
                  disabled={processing} 
                  className="flex-[2] px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {processing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Check className="w-5 h-5" /> Generate Record</>
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
