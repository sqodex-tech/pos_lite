'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, MoreVertical, Edit2, Trash2, Tag } from 'lucide-react';
import { brandsApi, Brand } from '@/lib/api/brands';
import toast from 'react-hot-toast';
import { Button, Input } from '@/components/UI';
import { usePermissions } from '@/hooks/usePermissions';

export default function BrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const { hasPermission } = usePermissions();

    const canManage = hasPermission('manage_inventory');

    useEffect(() => {
        fetchBrands();
    }, [search]);

    const fetchBrands = async () => {
        try {
            const storeId = localStorage.getItem('storeId');
            if (!storeId) return;
            const res = await brandsApi.getAll(storeId, { search, limit: 100 });
            setBrands(res.data.data);
        } catch (error) {
            toast.error('Failed to fetch brands');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (brand: Brand) => {
        if (!confirm('Are you sure you want to delete this brand?')) return;
        try {
            const storeId = localStorage.getItem('storeId') || '';
            await brandsApi.delete(brand.id, storeId);
            toast.success('Brand deleted successfully');
            fetchBrands();
        } catch (error) {
            toast.error('Failed to delete brand');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Brand Management</h1>
                    <p className="text-slate-500 mt-1">Organize your inventory with product brands</p>
                </div>
                {canManage && (
                    <div className="flex gap-3">
                        <Button onClick={() => { setSelectedBrand(null); setIsModalOpen(true); }} className="gap-2">
                            <Plus className="w-5 h-5" />
                            Add Brand
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Tag className="w-5 h-5 text-primary" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Total Brands</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{brands.length}</h3>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Tag className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Active</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {brands.filter(b => b.status === 'active').length}
                    </h3>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Tag className="w-5 h-5 text-rose-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Inactive</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {brands.filter(b => b.status === 'inactive').length}
                    </h3>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search brands..."
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Brands List */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : brands.length === 0 ? (
                <div className="text-center py-12">
                    <Tag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No brands found.</p>
                </div>
            ) : (
                <div className="card-premium overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Brand Name</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Description</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                {canManage && <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {brands.map((brand) => (
                                <tr key={brand.id} className="border-b border-slate-50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="py-4 px-4 font-medium text-slate-900 dark:text-white">
                                        {brand.name}
                                    </td>
                                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                        {brand.description || '-'}
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${brand.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                            {brand.status}
                                        </span>
                                    </td>
                                    {canManage && (
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => { setSelectedBrand(brand); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(brand)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <BrandModal
                    brand={selectedBrand}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchBrands();
                    }}
                />
            )}
        </div>
    );
}

function BrandModal({ brand, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        name: brand?.name || '',
        description: brand?.description || '',
        status: brand?.status || 'active',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const storeId = localStorage.getItem('storeId') || '';
            const payload = {
                ...formData,
            };

            if (brand) {
                await brandsApi.update(brand.id || brand._id, storeId, payload);
                toast.success('Brand updated successfully');
            } else {
                await brandsApi.create(storeId, payload);
                toast.success('Brand created successfully');
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    {brand ? 'Edit Brand' : 'Add New Brand'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Brand Name *</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Nike"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of this brand"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 bg-transparent resize-none"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 bg-transparent"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button type="button" onClick={onClose} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? 'Saving...' : brand ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
