"use client";

import React, { useState, useEffect } from 'react';
import { Ruler, Plus, Search, Edit, Trash2, RotateCcw, Calculator, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { unitsApi, Unit, ConversionResult } from '@/lib/api/units';
import { Button, Input, AccessDenied } from '@/components/UI';
import BulkUnitImport from '@/components/BulkUnitImport';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';

const UNIT_CATEGORIES = [
    { value: 'all', label: 'All Categories', color: 'slate' },
    { value: 'weight', label: 'Weight', color: 'blue' },
    { value: 'count', label: 'Count', color: 'emerald' },
    { value: 'volume', label: 'Volume', color: 'purple' },
    { value: 'length', label: 'Length', color: 'amber' },
    { value: 'area', label: 'Area', color: 'rose' },
    { value: 'time', label: 'Time', color: 'cyan' },
];

export default function UnitsPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [showConverter, setShowConverter] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const { hasPermission, loading: permissionsLoading } = usePermissions();

    useEffect(() => {
        fetchUnits();
    }, []);

    const fetchUnits = async () => {
        try {
            // Check if storeId exists
            const storeId = localStorage.getItem('storeId');
            console.log('Fetching units with storeId:', storeId);

            if (!storeId) {
                console.warn('No storeId found in localStorage');
                toast.error('Please select an active store from the Stores menu.');
                window.location.href = '/store/stores';
                return;
            }

            const response = await unitsApi.getAll(storeId, {
                limit: 100
            });
            console.log('Units response:', response.data);

            const unitData = Array.isArray(response.data.data) ? response.data.data : [];
            console.log('Parsed units:', unitData.length, 'items');

            setUnits(unitData);
        } catch (error: any) {
            console.error('Fetch units error:', error);
            console.error('Error response:', error.response?.data);

            if (error.response?.status === 401) {
                toast.error('Session expired. Please log in again.');
                setTimeout(() => window.location.href = '/login', 2000);
            } else if (error.response?.status === 403) {
                toast.error('Access denied. You do not have permission to view units.');
            } else if (error.response?.data?.error?.message) {
                toast.error(error.response.data.error.message);
            } else {
                toast.error('Failed to load units');
            }
            setUnits([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this unit?')) return;
        try {
            const storeId = localStorage.getItem('storeId') || '';
            await unitsApi.delete(id, storeId);
            toast.success('Unit deleted successfully');
            fetchUnits();
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to delete unit');
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const storeId = localStorage.getItem('storeId') || '';
            await unitsApi.restore(id, storeId);
            toast.success('Unit restored successfully');
            fetchUnits();
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to restore unit');
        }
    };

    const filteredUnits = units.filter(unit => {
        const matchesSearch = unit.name.toLowerCase().includes(search.toLowerCase()) ||
            unit.symbol.toLowerCase().includes(search.toLowerCase()) ||
            unit.description?.toLowerCase().includes(search.toLowerCase());
            
        const matchesCategory = categoryFilter === 'all' || unit.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });

    const getCategoryStats = () => {
        const stats: Record<string, number> = {};
        units.forEach(unit => {
            stats[unit.category] = (stats[unit.category] || 0) + 1;
        });
        return stats;
    };

    const categoryStats = getCategoryStats();
    const baseUnits = units.filter(u => !u.baseUnit);

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
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Units Management</h1>
                    <p className="text-slate-500 mt-1">Manage measurement units and conversions</p>
                </div>
                <div className="flex gap-3">
                    {canManage && (
                        <>
                            <Button
                                onClick={() => setShowConverter(true)}
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                            >
                                <Calculator className="w-5 h-5" />
                                Unit Converter
                            </Button>
                            <Button
                                onClick={() => setShowBulkImport(true)}
                                className="gap-2 bg-purple-600 hover:bg-purple-700"
                            >
                                <Download className="w-5 h-5" />
                                Import Units
                            </Button>
                            <Button onClick={() => { setSelectedUnit(null); setShowModal(true); }} className="gap-2">
                                <Plus className="w-5 h-5" />
                                Add Unit
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Ruler className="w-5 h-5 text-primary" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Total Units</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{units.length}</h3>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Ruler className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Active</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {units.filter(u => u.status === 'active').length}
                    </h3>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Ruler className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Base Units</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{baseUnits.length}</h3>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Ruler className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Categories</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {Object.keys(categoryStats).length}
                    </h3>
                </motion.div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {UNIT_CATEGORIES.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => setCategoryFilter(cat.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${categoryFilter === cat.value
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                    >
                        {cat.label}
                        {cat.value !== 'all' && categoryStats[cat.value] && (
                            <span className="ml-2 px-2 py-0.5 bg-white/20 dark:bg-slate-900/20 rounded-full text-xs">
                                {categoryStats[cat.value]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search units..."
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="card-premium overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Name</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Symbol</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Category</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Base Unit</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Conversion</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                            {canManage && (
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUnits.map((unit) => {
                            const baseUnitObj = units.find(u => u.id === unit.baseUnit);
                            return (
                                <tr key={unit.id} className="border-b border-slate-50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                    <td className="py-4 px-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-800 dark:text-slate-200">{unit.name}</span>
                                            {unit.description && (
                                                <span className="text-xs text-slate-500">{unit.description}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                                            {unit.symbol}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 capitalize">
                                            {unit.category}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                        {baseUnitObj ? (
                                            <span className="font-medium">{baseUnitObj.name} ({baseUnitObj.symbol})</span>
                                        ) : (
                                            <span className="text-emerald-600 font-bold">Base Unit</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                        {unit.baseUnit ? (
                                            <span className="font-mono">×{unit.conversionFactor}</span>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${unit.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}>
                                            {unit.status}
                                        </span>
                                    </td>
                                    {canManage && (
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                {unit.deletedAt ? (
                                                    <button
                                                        onClick={() => handleRestore(unit.id)}
                                                        className="p-2 hover:bg-emerald-50 rounded-lg"
                                                        title="Restore"
                                                    >
                                                        <RotateCcw className="w-4 h-4 text-emerald-600" />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => { setSelectedUnit(unit); setShowModal(true); }}
                                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                                        >
                                                            <Edit className="w-4 h-4 text-slate-400" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(unit.id)}
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
                            );
                        })}
                    </tbody>
                </table>

                {filteredUnits.length === 0 && (
                    <div className="text-center py-12">
                        <Ruler className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">No units found</p>
                        <p className="text-sm text-slate-400 mt-2">Add your first unit to get started</p>
                    </div>
                )}
            </div>

            {showModal && (
                <UnitModal
                    unit={selectedUnit}
                    units={units}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        fetchUnits();
                        setShowModal(false);
                    }}
                />
            )}

            {showConverter && (
                <UnitConverter
                    units={units}
                    onClose={() => setShowConverter(false)}
                />
            )}

            {showBulkImport && (
                <BulkUnitImport
                    onClose={() => setShowBulkImport(false)}
                    onSuccess={() => {
                        fetchUnits();
                        setShowBulkImport(false);
                    }}
                />
            )}
        </div>
    );
}

function UnitModal({ unit, units, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        name: unit?.name || '',
        symbol: unit?.symbol || '',
        description: unit?.description || '',
        category: unit?.category || 'count',
        baseUnit: unit?.baseUnit || '',
        conversionFactor: unit?.conversionFactor || 1,
        precision: unit?.precision || 2,
        status: unit?.status || 'active',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                baseUnit: formData.baseUnit || null,
                conversionFactor: parseFloat(formData.conversionFactor as any),
                precision: parseInt(formData.precision as any),
            };

            const storeId = localStorage.getItem('storeId') || '';

            if (unit) {
                await unitsApi.update(unit.id, storeId, payload);
                toast.success('Unit updated successfully');
            } else {
                await unitsApi.create(storeId, payload);
                toast.success('Unit created successfully');
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const baseUnitsForCategory = units.filter((u: Unit) =>
        u.category === formData.category && !u.baseUnit && u.id !== unit?.id
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    {unit ? 'Edit Unit' : 'Add New Unit'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Unit Name *</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Kilogram"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Symbol *</label>
                            <Input
                                value={formData.symbol}
                                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                                placeholder="e.g., kg"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of this unit"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 resize-none"
                            rows={2}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category *</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as any, baseUnit: '' })}
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                                required
                            >
                                <option value="weight">Weight</option>
                                <option value="count">Count</option>
                                <option value="volume">Volume</option>
                                <option value="length">Length</option>
                                <option value="area">Area</option>
                                <option value="time">Time</option>
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
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Base Unit</label>
                            <select
                                value={formData.baseUnit}
                                onChange={(e) => setFormData({ ...formData, baseUnit: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                            >
                                <option value="">None (This is a base unit)</option>
                                {baseUnitsForCategory.map((u: Unit) => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Precision</label>
                            <Input
                                type="number"
                                value={formData.precision}
                                onChange={(e) => setFormData({ ...formData, precision: e.target.value })}
                                min="0"
                                max="10"
                            />
                        </div>
                    </div>
                    {formData.baseUnit && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Conversion Factor *
                            </label>
                            <Input
                                type="number"
                                step="any"
                                value={formData.conversionFactor}
                                onChange={(e) => setFormData({ ...formData, conversionFactor: e.target.value })}
                                placeholder="e.g., 1000 (1 kg = 1000 g)"
                                required={!!formData.baseUnit}
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                How many base units equal 1 of this unit
                            </p>
                        </div>
                    )}
                    <div className="flex gap-4 pt-4">
                        <Button type="button" onClick={onClose} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? 'Saving...' : unit ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

function UnitConverter({ units, onClose }: any) {
    const [fromUnit, setFromUnit] = useState('');
    const [toUnit, setToUnit] = useState('');
    const [value, setValue] = useState('1');
    const [result, setResult] = useState<ConversionResult | null>(null);
    const [loading, setLoading] = useState(false);

    const handleConvert = async () => {
        if (!fromUnit || !toUnit || !value) {
            toast.error('Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            const storeId = localStorage.getItem('storeId') || '';
            const response = await unitsApi.convert(storeId, {
                value: parseFloat(value),
                fromUnitId: fromUnit,
                toUnitId: toUnit,
            });
            setResult(response.data.data);
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Conversion failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-2xl w-full"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Unit Converter</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Value</label>
                        <Input
                            type="number"
                            step="any"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="Enter value"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">From Unit</label>
                            <select
                                value={fromUnit}
                                onChange={(e) => setFromUnit(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                            >
                                <option value="">Select unit</option>
                                {units.filter((u: Unit) => u.status === 'active').map((u: Unit) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.symbol}) - {u.category}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">To Unit</label>
                            <select
                                value={toUnit}
                                onChange={(e) => setToUnit(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
                            >
                                <option value="">Select unit</option>
                                {units.filter((u: Unit) => u.status === 'active').map((u: Unit) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.symbol}) - {u.category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Button
                        onClick={handleConvert}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'Converting...' : 'Convert'}
                    </Button>

                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-primary/10 to-emerald-50 rounded-2xl p-6 border border-primary/20"
                        >
                            <div className="text-center">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Result</p>
                                <div className="flex items-center justify-center gap-3 mb-4">
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {result.originalValue}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {result.originalUnit.name} ({result.originalUnit.symbol})
                                        </p>
                                    </div>
                                    <div className="text-primary">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-2xl font-bold text-primary">
                                            {result.convertedValue}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {result.convertedUnit.name} ({result.convertedUnit.symbol})
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white/50 dark:bg-slate-900/50 rounded-xl p-3">
                                    <p className="text-xs text-slate-500 mb-1">Formula</p>
                                    <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{result.formula}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
