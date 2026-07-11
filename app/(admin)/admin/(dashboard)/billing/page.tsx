'use client';

import { useState } from 'react';
import { useBilling } from '@/hooks/admin/useBilling';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, RefreshCw, AlertCircle, FileText, CheckCircle2, XCircle, Clock, Activity, BarChart as BarChartIcon, Plus, Download, CreditCard } from 'lucide-react';                      
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import toast from 'react-hot-toast';
import InvoiceModal from '@/components/admin/InvoiceModal';
import api from '@/services/admin/api';
import { motion, AnimatePresence } from 'framer-motion';
import { BillingHistory, Tenant } from '@/types';

export default function BillingPage() {
  const { data, loading, error, processRecurring, fetchDashboard } = useBilling();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceTenant, setInvoiceTenant] = useState<Tenant | null>(null);

  const handleCreateInvoice = async (formData: any) => {
    if (!invoiceTenant) return;
    const toastId = toast.loading('Creating invoice record...');
    try {
      await api.post(`/tenants/${invoiceTenant.id || invoiceTenant._id}/billing-history`, formData);
      toast.success('Invoice created successfully', { id: toastId });
      setIsInvoiceModalOpen(false);
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create invoice', { id: toastId });
    }
  };

  const handleProcessRecurring = async () => {
    if (confirm('Are you sure you want to trigger the recurring billing processor now? This will charge all due subscriptions.')) {
      setIsProcessing(true);
      const toastId = toast.loading('Processing recurring payments...');
      const res = await processRecurring();
      if (res.success) {
        toast.success('Recurring billing processed successfully!', { id: toastId });
        fetchDashboard();
      } else {
        toast.error(`Processing failed: ${res.message}`, { id: toastId });
      }
      setIsProcessing(false);
    }
  };

  const recentHistory = data?.recentHistory || [];
  const paymentTrendsData = (data?.paymentTrends?.length || 0) > 0 ? data?.paymentTrends : [
    { date: 'Mon', amount: 450, count: 2 },
    { date: 'Tue', amount: 800, count: 5 },
    { date: 'Wed', amount: 600, count: 4 },
    { date: 'Thu', amount: 1200, count: 8 },
    { date: 'Fri', amount: 950, count: 6 },
    { date: 'Sat', amount: 1400, count: 9 },
  ];

  const columns: ColumnDef<BillingHistory>[] = [
    {
      accessorKey: 'billingDate',
      header: () => <span className="font-bold uppercase tracking-wider text-[10px]">Date</span>,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {new Date(row.getValue('billingDate')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            {new Date(row.getValue('billingDate')).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'tenantId.name',
      id: 'tenant',
      header: () => <span className="font-bold uppercase tracking-wider text-[10px]">Client</span>,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 dark:text-slate-200">{row.original.tenantId?.name || 'Unknown'}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">{row.original.tenantId?.email}</span>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-indigo-600 transition-colors font-bold uppercase tracking-wider text-[10px]"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Value
          <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="font-black text-slate-900 dark:text-white">Rs {row.getValue<number>('amount').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: () => <span className="font-bold uppercase tracking-wider text-[10px]">Status</span>,
      cell: ({ row }) => {
        const status = row.getValue<string>('status');
        let icon = <Clock className="w-3 h-3" />;
        let classes = 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800/20 dark:text-slate-400 dark:border-slate-800';
        
        if (status === 'paid') {
          icon = <CheckCircle2 className="w-3 h-3" />;
          classes = 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30';
        } else if (status === 'failed') {
          icon = <XCircle className="w-3 h-3" />;
          classes = 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30';
        }

        return (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${classes}`}>
            {icon}
            {status}
          </div>
        );
      }
    },
    {
      id: 'invoice',
      header: () => <span className="font-bold uppercase tracking-wider text-[10px] text-right block">Document</span>,
      cell: ({ row }) => {
        const url = row.original.invoiceUrl;
        const tenant = row.original.tenantId;
        return (
          <div className="flex justify-end">
            {url ? (
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-indigo-600 hover:text-white"
              >
                <Download className="w-3 h-3" /> PDF
              </motion.a>
            ) : tenant ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setInvoiceTenant(tenant); setIsInvoiceModalOpen(true); }}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <Plus className="w-3 h-3" /> Gen
              </motion.button>
            ) : null}
          </div>
        );
      }
    }
  ];

  const table = useReactTable({
    data: recentHistory,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-slate-500 font-medium animate-pulse">Analyzing financial records...</p>
    </div>
  );

  if (error) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center text-rose-500 bg-rose-50 dark:bg-rose-900/10 rounded-[2rem] border border-rose-100 dark:border-rose-900/20">
      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-rose-400" />
      <h3 className="text-xl font-bold text-rose-800 dark:text-rose-400">Sync Failure</h3>
      <p className="mt-2 text-rose-600 dark:text-rose-500">{error}</p>
    </motion.div>
  );

  const statsData = data?.stats || { mrr: 0, activeSubscriptions: 0 };
  const successfulCount = data?.paymentTrends?.reduce((sum, item) => sum + item.count, 0) || 0;

  const statsList = [
    { label: 'Platform MRR', value: `Rs ${(statsData.mrr ?? 0).toLocaleString()}`, icon: Activity, color: 'emerald' },
    { label: 'Active Pipeline', value: (statsData.activeSubscriptions ?? 0).toLocaleString(), icon: CheckCircle2, color: 'indigo' },
    { label: successfulCount === 0 ? 'Monthly Volume' : '30D Collections', value: successfulCount, icon: BarChartIcon, color: 'amber' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Billing Center</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Revenue streams and collection performance.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleProcessRecurring}
          disabled={isProcessing}
          className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
          {isProcessing ? 'Processing Batch...' : 'Execute Recurring Billing'}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsList.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 group"
          >
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-8">Collection trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={paymentTrendsData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" strokeOpacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} tickFormatter={(value) => `Rs ${value}`} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '16px', color: '#F8FAFC' }}
                  itemStyle={{ color: '#10B981', fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10B981" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-8">Transaction Density</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentTrendsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" strokeOpacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#F1F5F9', opacity: 0.1 }}
                  contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '16px', color: '#F8FAFC' }}
                  itemStyle={{ color: '#6366F1', fontWeight: 700 }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[8, 8, 8, 8]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/30 dark:bg-transparent">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Ledger History</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setInvoiceTenant(null); setIsInvoiceModalOpen(true); }}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Manual Entry
          </motion.button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-slate-50/50 dark:bg-slate-800/20">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="text-left px-8 py-5">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              <AnimatePresence mode="popLayout">
                {recentHistory.map((row) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={(row as any).id || (row as any)._id} 
                    className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/5 transition-colors"
                  >
                    {/* Manual mapping because table instance might mismatch types slightly during transition */}
                    <td className="px-8 py-5 whitespace-nowrap">
                       <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {new Date(row.billingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(row.billingDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{row.tenantId?.name || 'Unknown'}</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">{row.tenantId?.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="font-black text-slate-900 dark:text-white">Rs {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                         row.status === 'paid' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400' 
                          : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400'
                      }`}>
                        {row.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {row.status}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right">
                       <div className="flex justify-end gap-2">
                        {row.invoiceUrl ? (
                          <motion.a
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            href={row.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-indigo-600 hover:text-white"
                          >
                            <Download className="w-3 h-3" /> PDF
                          </motion.a>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setInvoiceTenant(row.tenantId); setIsInvoiceModalOpen(true); }}
                            className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-[10px] font-black uppercase tracking-widest"
                          >
                            <Plus className="w-3 h-3" /> Gen
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {recentHistory.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full">
                        <CreditCard className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        tenant={invoiceTenant}
        onSave={handleCreateInvoice}
      />
    </motion.div>
  );
}
