'use client';

import { useState } from 'react';
import { useTenants } from '@/hooks/admin/useTenants';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table';
import { Search, Building2, ArrowUpDown, CreditCard, CheckCircle2, AlertCircle, RefreshCw, FileText, Ghost } from 'lucide-react';
import SubscriptionModal from '@/components/admin/SubscriptionModal';
import InvoiceModal from '@/components/admin/InvoiceModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Tenant } from '@/types';
import toast from 'react-hot-toast';


export default function TenantsPage() {
  const { tenants, loading, error, updateTenantStatus, fetchTenants, createBillingRecord, impersonateTenant } = useTenants();
  const [sorting, setSorting] = useState<any>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const res = await updateTenantStatus(id, newStatus as any);
    if (res.success) {
      toast.success(`Tenant ${newStatus === 'active' ? 'resumed' : 'suspended'}`);
    } else {
      toast.error(res.message);
    }
  };

  const handleImpersonate = async (tenantId: string) => {
    const toastId = toast.loading('Initiating Magic Login...');
    const res = await impersonateTenant(tenantId);
    if (res.success) {
      toast.success('Impersonation token generated', { id: toastId });
      // Redirect to shopkeeper dashboard with magic token
      const magicUrl = `${window.location.origin}/login?magicToken=${res.token}`;
      window.open(magicUrl, '_blank');
    } else {
      toast.error(res.message, { id: toastId });
    }
  };

  const openSubscriptionModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsSubModalOpen(true);
  };

  const openInvoiceModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsInvoiceModalOpen(true);
  };

  const handleSaveInvoice = async (data: any) => {
    if (!selectedTenant) return;
    const res = await createBillingRecord(selectedTenant.id || selectedTenant._id, data);
    if (res.success) {
      toast.success('Manual billing record created');
      setIsInvoiceModalOpen(false);
    } else {
      toast.error(res.message);
    }
  };

  const columns: ColumnDef<Tenant>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 hover:text-indigo-600 transition-colors font-semibold text-xs text-slate-500 uppercase tracking-wider"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Entity Name
          <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-indigo-600 border border-slate-200 dark:border-slate-700">
            {row.original.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 dark:text-slate-200">{row.original.name}</span>
            <span className="text-xs font-medium text-slate-500">{row.original.email}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'planId.name',
      id: 'plan',
      header: () => <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Current Plan</span>,
      cell: ({ row }) => {
        const planName = (row.original as any).planId?.name;
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${planName ? 'bg-indigo-500' : 'bg-slate-300'}`} />
            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {planName || 'Unsubscribed'}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: () => <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Status</span>,
      cell: ({ row }) => {
        const isActive = row.original.status === 'active';
        return (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold ${
            isActive 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:text-emerald-400' 
              : 'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/30 dark:text-rose-400'
          }`}>
            {isActive ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {row.original.status}
          </div>
        );
      }
    },
    {
      accessorKey: 'createdAt',
      header: () => <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Member Since</span>,
      cell: ({ row }) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          {new Date(row.original.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      )
    },
    {
      id: 'actions',
      header: () => <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider text-right block">Actions</span>,
      cell: ({ row }) => {
        const tenant = row.original;
        const isActive = tenant.status === 'active';
        return (
          <div className="flex items-center justify-end gap-2 text-right">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleImpersonate(tenant.id || tenant._id)}
              className="p-2 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-all"
              title="Magic Login (Impersonate)"
            >
              <Ghost className="w-4.5 h-4.5" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openInvoiceModal(tenant)}
              className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
              title="Quick Invoice"
            >
              <FileText className="w-4.5 h-4.5" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openSubscriptionModal(tenant)}
              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
              title="Manage Subscription"
            >
              <CreditCard className="w-4.5 h-4.5" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleStatusToggle(tenant.id || tenant._id, tenant.status)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isActive 
                  ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20' 
                  : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
              }`}
            >
              {isActive ? 'Suspend' : 'Resume'}
            </motion.button>
          </div>
        );
      }
    }
  ];

  const table = useReactTable({
    data: tenants,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  const filteredRows = table.getRowModel().rows.filter(row => {
    if (!globalFilter) return true;
    const filterLower = globalFilter.toLowerCase();
    return (row.original.name?.toLowerCase().includes(filterLower) || row.original.email?.toLowerCase().includes(filterLower));
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Tenants</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Control platform access and subscriptions.</p>
        </div>
        <div className="flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fetchTenants()}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            Add New Tenant
          </motion.button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/30 dark:bg-transparent">
          <div className="relative w-full md:w-96 group">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-3 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border-none rounded-2xl text-sm font-medium dark:text-white shadow-inner focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
          <div className="text-xs font-semibold text-slate-400">
            Total Entities: {filteredRows.length}
          </div>
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
                {filteredRows.map((row) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={row.id} 
                    className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/5 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-8 py-5 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full">
                        <Building2 className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Results Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SubscriptionModal 
        isOpen={isSubModalOpen} 
        onClose={() => setIsSubModalOpen(false)} 
        tenant={selectedTenant}
        onRefresh={fetchTenants}
      />

      <InvoiceModal 
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        tenant={selectedTenant}
        onSave={handleSaveInvoice}
      />
    </motion.div>
  );
}
