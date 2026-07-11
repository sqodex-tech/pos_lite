'use client';

import { useState, useMemo } from 'react';
import { useUsers } from '@/hooks/admin/useUsers';
import { useTenants } from '@/hooks/admin/useTenants';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table';
import { ArrowUpDown, Search, UserMinus, ShieldAlert, User as UserIcon, Building2, ShieldCheck, Mail, Plus, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/types';
import UserModal from '@/components/admin/UserModal';

export default function UsersPage() {
  const { users, loading, error, deleteUser, createUser, updateUser } = useUsers();
  const { tenants } = useTenants();
  const [sorting, setSorting] = useState<any>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'email' | 'google'>('email');

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      const toastId = toast.loading('Removing user from platform...');
      const res = await deleteUser(id);
      if (res.success) {
        toast.success(`User ${name} removed`, { id: toastId });
      } else {
        toast.error(`Removal failed: ${res.message}`, { id: toastId });
      }
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleSave = async (userData: any) => {
    if (selectedUser) {
      const res = await updateUser(selectedUser.id || selectedUser._id, userData);
      if (res.success) {
        toast.success(`User updated successfully`);
      }
      return res;
    } else {
      const res = await createUser(userData);
      if (res.success) {
        toast.success(`User registered successfully`);
      }
      return res;
    }
  };

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 hover:text-indigo-600 transition-colors font-bold uppercase tracking-wider text-[10px]"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Identity
          <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm">
            {row.original.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 dark:text-white">{row.original.name}</span>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
              <Mail className="w-3 h-3" />
              {row.original.email}
            </div>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'role',
      header: () => <span className="font-bold uppercase tracking-wider text-[10px]">Permission Level</span>,
      cell: ({ row }) => {
        const role = row.getValue<string>('role');
        const isSuper = role === 'SUPER_ADMIN';
        return (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
            isSuper 
              ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/30' 
              : 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-900/30'
          }`}>
            {isSuper ? <ShieldCheck className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
            {role.replace('_', ' ')}
          </div>
        );
      },
    },
    {
      accessorKey: 'tenantId.name',
      id: 'tenant',
      header: () => <span className="font-bold uppercase tracking-wider text-[10px]">Affiliation</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.tenantId ? (
            <>
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
                {typeof row.original.tenantId === 'string' ? row.original.tenantId : (row.original.tenantId as any).name}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Internal / System</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="font-bold uppercase tracking-wider text-[10px] text-right block">Management</span>,
      cell: ({ row }) => {
        const isSuperAdmin = row.original.role === 'SUPER_ADMIN';
        if (isSuperAdmin) return null;
        return (
          <div className="flex justify-end gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleEdit(row.original)}
              className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
              title="Edit User"
            >
              <Edit2 className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleDelete(row.original.id || row.original._id, row.original.name)}
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
              title="Delete User"
            >
              <UserMinus className="w-4 h-4" />
            </motion.button>
          </div>
        );
      },
    },
  ], []);

  // Filter users based on tab before passing to table
  const tabFilteredUsers = useMemo(() => {
    return users.filter(user => {
      // We assume users with firebaseUid are Google/Firebase registered, others are email
      const isGoogle = !!(user as any).firebaseUid;
      if (activeTab === 'google') return isGoogle;
      return !isGoogle;
    });
  }, [users, activeTab]);

  const table = useReactTable({
    data: tabFilteredUsers,
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-slate-500 font-medium animate-pulse">Retrieving global user directory...</p>
    </div>
  );

  if (error) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center text-rose-500 bg-rose-50 dark:bg-rose-950/10 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/20">
      <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-rose-400" />
      <h3 className="text-xl font-bold text-rose-800 dark:text-rose-400">Restricted Access</h3>
      <p className="mt-2 text-rose-600 dark:text-rose-500">{error}</p>
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Access Control</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Global membership and role governance across organizations.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreate}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-700/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Global User
        </motion.button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Tabs Section */}
        <div className="px-8 pt-6 pb-0 border-b border-slate-100 dark:border-slate-800 flex items-center gap-6">
          <button
            onClick={() => setActiveTab('email')}
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-colors relative ${
              activeTab === 'email' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Email Registration
            {activeTab === 'email' && (
              <motion.div layoutId="userTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-colors relative ${
              activeTab === 'google' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Google Registration
            {activeTab === 'google' && (
              <motion.div layoutId="userTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
            )}
          </button>
        </div>

        <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/30 dark:bg-transparent">
          <div className="relative w-full md:w-96 group">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-3 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter by name or email address..." 
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border-none rounded-2xl text-sm font-medium dark:text-white shadow-inner focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
              {tabFilteredUsers.length} {activeTab === 'google' ? 'Google' : 'Email'} Users
            </div>
            <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              {filteredRows.length} Matches Found
            </div>
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
              <AnimatePresence>
                {filteredRows.map((row) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={row.id} 
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
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
                      <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-inner">
                        <UserIcon className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Directory is empty</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        tenants={tenants}
        onSave={handleSave}
      />
    </motion.div>
  );
}
