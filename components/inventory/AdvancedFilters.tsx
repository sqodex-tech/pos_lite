"use client";

import React, { useState } from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/UI';

export interface FilterState {
    status: string;
    categoryId: string;
    unitId: string;
    priceRange: { min: string; max: string };
    stockAlert: boolean;
}

interface AdvancedFiltersProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    categories: Array<{ id: string; name: string; icon?: string }>;
    units: Array<{ id: string; name: string; symbol: string }>;
}

export default function AdvancedFilters({
    filters,
    onFiltersChange,
    categories,
    units
}: AdvancedFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleReset = () => {
        onFiltersChange({
            status: 'all',
            categoryId: '',
            unitId: '',
            priceRange: { min: '', max: '' },
            stockAlert: false
        });
    };

    const activeFilterCount = [
        filters.status !== 'all',
        filters.categoryId,
        filters.unitId,
        filters.priceRange.min || filters.priceRange.max,
        filters.stockAlert
    ].filter(Boolean).length;

    return (
        <div className="relative">
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className="gap-2 relative"
                variant="outline"
            >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {activeFilterCount}
                    </span>
                )}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden"
                        >
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-900 dark:text-white">Advanced Filters</h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                    >
                                        <X className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={filters.categoryId}
                                        onChange={(e) => onFiltersChange({ ...filters, categoryId: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.icon ? `${category.icon} ${category.name}` : category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Unit
                                    </label>
                                    <select
                                        value={filters.unitId}
                                        onChange={(e) => onFiltersChange({ ...filters, unitId: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                                    >
                                        <option value="">All Units</option>
                                        {units.map((unit) => (
                                            <option key={unit.id} value={unit.id}>
                                            {unit.name} ({unit.symbol})
                                        </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Price Range
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={filters.priceRange.min}
                                            onChange={(e) => onFiltersChange({
                                                ...filters,
                                                priceRange: { ...filters.priceRange, min: e.target.value }
                                            })}
                                            className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={filters.priceRange.max}
                                            onChange={(e) => onFiltersChange({
                                                ...filters,
                                                priceRange: { ...filters.priceRange, max: e.target.value }
                                            })}
                                            className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.stockAlert}
                                            onChange={(e) => onFiltersChange({ ...filters, stockAlert: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Show low stock items only
                                        </span>
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        onClick={handleReset}
                                        variant="outline"
                                        className="flex-1 gap-2"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Reset
                                    </Button>
                                    <Button
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1"
                                    >
                                        Apply Filters
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
