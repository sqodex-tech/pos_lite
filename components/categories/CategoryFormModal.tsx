"use client";

import React, { useState } from 'react';
import { X, FolderTree, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { categoriesApi, Category } from '@/lib/api/categories';
import { Button, Input } from '@/components/UI';
import SearchableSelect from '@/components/inventory/SearchableSelect';

interface CategoryFormModalProps {
    category: Category | null;
    categories: Category[];
    onClose: () => void;
    onSuccess: () => void;
}

const EMOJI_SUGGESTIONS = ['📦', '🍔', '🥤', '🍕', '🛒', '💊', '📱', '👕', '🏠', '🎮', '📚', '🎨'];
const COLOR_PRESETS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export default function CategoryFormModal({
    category,
    categories,
    onClose,
    onSuccess
}: CategoryFormModalProps) {
    const [formData, setFormData] = useState({
        name: category?.name || '',
        description: category?.description || '',
        parentId: category?.parentId || '',
        icon: category?.icon || '',
        color: category?.color || '#3B82F6',
        sortOrder: category?.sortOrder?.toString() || '0',
        status: category?.status || 'active',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const parentOptions = categories
        .filter(c => !c.parentId && c._id !== category?._id)
        .map(cat => ({
            value: cat._id,
            label: cat.name,
            icon: cat.icon,
            color: cat.color,
            description: cat.description
        }));

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Category name is required';
        }

        if (formData.name.trim().length < 2) {
            newErrors.name = 'Category name must be at least 2 characters';
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
                description: formData.description.trim() || undefined,
                parentId: formData.parentId || null,
                icon: formData.icon || undefined,
                color: formData.color,
                sortOrder: parseInt(formData.sortOrder),
                status: formData.status as 'active' | 'inactive',
            };

            const storeId = localStorage.getItem('storeId') || '';

            if (category) {
                await categoriesApi.update(category._id, storeId, payload);
                toast.success('Category updated successfully');
            } else {
                await categoriesApi.create(storeId, payload);
                toast.success('Category created successfully');
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
                            <FolderTree className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {category ? 'Edit Category' : 'Add New Category'}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {category ? 'Update category information' : 'Create a new product category'}
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
                        <Input
                            label="Category Name"
                            icon={<FolderTree className="w-5 h-5" />}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Beverages"
                            error={errors.name}
                            required
                        />
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of this category"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-3 px-4 outline-none transition-all focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-700 dark:text-slate-300 placeholder:text-slate-400 resize-none"
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Hierarchy */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Hierarchy
                        </h3>
                        <SearchableSelect
                            label="Parent Category"
                            options={parentOptions}
                            value={formData.parentId}
                            onChange={(value) => setFormData({ ...formData, parentId: value })}
                            placeholder="None (Root Category)"
                            allowClear
                        />
                        <p className="text-xs text-slate-500 pl-1">
                            Leave empty to create a root category, or select a parent to create a subcategory
                        </p>
                    </div>

                    {/* Appearance */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Appearance
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Input
                                    label="Icon (Emoji)"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    placeholder="☕"
                                    maxLength={2}
                                />
                                <div className="flex flex-wrap gap-2">
                                    {EMOJI_SUGGESTIONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon: emoji })}
                                            className="w-10 h-10 flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                                    Color
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="w-20 h-12 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
                                    />
                                    <div className="flex-1 flex flex-wrap gap-2">
                                        {COLOR_PRESETS.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color })}
                                                className="w-10 h-10 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform"
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Settings
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Sort Order"
                                type="number"
                                value={formData.sortOrder}
                                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                                placeholder="0"
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
                            {category ? 'Update Category' : 'Create Category'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
