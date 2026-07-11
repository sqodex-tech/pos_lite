'use client';

import { useState } from 'react';
import { useSubscriptions } from '@/hooks/admin/useSubscriptions';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table';
import { 
  ArrowUpDown, Search, CheckCircle2, XCircle, Clock, AlertCircle, 
  Trash2, RotateCw, CheckCircle, Filter, Banknote, Users, TrendingUp 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Subscription } from '@/types';

export default function SubscriptionsPage() {
  const { 
    subscriptions, loading, error, stats, 
    fetchSubscriptions, approveSubscription, cancelSubscription, renewSubscription 
  } = useSubscriptions();
  
  const [sorting, setSorting] = useState<any>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAction = async (action: (id: string) => Promise<{success: boolean, message?: string}>, id: string, label: string) => {
    const toastId = toast.loading(`${label} in progress...`);
    const res = await action(id);
    if (res.success) {
      toast.success(`${label} completed`, { id: toastId });
    } else {
      toast.error(res.message || `${label} failed`, { id: toastId });
    }
  };

  const columns: ColumnDef<Subscription>[] = [
    {
      accessorKey: 'tenantId.name',
      id: 'tenant',
      header: () => <span className="font-bold uppercase tracking-wider text-[10px]">Subscriber</span>,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-white">{row.original.tenantId?.name || 'Unknown'}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{row.original.tenantId?.email}</span>
        </div>
      )
    },
    {
      accessorKey: 'planId.name',
      id: 'plan',
      header: () => <span className="font-bold uppercase tracking-wider text-[10px]">Selected Tier</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-indigo-500" />
           <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
            {row.original.planId?.name}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: () => <span className="font-bold uppercase tracking-wider text-[10px]">Lifecycle</span>,
      cell: ({ row }) => {
        const s = row.original.status;
        let icon = <Clock className="w-3 h-3" />;
        let cl = 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30';
        
        if (s === 'active') {
          icon = <CheckCircle2 className="w-3 h-3" />;
          cl = 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:text-emerald-400';
        } else if (s === 'cancelled' || s === 'expired') {
          icon = <XCircle className="w-3 h-3" />;
          cl = 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/30 dark:text-rose-400';
        }

        return (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${cl}`}>
            {icon} {s}
          </div>
        );
      }
    },
    {
      accessorKey: 'nextBillingDate',
      header: () => <span className="font-bold uppercase tracking-wider text-[10px]">Next Invoice</span>,
      cell: ({ row }) => (
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {(row.original as any).nextBillingDate ? new Date((row.original as any).nextBillingDate).toLocaleDateString() : 'Manual'}
        </span>
      )
    },
    {
      id: 'actions',
      header: () => <span className="font-bold uppercase tracking-wider text-[10px] text-right block">Ops</span>,
      cell: ({ row }) => {
        const s = row.original.status;
        const id = row.original.id || row.original._id;
        return (
          <div className="flex justify-end gap-2">
            {s === 'pending' && (
              <motion.button 
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => handleAction(approveSubscription, id, 'Approval')}
                className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl"
                title="Approve"
              >
                <CheckCircle className="w-4.5 h-4.5" />
              </motion.button>
            )}
            {s === 'active' && (
              <motion.button 
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => handleAction(cancelSubscription, id, 'Deactivation')}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl"
                title="Cancel"
              >
                <XCircle className="w-4.5 h-4.5" />
              </motion.button>
            )}
            {(s === 'expired' || s === 'cancelled') && (
              <motion.button 
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => handleAction(renewSubscription, id, 'Renewal')}
                className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl"
                title="Renew"
              >
                <RotateCw className="w-4.5 h-4.5" />
              </motion.button>
            )}
          </div>
        );
      }
    }
  ];

  const table = useReactTable({
    data: subscriptions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  const filteredRows = table.getRowModel().rows.filter(row => {
    const sMatch = statusFilter === 'all' || row.original.status === statusFilter;
    const tMatch = !searchTerm || 
      row.original.tenantId?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      row.original.tenantId?.email.toLowerCase().includes(searchTerm.toLowerCase());
    return sMatch && tMatch;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px] animate-pulse">Synchronizing Global Ledger...</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Subscriptions</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Lifecycle oversight for all platform accounts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Pipeline', value: stats?.active || 0, icon: CheckCircle2, color: 'emerald' },
          { label: 'Pending Review', value: stats?.pending || 0, icon: Clock, color: 'amber' },
          { label: 'Churn Rate', value: '4.2%', icon: TrendingUp, color: 'rose' },
          { label: 'Est. MRR', value: `Rs ${(stats?.totalMonthlyRevenue || 0).toLocaleString()}`, icon: Banknote, color: 'indigo' }
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4"
          >
            <div className={`w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-indigo-500`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/30 dark:bg-transparent">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-80 group">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
              <input type="text" placeholder="Search accounts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border-none rounded-2xl text-sm font-medium dark:text-white shadow-inner focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'active', 'cancelled'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-800'
                }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Found: {filteredRows.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-slate-50/50 dark:bg-slate-800/20">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="text-left px-8 py-6">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              <AnimatePresence mode="popLayout">
                {filteredRows.map((row) => (
                  <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-indigo-900/5 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-8 py-5 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <Filter className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No matches found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
