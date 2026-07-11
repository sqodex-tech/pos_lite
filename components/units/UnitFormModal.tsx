"use client";

import React, { useState } from 'react';
import { X, Ruler, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { unitsApi, Unit } from '@/lib/api/units';
import { Button, Input } from '@/components/UI';

interface UnitFormModalProps {
    unit: Unit | null;
    units: Unit[];
    onClose: () => void;
    onSuccess: () => void;
}

const UNIT_CATEGORIES = [
    { value: 'weight', label: 'Weight', icon: '⚖️' },
    { value: 'count', label: 'Count', icon: '🔢' },
    { value: 'volume', label: 'Volume', icon: '🧪' },
    { value: 'length', label: 'Length', icon: '📏' },
    { value: 'area', label: 'Area', icon: '📐' },
    { value: 'time', label: 'Time', icon: '⏱️' },
];

export default function UnitFormModal({
    unit,
    units,
    onClose,
    onSuccess
}: UnitFormModalProps) {
    const [formData, setFormData] = useState({
        name: unit?.name || '',
        symbol: unit?.symbol || '',
        description: unit?.description || '',
        category: unit?.category || 'count',
        baseUnit: unit?.baseUnit || '',
        conversionFactor: unit?.conversionFactor?.toString() || '1',
        precision: unit?.precision?.toString() || '2',
        status: unit?.status || 'active',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const baseUnits = units.filter(u =>
        u.category === formData.category && !u.baseUnit && u._id !== unit?._id
    );

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Unit name is required';
        }

        if (!formData.symbol.trim()) {
            newErrors.symbol = 'Symbol is required';
        }

        if (formData.symbol.trim().length > 10) {
            newErrors.symbol = 'Symbol must be 10 characters or less';
        }

        const conversionFactor = parseFloat(formData.conversionFactor);
        if (isNaN(conversionFactor) || conversionFactor <= 0) {
            newErrors.conversionFactor = 'Valid conversion factor is required';
        }

        const precision = parseInt(formData.precision);
        if (isNaN(precision) || precision < 0 || precision > 10) {
            newErrors.precision = 'Precision must be between 0 and 10';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the form errors');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name.trim(),
                symbol: formData.symbol.trim(),
                description: formData.description.trim() || undefined,
                category: formData.category as any,
                baseUnit: formData.baseUnit || null,
                conversionFactor: parseFloat(formData.conversionFactor),
                precision: parseInt(formData.precision),
                status: formData.status as 'active' | 'inactive',
            };

            const storeId = localStorage.getItem('storeId') || '';

            if (unit) {
                await unitsApi.update(unit._id, storeId, payload);
                toast.success('Unit updated successfully');
            } else {
                await unitsApi.create(storeId, payload);
                toast.success('Unit created successfully');
            }
            onSuccess();
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.message ||
                error.response?.data?.message ||
                'Operation failed';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-2xl w-full my-8"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <Ruler className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {unit ? 'Edit Unit' : 'Add New Unit'}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {unit ? 'Update unit of measure' : 'Create a new unit of measure'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Unit Name"
                                icon={<Ruler className="w-5 h-5" />}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Kilogram"
                                error={errors.name}
                                required
                            />
                            <Input
                                label="Symbol"
                                icon={<Hash className="w-5 h-5" />}
                                value={formData.symbol}
                                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                                placeholder="e.g., kg"
                                error={errors.symbol}
                                maxLength={10}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of this unit"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-3 px-4 outline-none transition-all focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-700 dark:text-slate-300 placeholder:text-slate-400 resize-none"
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Category
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {UNIT_CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat.value as any, baseUnit: '' })}
                                    className={`p-4 rounded-xl border-2 transition-all ${formData.category === cat.value
                                            ? 'border-primary bg-primary/5'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">{cat.icon}</div>
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conversion */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Conversion Settings
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                                    Base Unit
                                </label>
                                <select
                                    value={formData.baseUnit}
                                    onChange={(e) => setFormData({ ...formData, baseUnit: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-3 px-4 outline-none transition-all focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-700 dark:text-slate-300"
                                >
                                    <option value="">None (Base Unit)</option>
                                    {baseUnits.map(u => (
                                        <option key={u._id} value={u._id}>
                                            {u.name} ({u.symbol})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 pl-1">
                                    Select if this unit converts to another
                                </p>
                            </div>
                            <Input
                                label="Conversion Factor"
                                type="number"
                                step="0.0001"
                                value={formData.conversionFactor}
                                onChange={(e) => setFormData({ ...formData, conversionFactor: e.target.value })}
                                placeholder="1"
                                error={errors.conversionFactor}
                                required
                            />
                        </div>
                        {formData.baseUnit && (
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-sm text-blue-900">
                                    1 {formData.symbol || 'unit'} = {formData.conversionFactor}{' '}
                                    {baseUnits.find(u => u._id === formData.baseUnit)?.symbol || 'base unit'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Settings */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Settings
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Decimal Precision"
                                type="number"
                                min="0"
                                max="10"
                                value={formData.precision}
                                onChange={(e) => setFormData({ ...formData, precision: e.target.value })}
                                placeholder="2"
                                error={errors.precision}
                                required
                            />
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-3 px-4 outline-none transition-all focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-700 dark:text-slate-300"
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            isLoading={loading}
                            className="flex-1"
                        >
                            {unit ? 'Update Unit' : 'Create Unit'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
