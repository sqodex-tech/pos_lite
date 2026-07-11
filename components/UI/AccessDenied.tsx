import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

interface AccessDeniedProps {
    message?: string;
}

export function AccessDenied({ message = "You do not have permission to view this content" }: AccessDeniedProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[50vh]">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6"
            >
                <ShieldAlert className="w-10 h-10 text-rose-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-500 max-w-sm">{message}</p>
        </div>
    );
}
