"use client";

import React, { useState } from 'react';
import { Download, Upload, Trash2, Archive, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '@/components/UI';

interface BulkActionsProps {
    selectedIds: string[];
    onClearSelection: () => void;
    onDelete: (ids: string[]) => Promise<void>;
    onExport: (ids: string[]) => void;
    onStatusChange: (ids: string[], status: 'active' | 'inactive') => Promise<void>;
}

export default function BulkActions({
    selectedIds,
    onClearSelection,
    onDelete,
    onExport,
    onStatusChange
}: BulkActionsProps) {
    const [loading, setLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    if (selectedIds.length === 0) return null;

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) return;
        
        setLoading(true);
        try {
            await onDelete(selectedIds);
            toast.success(`${selectedIds.length} items deleted successfully`);
            onClearSelection();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete items');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (status: 'active' | 'inactive') => {
        setLoading(true);
        try {
            await onStatusChange(selectedIds, status);
            toast.success(`${selectedIds.length} items updated successfully`);
            onClearSelection();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update items');
        } finally {
            setLoading(false);
            setShowMenu(false);
        }
    };

    const handleExport = () => {
        onExport(selectedIds);
        toast.success(`Exporting ${selectedIds.length} items`);
        setShowMenu(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
        >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-xl">
                    <CheckSquare className="w-5 h-5 text-primary" />
                    <span className="font-bold text-primary">
                        {selectedIds.length} selected
                    </span>
                </div>

                <div className="h-8 w-px bg-slate-200" />

                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleExport}
                        disabled={loading}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                        size="sm"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </Button>

                    <div className="relative">
                        <Button
                            onClick={() => setShowMenu(!showMenu)}
                            disabled={loading}
                            className="gap-2 bg-blue-600 hover:bg-blue-700"
                            size="sm"
                        >
                            <Archive className="w-4 h-4" />
                            Actions
                        </Button>

                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-full mb-2 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[180px]"
                                >
                                    <button
                                        onClick={() => handleStatusChange('active')}
                                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        Set Active
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange('inactive')}
                                        className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-slate-400" />
                                        Set Inactive
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <Button
                        onClick={handleBulkDelete}
                        disabled={loading}
                        className="gap-2 bg-rose-600 hover:bg-rose-700"
                        size="sm"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </Button>
                </div>

                <div className="h-8 w-px bg-slate-200" />

                <button
                    onClick={onClearSelection}
                    className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3"
                >
                    Clear
                </button>
            </div>
        </motion.div>
    );
}
