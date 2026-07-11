"use client";

import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit, Trash2, TrendingDown, AlertCircle, Banknote, Download, Grid, List, CheckSquare, CalendarDays, TimerOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { inventoryApi, Item } from '@/lib/api/inventory';
import { categoriesApi, Category } from '@/lib/api/categories';
import { brandsApi, Brand } from '@/lib/api/brands';
import { unitsApi, Unit } from '@/lib/api/units';
import { Button, AccessDenied } from '@/components/UI';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import ItemFormModal from '@/components/inventory/ItemFormModal';
import SearchableSelect from '@/components/inventory/SearchableSelect';
import AdvancedFilters, { FilterState } from '@/components/inventory/AdvancedFilters';
import BulkActions from '@/components/inventory/BulkActions';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';

export default function InventoryPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const { hasPermission, loading: permissionsLoading } = usePermissions();

    useBarcodeScanner({
        onScan: (barcode) => {
            if (!showModal) {
                setSearch(barcode);
                toast.success('Barcode scanned: ' + barcode);
            }
        }
    });

    const [cardFilter, setCardFilter] = useState<'all' | 'lowStock' | 'expired'>('all');

    const [filters, setFilters] = useState<FilterState>({
        status: 'all',
        categoryId: '',
        unitId: '',
        priceRange: { min: '', max: '' },
        stockAlert: false
    });

    const [stats, setStats] = useState({
        total: 0,
        expired: 0,
        lowStock: 0,
        totalValue: 0
    });

    useEffect(() => {
        fetchItems();
        fetchCategories();
        fetchBrands();
        fetchUnits();
    }, []);

    const fetchBrands = async () => {
        try {
            const storeId = localStorage.getItem('storeId') || '';
            const response = await brandsApi.getAll(storeId, { limit: 1000, status: 'active' });
            setBrands(Array.isArray(response.data.data) ? response.data.data : []);
        } catch (error) {
            console.error('Fetch brands error:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const storeId = localStorage.getItem('storeId') || '';
            const response = await categoriesApi.getAll(storeId, { limit: 1000, status: 'active' });
            setCategories(Array.isArray(response.data.data) ? response.data.data : []);
        } catch (error) {
            console.error('Fetch categories error:', error);
        }
    };

    const fetchUnits = async () => {
        try {
            const storeId = localStorage.getItem('storeId') || '';
            const response = await unitsApi.getAll(storeId, { limit: 1000, status: 'active' });
            setUnits(Array.isArray(response.data.data) ? response.data.data : []);
        } catch (error) {
            console.error('Fetch units error:', error);
        }
    };

    const fetchItems = async () => {
        try {
            const storeId = localStorage.getItem('storeId') || '';
            const response = await inventoryApi.getAll(storeId, { limit: 1000 });
            const itemData = Array.isArray(response.data.data) ? response.data.data : [];
            setItems(itemData);

            const expired = itemData.filter((i: Item) => i.expiryDate && new Date(i.expiryDate) < new Date()).length;
            const lowStock = itemData.filter((i: Item) => (i.stock?.quantity || 0) <= (i.lowStockAlert || 0)).length;
            const totalValue = itemData.reduce((sum: number, i: Item) =>
                sum + ((i.stock?.quantity || 0) * (i.purchasePrice || 0)), 0
            );

            setStats({
                total: itemData.length,
                expired,
                lowStock,
                totalValue
            });
        } catch (error: any) {
            console.error('Fetch inventory error:', error);

            if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
                toast.error('Backend server not running');
            } else if (error.response?.status === 401) {
                setTimeout(() => window.location.href = '/login', 2000);
            }

            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            const storeId = localStorage.getItem('storeId') || '';
            await inventoryApi.delete(id, storeId);
            toast.success('Item deleted successfully');
            fetchItems();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete item');
        }
    };

    const handleBulkDelete = async (ids: string[]) => {
        const storeId = localStorage.getItem('storeId') || '';
        await Promise.all(ids.map(id => inventoryApi.delete(id, storeId)));
        fetchItems();
    };

    const handleBulkStatusChange = async (ids: string[], status: 'active' | 'inactive') => {
        const storeId = localStorage.getItem('storeId') || '';
        await Promise.all(ids.map(id => inventoryApi.update(id, storeId, { status })));
        fetchItems();
    };

    const handleExport = (ids: string[]) => {
        const exportData = items
            .filter(item => ids.includes(item.id))
            .map(item => ({
                Name: item.name,
                Barcode: item.barcode,
                'Purchase Price': item.purchasePrice,
                'Sale Price': item.salePrice,
                'Low Stock Alert': item.lowStockAlert,
                Status: item.status
            }));

        if (exportData.length === 0) {
            toast.error('No items to export');
            return;
        }

        const csv = [
            Object.keys(exportData[0]).join(','),
            ...exportData.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredItems.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredItems.map(item => item.id));
        }
    };

    const toggleSelectItem = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Apply filters and search
    let filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.barcode.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = filters.status === 'all' || item.status === filters.status;
        const matchesCategory = !filters.categoryId || (item.categoryId?.id || item.categoryId) === filters.categoryId;
        const matchesUnit = !filters.unitId || (item.unitId?.id || item.unitId) === filters.unitId;

        const matchesPriceMin = !filters.priceRange.min ||
            item.salePrice >= parseFloat(filters.priceRange.min);
        const matchesPriceMax = !filters.priceRange.max ||
            item.salePrice <= parseFloat(filters.priceRange.max);

        const matchesCardFilter = cardFilter === 'all' 
            ? true 
            : cardFilter === 'lowStock' 
                ? (item.stock?.quantity || 0) <= (item.lowStockAlert || 0)
                : !!(item.expiryDate && new Date(item.expiryDate) < new Date());

        return matchesSearch && matchesStatus && matchesCategory &&
            matchesUnit && matchesPriceMin && matchesPriceMax && matchesCardFilter;
    });

    // Apply sorting
    filteredItems.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'price':
                comparison = a.salePrice - b.salePrice;
                break;
            case 'stock':
                comparison = (a.lowStockAlert || 0) - (b.lowStockAlert || 0);
                break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    if (loading || permissionsLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!hasPermission(PERMISSIONS.VIEW_INVENTORY)) {
        return <AccessDenied />;
    }

    const canManage = hasPermission(PERMISSIONS.MANAGE_INVENTORY);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inventory Management</h1>
                    <p className="text-slate-500 mt-1">Manage products, categories, and stock levels</p>
                </div>
                <div className="flex gap-3">
                    {canManage && (
                        <>
                            <Button
                                onClick={() => handleExport(items.map(i => i.id))}
                                variant="outline"
                                className="gap-2"
                            >
                                <Download className="w-5 h-5" />
                                Export All
                            </Button>
                            <Button
                                onClick={() => { setSelectedItem(null); setShowModal(true); }}
                                className="gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add Product
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div 
                    whileHover={{ y: -5 }} 
                    className={`card-premium p-6 cursor-pointer transition-all ${cardFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setCardFilter('all')}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Package className="w-5 h-5 text-primary" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Total Products</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</h3>
                </motion.div>
                <motion.div 
                    whileHover={{ y: -5 }} 
                    className={`card-premium p-6 cursor-pointer transition-all ${cardFilter === 'expired' ? 'ring-2 ring-rose-500' : ''}`}
                    onClick={() => setCardFilter(prev => prev === 'expired' ? 'all' : 'expired')}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <TimerOff className="w-5 h-5 text-rose-500" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Expired Items</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.expired}</h3>
                </motion.div>
                <motion.div 
                    whileHover={{ y: -5 }} 
                    className={`card-premium p-6 cursor-pointer transition-all ${cardFilter === 'lowStock' ? 'ring-2 ring-amber-500' : ''}`}
                    onClick={() => setCardFilter(prev => prev === 'lowStock' ? 'all' : 'lowStock')}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Low Stock</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.lowStock}</h3>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Banknote className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Inventory Value</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Rs {stats.totalValue.toFixed(2)}</h3>
                </motion.div>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search products by name or barcode..."
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <AdvancedFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    categories={categories}
                    units={units}
                />
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' : 'text-slate-600 dark:text-slate-400'
                            }`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' : 'text-slate-600 dark:text-slate-400'
                            }`}
                    >
                        <Grid className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Sort by:</span>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm text-slate-700 dark:text-slate-300 font-medium"
                >
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="stock">Stock Alert</option>
                </select>
                <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors"
                >
                    {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                </button>
                <div className="flex-1" />
                <span className="text-sm text-slate-500">
                    Showing {filteredItems.length} of {items.length} products
                </span>
            </div>

            {/* Content */}
            {viewMode === 'list' ? (
                <div className="card-premium overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                {canManage && (
                                    <th className="text-left py-3 px-4 w-12">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                    </th>
                                )}
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Product</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Barcode</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Category</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Unit</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Purchase</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Sale Price</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Stock</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Alert</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                {canManage && (
                                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => {
                                const category = categories.find(c => c.id === (item.categoryId?.id || item.categoryId));
                                const unit = units.find(u => u.id === (item.unitId?.id || item.unitId));

                                return (
                                    <tr
                                        key={item.id}
                                        className={`border-b border-slate-50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.includes(item.id) ? 'bg-primary/5' : ''
                                            }`}
                                    >
                                        {canManage && (
                                            <td className="py-4 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={() => toggleSelectItem(item.id)}
                                                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                                                />
                                            </td>
                                        )}
                                        <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                                        <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400 font-mono">{item.barcode}</td>
                                        <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                            {category ? (
                                                <span className="flex items-center gap-2">
                                                    {category.icon && <span>{category.icon}</span>}
                                                    {category.name}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                            {unit ? `${unit.name} (${unit.symbol})` : '-'}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">Rs {item.purchasePrice.toFixed(2)}</td>
                                        <td className="py-4 px-4 font-bold text-primary">Rs {item.salePrice.toFixed(2)}</td>
                                        <td className="py-4 px-4 text-sm font-bold">
                                            <span className={(item.stock?.quantity || 0) <= (item.lowStockAlert || 0) ? 'text-red-500' : 'text-emerald-600'}>
                                                {item.stock?.quantity || 0}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">{item.lowStockAlert}</td>
                                        <td className="py-4 px-4">
                                            {item.expiryDate && new Date(item.expiryDate) < new Date() ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                                                    Expired
                                                </span>
                                            ) : (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            )}
                                        </td>
                                        {canManage && (
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => { setSelectedItem(item); setShowModal(true); }}
                                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4 text-slate-400" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-rose-400" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredItems.length === 0 && (
                        <div className="text-center py-12">
                            <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">No products found</p>
                            <p className="text-sm text-slate-400 mt-2">
                                {search || filters.status !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'Add your first product to get started'}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => {
                        const category = categories.find(c => c.id === (item.categoryId?.id || item.categoryId));
                        const unit = units.find(u => u.id === (item.unitId?.id || item.unitId));

                        return (
                            <motion.div
                                key={item.id}
                                whileHover={{ y: -5 }}
                                className={`card-premium p-6 relative ${selectedIds.includes(item.id) ? 'ring-2 ring-primary' : ''
                                    }`}
                            >
                                {canManage && (
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(item.id)}
                                        onChange={() => toggleSelectItem(item.id)}
                                        className="absolute top-4 right-4 w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                                    />
                                )}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        {category?.icon ? (
                                            <span className="text-2xl">{category.icon}</span>
                                        ) : (
                                            <Package className="w-6 h-6 text-primary" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 dark:text-white truncate">{item.name}</h3>
                                        <p className="text-sm text-slate-500 font-mono">{item.barcode}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    {category && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <span className="font-medium">Category:</span>
                                            <span>{category.name}</span>
                                        </div>
                                    )}
                                    {unit && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <span className="font-medium">Unit:</span>
                                            <span>{unit.name} ({unit.symbol})</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-xs text-slate-500">Sale Price</p>
                                        <p className="text-2xl font-bold text-primary">Rs {item.salePrice.toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Stock</p>
                                        <p className={`text-sm font-bold ${(item.stock?.quantity || 0) <= (item.lowStockAlert || 0) ? 'text-red-500' : 'text-emerald-600'}`}>
                                            {item.stock?.quantity || 0}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    {item.expiryDate && new Date(item.expiryDate) < new Date() ? (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                                            Expired
                                        </span>
                                    ) : (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}>
                                            {item.status}
                                        </span>
                                    )}
                                    {canManage && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setSelectedItem(item); setShowModal(true); }}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4 text-slate-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 text-rose-400" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Bulk Actions */}
            {canManage && (
                <AnimatePresence>
                    {selectedIds.length > 0 && (
                        <BulkActions
                            selectedIds={selectedIds}
                            onClearSelection={() => setSelectedIds([])}
                            onDelete={handleBulkDelete}
                            onExport={handleExport}
                            onStatusChange={handleBulkStatusChange}
                        />
                    )}
                </AnimatePresence>
            )}

            {/* Modal */}
            {showModal && (
                <ItemFormModal
                    item={selectedItem}
                    categories={categories}
                    brands={brands}
                    units={units}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        fetchItems();
                        setShowModal(false);
                    }}
                />
            )}
        </div>
    );
}
