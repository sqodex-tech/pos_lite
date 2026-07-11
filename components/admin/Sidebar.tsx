'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Building2, CreditCard, Activity, Settings, LogOut, ReceiptText } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Tenants', href: '/admin/tenants', icon: Building2 },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: ReceiptText },
  { name: 'Billing', href: '/admin/billing', icon: CreditCard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Plans', href: '/admin/plans', icon: Activity },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

import { useAdminUI } from '@/hooks/admin/useAdminUI';
import { X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function Sidebar() {
  const pathname = usePathname();
  const { isMobileSidebarOpen, closeSidebar } = useAdminUI();

  if (pathname === '/admin/login') return null;

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between h-16 px-6 md:justify-center border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-widest">SUMBOX<span className="text-indigo-600 dark:text-indigo-500">PRO</span></h1>
        <button onClick={closeSidebar} className="md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">Super Admin</div>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
            >
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm group ${
                  isActive 
                    ? 'bg-indigo-600/10 text-indigo-700 dark:text-indigo-400' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`} />
                </div>
                {item.name}
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-500"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <motion.button 
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors group rounded-xl"
          onClick={() => {
            localStorage.removeItem('sumbox_admin_token');
            localStorage.removeItem('sumbox_admin_refresh');
            localStorage.removeItem('sumbox_admin_user');
            window.location.href = '/admin/login';
          }}
        >
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/30">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">Logout</span>
        </motion.button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden md:flex flex-col w-64 h-screen bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 shrink-0 transition-colors"
      >
        <SidebarContent />
      </motion.div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col md:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
