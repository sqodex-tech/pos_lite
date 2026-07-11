'use client';

import { useState, useEffect, FormEvent } from 'react';
import api from '@/services/admin/api';
import { X, CreditCard, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Tenant, Plan, Subscription } from '@/types';
import { ApiResponse } from '@/types/admin/api';

interface SubscriptionModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function SubscriptionModal({ tenant, isOpen, onClose, onRefresh }: SubscriptionModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !tenant) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [plansRes, subRes] = await Promise.all([
          api.get<ApiResponse<Plan[]>>('/tenants/plans?status=active'),
          api.get<ApiResponse<Subscription>>(`/subscriptions/tenant/${tenant._id}/active`).catch(() => ({ data: { data: null } }))
        ]);
        
        setPlans(plansRes.data.data || []);
        const currentSub = (subRes as any).data?.data;
        setActiveSub(currentSub);
        if (currentSub?.planId?._id) {
          setSelectedPlanId(currentSub.planId._id);
        } else if (plansRes.data.data?.length > 0) {
          setSelectedPlanId(plansRes.data.data[0]._id);
        }
      } catch (err) {
        toast.error('Failed to load subscription details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isOpen, tenant]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return toast.error('Please select a plan');

    setProcessing(true);
    const toastId = toast.loading(activeSub ? 'Changing plan...' : 'Activating subscription...');

    try {
      if (activeSub) {
        await api.post(`/subscriptions/${activeSub._id}/change-plan`, { newPlanId: selectedPlanId });
      } else {
        await api.post(`/subscriptions/tenant/${tenant?._id}/activate`, {
          planId: selectedPlanId,
          paymentMethod: 'bank_transfer',
          billingCycle: 'monthly'
        });
      }
      
      toast.success(activeSub ? 'Plan updated successfully' : 'Subscription activated', { id: toastId });
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Transaction failed', { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!activeSub) return;
    if (confirm(`Are you sure you want to cancel ${tenant?.name}'s subscription?`)) {
      const toastId = toast.loading('Canceling subscription...');
      try {
        await api.post(`/subscriptions/${activeSub._id}/cancel`, { immediately: true });
        toast.success('Subscription cancelled', { id: toastId });
        onRefresh();
        onClose();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Cancel failed', { id: toastId });
      }
    }
  };

  const handleApprove = async () => {
    if (!activeSub || activeSub.status !== 'pending') return;
    const toastId = toast.loading('Approving pending subscription...');
    try {
        await api.post(`/subscriptions/${activeSub._id}/approve`);
        toast.success('Subscription approved successfully', { id: toastId });
        onRefresh();
        onClose();
    } catch(err: any) {
        toast.error(err.response?.data?.message || 'Approval failed', { id: toastId });
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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-200 dark:border-slate-800"
          >
            <button onClick={onClose} className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-sm">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Subscription</h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{tenant?.name}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {activeSub ? (
                    <div className={`p-4 rounded-2xl border transition-all ${
                      activeSub.status === 'pending' 
                        ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20' 
                        : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20'
                    } flex justify-between items-center shadow-sm`}>
                      <div>
                        <h4 className={`text-sm font-bold flex items-center gap-2 ${activeSub.status === 'pending' ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                          {activeSub.status === 'pending' ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} 
                          {activeSub.status === 'pending' ? 'Pending Approval' : 'Active Plan'}
                        </h4>
                        <p className={`text-xs mt-1 font-medium ${activeSub.status === 'pending' ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                          Current: <span className="font-bold">{activeSub.planId?.name}</span>
                        </p>
                      </div>
                      {activeSub.status === 'pending' && (
                        <button 
                          type="button" 
                          onClick={handleApprove}
                          disabled={processing}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl flex items-start gap-3 shadow-sm">
                      <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-rose-800 dark:text-rose-400 text-sm font-bold">Inactive Account</h4>
                        <p className="text-rose-600 dark:text-rose-500 text-xs mt-1 font-medium">Activate a plan to enable platform features.</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 ml-1">Select Target Plan</label>
                    <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-1 customize-scrollbar">
                      {plans.map(plan => (
                        <label 
                          key={plan._id} 
                          className={`relative flex cursor-pointer rounded-2xl border p-4 transition-all ${
                            selectedPlanId === plan._id 
                              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 ring-1 ring-indigo-600 shadow-md' 
                              : 'border-slate-200 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-800/50'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="plan" 
                            value={plan._id} 
                            checked={selectedPlanId === plan._id}
                            onChange={(e) => setSelectedPlanId(e.target.value)}
                            className="sr-only" 
                          />
                          <span className="flex flex-1">
                            <span className="flex flex-col">
                              <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">{plan.name}</span>
                              <span className="mt-1 flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">Rs {plan.price} <span className="mx-1">•</span> {plan.billingCycle}ly
                              </span>
                            </span>
                          </span>
                          <CheckCircle2 className={`h-5 w-5 ${selectedPlanId === plan._id ? 'text-indigo-600 dark:text-indigo-400' : 'invisible'}`} />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-200 font-display"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={processing}
                      className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 active:scale-95 font-display"
                    >
                      {processing ? 'Saving...' : (activeSub ? 'Change Plan' : 'Activate Account')}
                    </button>
                  </div>

                  {activeSub && (
                    <div className="pt-2 text-center">
                      <button 
                        type="button" 
                        onClick={handleCancel}
                        className="text-[11px] uppercase tracking-wider font-bold text-rose-500 hover:text-rose-700 transition-colors p-2"
                      >
                        Terminate Subscription Immediately
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
