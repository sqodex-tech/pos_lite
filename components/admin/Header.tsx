'use client';

import { Bell, Search, Sun, Moon, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationDropdown } from '@/components/shared/NotificationDropdown';

import { useAdminUI } from '@/hooks/admin/useAdminUI';

export default function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const toggleSidebar = useAdminUI(state => state.toggleSidebar);

  useEffect(() => setMounted(true), []);

  if (pathname === '/admin/login') return null;

  return (
    <motion.header 
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 px-4 md:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-10 w-full shrink-0 transition-colors"
    >
      <div className="flex items-center gap-4 w-full max-w-md">
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative w-full hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            placeholder="Search platform..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-xl text-sm focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:text-slate-400 dark:text-slate-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {mounted && theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>
        
        <NotificationDropdown />
        
        <div className="flex items-center gap-3 pl-3 sm:pl-5 border-l border-slate-200 dark:border-slate-800">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">Super Admin</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight font-medium">admin@sumbox.com</span>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-indigo-500/20 shadow-lg cursor-pointer"
          >
            SA
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
