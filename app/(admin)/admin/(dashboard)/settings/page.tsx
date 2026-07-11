'use client';

import { motion } from 'framer-motion';
import { Settings, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Platform Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Global configuration and system preferences.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 text-center">
        <Settings className="w-16 h-16 mx-auto text-indigo-200 dark:text-indigo-900 mb-6" />
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Settings Hub Under Construction</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          The global configuration module is currently being built. Soon, you'll be able to manage payment gateways, global branding, and system-wide security policies here.
        </p>
      </div>
    </motion.div>
  );
}
