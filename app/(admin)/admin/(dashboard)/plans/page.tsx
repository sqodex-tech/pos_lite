'use client';

import { useState } from 'react';
import { usePlans } from '@/hooks/admin/usePlans';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Search, Edit, Trash2, ShieldAlert, Plus, CheckCircle2, Zap, Layers, Globe, MousePointer2 } from 'lucide-react';
import PlanModal from '@/components/admin/PlanModal';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Plan } from '@/types';

export default function PlansPage() {
  const { plans, loading, error, createPlan, updatePlan, deletePlan } = usePlans();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const handleOpenModal = (plan: Plan | null = null) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleSavePlan = async (formData: Partial<Plan>) => {
    const toastId = toast.loading(selectedPlan ? 'Updating plan...' : 'Creating new plan...');
    let res;
    if (selectedPlan) {
      res = await updatePlan(selectedPlan.id || selectedPlan._id, formData);
    } else {
      res = await createPlan(formData as any);
    }
    
    if (res.success) {
      toast.success(selectedPlan ? 'Plan updated' : 'Plan created', { id: toastId });
      setIsModalOpen(false);
    } else {
      toast.error(res.message, { id: toastId });
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (confirm(`Are you sure you want to delete ${plan.name}? This operation is restricted if tenants are active on this plan.`)) {
      const toastId = toast.loading('Deleting...');
      const res = await deletePlan(plan.id || plan._id);
      if (res.success) {
        toast.success(`Plan ${plan.name} removed`, { id: toastId });
      } else {
        toast.error(`Operation failed: ${res.message}`, { id: toastId });
      }
    }
  };

  const columns: ColumnDef<Plan>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 hover:text-indigo-600 transition-colors font-semibold text-xs text-slate-500 uppercase tracking-wider"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Plan Name
          <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            <Zap className="w-5 h-5 text-indigo-500 group-hover:text-white transition-colors" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white">{row.original.name}</span>
              {row.original.isTrialPlan && (
                <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-indigo-600/20">Trial</span>
              )}
            </div>
            <span className="text-xs font-medium text-slate-500 max-w-[250px] truncate">{row.original.description}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'price',
      header: () => <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Pricing</span>,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-white">Rs {row.original.price.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-slate-500 capitalize">{row.original.billingCycle}ly</span>
        </div>
      )
    },
    {
      id: 'limits',
      header: () => <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Features</span>,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-500 transition-all group-hover:border-indigo-500/20">
            <Globe className="w-3 h-3" /> {row.original.maxBranches} Stores
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-500">
            <MousePointer2 className="w-3 h-3" /> {row.original.maxUsers} Users
          </div>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: () => <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Status</span>,
      cell: ({ row }) => {
        const isActive = row.original.status === 'active';
        return (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold capitalize border ${
            isActive 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30' 
              : 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800/20 dark:border-slate-800'
          }`}>
            {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
            {row.original.status}
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: () => <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider text-right block">Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleOpenModal(row.original)}
            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
            title="Edit Plan"
          >
            <Edit className="w-4.5 h-4.5" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleDelete(row.original)}
            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
            title="Purge Tier"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </motion.button>
        </div>
      )
    }
  ];

  const table = useReactTable({
    data: plans,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  const filteredRows = table.getRowModel().rows.filter(row => {
    if (!globalFilter) return true;
    return row.original.name?.toLowerCase().includes(globalFilter.toLowerCase());
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-slate-500 font-medium animate-pulse">Loading plans...</p>
    </div>
  );

  if (error) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center text-rose-500 bg-rose-50 dark:bg-rose-900/10 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/20">
      <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-rose-400" />
      <h3 className="text-xl font-bold text-rose-800 dark:text-rose-400">Error</h3>
      <p className="mt-2 text-rose-600 dark:text-rose-500">{error}</p>
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Plans & Pricing</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage platform subscription plans.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-indigo-600/20"
        >
          <Plus className="w-5 h-5" />
          Add New Plan
        </motion.button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/30 dark:bg-transparent">
          <div className="relative w-full md:w-96 group">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-3 group-focus-within:text-indigo-500 transition-all" />
            <input 
              type="text" 
              placeholder="Search plans..." 
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border-none rounded-2xl text-sm font-medium dark:text-white shadow-inner focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
          <div className="text-xs font-semibold text-slate-400">
            Total Plans: {filteredRows.length}
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
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={row.id} 
                    className="group hover:bg-slate-50/30 dark:hover:bg-indigo-900/5 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-8 py-6 whitespace-nowrap">
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
                      <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-full">
                        <Zap className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No definitions found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PlanModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        plan={selectedPlan}
        onSave={handleSavePlan}
      />
    </motion.div>
  );
}
