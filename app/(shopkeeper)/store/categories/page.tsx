"use client";

import React, { useState, useEffect } from 'react';
import { FolderTree, Plus, Search, Edit, Trash2, RotateCcw, ChevronRight, ChevronDown, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { categoriesApi, Category, CategoryTree } from '@/lib/api/categories';
import { Button, Input, AccessDenied } from '@/components/UI';
import BulkCategoryImport from '@/components/BulkCategoryImport';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryTree, setCategoryTree] = useState<CategoryTree[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const { hasPermission, loading: permissionsLoading } = usePermissions();

    useEffect(() => {
        fetchCategories();
        fetchCategoryTree();
    }, []);

    const fetchCategories = async () => {
        try {
            // Check if storeId exists
            const storeId = localStorage.getItem('storeId');
            console.log('Fetching categories with storeId:', storeId);

            if (!storeId) {
                console.warn('No storeId found in localStorage');
                toast.error('Please select an active store from the Stores menu.');
                window.location.href = '/store/stores';
                return;
            }

            const response = await categoriesApi.getAll(storeId, { limit: 100 });
            console.log('Categories response:', response.data);

            const categoryData = Array.isArray(response.data.data) ? response.data.data : [];
            console.log('Parsed categories:', categoryData.length, 'items');

            setCategories(categoryData);
        } catch (error: any) {
            console.error('Fetch categories error:', error);
            console.error('Error response:', error.response?.data);

            if (error.response?.status === 401) {
                toast.error('Session expired. Please log in again.');
                setTimeout(() => window.location.href = '/login', 2000);
            } else if (error.response?.status === 403) {
                toast.error('Access denied. You do not have permission to view categories.');
            } else if (error.response?.data?.error?.message) {
                toast.error(error.response.data.error.message);
            } else {
                toast.error('Failed to load categories');
            }
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoryTree = async () => {
        try {
            const storeId = localStorage.getItem('storeId');
            console.log('Fetching category tree with storeId:', storeId);

            if (!storeId) {
                console.warn('No storeId found for tree fetch');
                return;
            }

            const response = await categoriesApi.getTree(storeId);
            console.log('Category tree response:', response.data);

            setCategoryTree(response.data.data || []);
        } catch (error: any) {
            console.error('Fetch category tree error:', error);
            console.error('Tree error response:', error.response?.data);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            const storeId = localStorage.getItem('storeId') || '';
            await categoriesApi.delete(id, storeId);
            toast.success('Category deleted successfully');
            fetchCategories();
            fetchCategoryTree();
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to delete category');
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const storeId = localStorage.getItem('storeId') || '';
            await categoriesApi.restore(id, storeId);
            toast.success('Category restored successfully');
            fetchCategories();
            fetchCategoryTree();
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to restore category');
        }
    };

    const toggleNode = (id: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedNodes(newExpanded);
    };

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        category.description?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading || permissionsLoading) {
        return <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>;
    }

    if (!hasPermission(PERMISSIONS.VIEW_INVENTORY)) {
        return <AccessDenied />;
    }

    const canManage = hasPermission(PERMISSIONS.MANAGE_INVENTORY);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Category Management</h1>
                    <p className="text-slate-500 mt-1">Organize your inventory with hierarchical categories</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' : 'text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            List View
                        </button>
                        <button
                            onClick={() => setViewMode('tree')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'tree' ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' : 'text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            Tree View
                        </button>
                    </div>
                    {canManage && (
                        <>
                            <Button
                                onClick={() => setShowBulkImport(true)}
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                            >
                                <Download className="w-5 h-5" />
                                Import Categories
                            </Button>
                            <Button onClick={() => { setSelectedCategory(null); setShowModal(true); }} className="gap-2">
                                <Plus className="w-5 h-5" />
                                Add Category
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <FolderTree className="w-5 h-5 text-primary" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Total Categories</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{categories.length}</h3>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <FolderTree className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Active</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {categories.filter(c => c.status === 'active').length}
                    </h3>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <FolderTree className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Root Categories</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {categories.filter(c => !c.parentId).length}
                    </h3>
                </motion.div>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search categories..."
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {viewMode === 'list' ? (
                <div className="card-premium overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Name</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Description</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Level</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                {canManage && (
                                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.map((category) => (
                                <tr key={category.id} className="border-b border-slate-50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2">
                                            {category.icon && <span className="text-xl">{category.icon}</span>}
                                            {category.color && (
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: category.color }}
                                                />
                                            )}
                                            <span className="font-medium text-slate-800 dark:text-slate-200">{category.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                        {category.description || '-'}
                                    </td>
                                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                        Level {category.level}
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${category.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}>
                                            {category.status}
                                        </span>
                                    </td>
                                    {canManage && (
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                {category.deletedAt ? (
                                                    <button
                                                        onClick={() => handleRestore(category.id)}
                                                        className="p-2 hover:bg-emerald-50 rounded-lg"
                                                        title="Restore"
                                                    >
                                                        <RotateCcw className="w-4 h-4 text-emerald-600" />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => { setSelectedCategory(category); setShowModal(true); }}
                                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                                        >
                                                            <Edit className="w-4 h-4 text-slate-400" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(category.id)}
                                                            className="p-2 hover:bg-rose-50 rounded-lg"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-rose-400" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredCategories.length === 0 && (
                        <div className="text-center py-12">
                            <FolderTree className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">No categories found</p>
                            <p className="text-sm text-slate-400 mt-2">Add your first category to get started</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="card-premium p-6">
                    <CategoryTreeView
                        nodes={categoryTree}
                        expandedNodes={expandedNodes}
                        onToggle={toggleNode}
                        onEdit={(category: any) => { setSelectedCategory(category); setShowModal(true); }}
                        onDelete={handleDelete}
                        canManage={canManage}
                    />
                    {categoryTree.length === 0 && (
                        <div className="text-center py-12">
                            <FolderTree className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">No categories found</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <CategoryModal
                    category={selectedCategory}
                    categories={categories}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        fetchCategories();
                        fetchCategoryTree();
                        setShowModal(false);
                    }}
                />
            )}

            {showBulkImport && (
                <BulkCategoryImport
                    onClose={() => setShowBulkImport(false)}
                    onSuccess={() => {
                        fetchCategories();
                        fetchCategoryTree();
                        setShowBulkImport(false);
                    }}
                />
            )}
        </div>
    );
}

function CategoryTreeView({ nodes, expandedNodes, onToggle, onEdit, onDelete, level = 0, canManage }: any) {
    return (
        <div className={level > 0 ? 'ml-6 border-l-2 border-slate-100 dark:border-slate-800 pl-4' : ''}>
            {nodes.map((node: CategoryTree) => (
                <div key={node.id} className="mb-2">
                    <div className="flex items-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg group">
                        {node.children && node.children.length > 0 && (
                            <button onClick={() => onToggle(node.id)} className="p-1">
                                {expandedNodes.has(node.id) ? (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                )}
                            </button>
                        )}
                        {node.icon && <span className="text-lg">{node.icon}</span>}
                        {node.color && (
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: node.color }}
                            />
                        )}
                        <span className="flex-1 font-medium text-slate-800 dark:text-slate-200">{node.name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${node.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                            {node.status}
                        </span>
                        {canManage && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onEdit(node)}
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                >
                                    <Edit className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                                <button
                                    onClick={() => onDelete(node.id)}
                                    className="p-1.5 hover:bg-rose-50 rounded"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                </button>
                            </div>
                        )}
                    </div>
                    <AnimatePresence>
                        {expandedNodes.has(node.id) && node.children && node.children.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <CategoryTreeView
                                    nodes={node.children}
                                    expandedNodes={expandedNodes}
                                    onToggle={onToggle}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    level={level + 1}
                                    canManage={canManage}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
}

function CategoryModal({ category, categories, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        name: category?.name || '',
        description: category?.description || '',
        parentId: category?.parentId || '',
        icon: category?.icon || '',
        color: category?.color || '#3B82F6',
        sortOrder: category?.sortOrder || 0,
        status: category?.status || 'active',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const storeId = localStorage.getItem('storeId') || '';
            const payload = {
                ...formData,
                parentId: formData.parentId || null,
                sortOrder: parseInt(formData.sortOrder as any),
            };

            if (category) {
                await categoriesApi.update(category.id, storeId, payload);
                toast.success('Category updated successfully');
            } else {
                await categoriesApi.create(storeId, payload);
                toast.success('Category created successfully');
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const rootCategories = categories.filter((c: Category) => !c.parentId && c.id !== category?.id);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    {category ? 'Edit Category' : 'Add New Category'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category Name *</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Beverages"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of this category"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 resize-none"
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Parent Category</label>
                            <select
                                value={formData.parentId}
                                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                            >
                                <option value="">None (Root Category)</option>
                                {rootCategories.map((cat: Category) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Icon (Emoji)</label>
                            <Input
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                placeholder="☕"
                                maxLength={2}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</label>
                            <input
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                className="w-full h-[46px] border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sort Order</label>
                            <Input
                                type="number"
                                value={formData.sortOrder}
                                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button type="button" onClick={onClose} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? 'Saving...' : category ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
