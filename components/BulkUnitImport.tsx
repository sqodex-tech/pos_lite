"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Check, X, Filter, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { unitsApi } from '@/lib/api/units';
import { Button } from '@/components/UI';

interface DummyUnit {
    id: string;
    name: string;
    symbol: string;
    description: string;
    category: 'weight' | 'count' | 'volume' | 'length' | 'area' | 'time';
    isBase: boolean;
    baseUnitSymbol?: string;
    conversionFactor?: number;
    precision: number;
}

const DUMMY_UNITS: DummyUnit[] = [
    // Weight Units
    { id: '1', name: 'Kilogram', symbol: 'kg', description: 'Base unit of mass', category: 'weight', isBase: true, precision: 2 },
    { id: '2', name: 'Gram', symbol: 'g', description: 'Metric unit of mass', category: 'weight', isBase: false, baseUnitSymbol: 'kg', conversionFactor: 1000, precision: 2 },
    { id: '3', name: 'Milligram', symbol: 'mg', description: 'Small metric unit of mass', category: 'weight', isBase: false, baseUnitSymbol: 'kg', conversionFactor: 1000000, precision: 2 },
    { id: '4', name: 'Pound', symbol: 'lb', description: 'Imperial unit of mass', category: 'weight', isBase: false, baseUnitSymbol: 'kg', conversionFactor: 2.20462, precision: 2 },
    { id: '5', name: 'Ounce', symbol: 'oz', description: 'Imperial unit of mass', category: 'weight', isBase: false, baseUnitSymbol: 'kg', conversionFactor: 35.274, precision: 2 },

    // Count Units
    { id: '6', name: 'Piece', symbol: 'pc', description: 'Individual item', category: 'count', isBase: true, precision: 0 },
    { id: '7', name: 'Dozen', symbol: 'doz', description: 'Set of 12 items', category: 'count', isBase: false, baseUnitSymbol: 'pc', conversionFactor: 0.0833333, precision: 0 },
    { id: '8', name: 'Pack', symbol: 'pk', description: 'Package of items', category: 'count', isBase: false, baseUnitSymbol: 'pc', conversionFactor: 1, precision: 0 },
    { id: '9', name: 'Box', symbol: 'box', description: 'Box of items', category: 'count', isBase: false, baseUnitSymbol: 'pc', conversionFactor: 1, precision: 0 },
    { id: '10', name: 'Carton', symbol: 'ctn', description: 'Carton of items', category: 'count', isBase: false, baseUnitSymbol: 'pc', conversionFactor: 1, precision: 0 },

    // Volume Units
    { id: '11', name: 'Liter', symbol: 'L', description: 'Base unit of volume', category: 'volume', isBase: true, precision: 2 },
    { id: '12', name: 'Milliliter', symbol: 'ml', description: 'Metric unit of volume', category: 'volume', isBase: false, baseUnitSymbol: 'L', conversionFactor: 1000, precision: 2 },
    { id: '13', name: 'Gallon', symbol: 'gal', description: 'Imperial unit of volume', category: 'volume', isBase: false, baseUnitSymbol: 'L', conversionFactor: 0.264172, precision: 2 },
    { id: '14', name: 'Fluid Ounce', symbol: 'fl oz', description: 'Imperial unit of volume', category: 'volume', isBase: false, baseUnitSymbol: 'L', conversionFactor: 33.814, precision: 2 },
    { id: '15', name: 'Cup', symbol: 'cup', description: 'Cooking measurement', category: 'volume', isBase: false, baseUnitSymbol: 'L', conversionFactor: 4.22675, precision: 2 },

    // Length Units
    { id: '16', name: 'Meter', symbol: 'm', description: 'Base unit of length', category: 'length', isBase: true, precision: 2 },
    { id: '17', name: 'Centimeter', symbol: 'cm', description: 'Metric unit of length', category: 'length', isBase: false, baseUnitSymbol: 'm', conversionFactor: 100, precision: 2 },
    { id: '18', name: 'Millimeter', symbol: 'mm', description: 'Small metric unit of length', category: 'length', isBase: false, baseUnitSymbol: 'm', conversionFactor: 1000, precision: 2 },
    { id: '19', name: 'Kilometer', symbol: 'km', description: 'Large metric unit of length', category: 'length', isBase: false, baseUnitSymbol: 'm', conversionFactor: 0.001, precision: 2 },
    { id: '20', name: 'Inch', symbol: 'in', description: 'Imperial unit of length', category: 'length', isBase: false, baseUnitSymbol: 'm', conversionFactor: 39.3701, precision: 2 },
    { id: '21', name: 'Foot', symbol: 'ft', description: 'Imperial unit of length', category: 'length', isBase: false, baseUnitSymbol: 'm', conversionFactor: 3.28084, precision: 2 },

    // Area Units
    { id: '22', name: 'Square Meter', symbol: 'm²', description: 'Base unit of area', category: 'area', isBase: true, precision: 2 },
    { id: '23', name: 'Square Centimeter', symbol: 'cm²', description: 'Metric unit of area', category: 'area', isBase: false, baseUnitSymbol: 'm²', conversionFactor: 10000, precision: 2 },
    { id: '24', name: 'Square Foot', symbol: 'ft²', description: 'Imperial unit of area', category: 'area', isBase: false, baseUnitSymbol: 'm²', conversionFactor: 10.7639, precision: 2 },
    { id: '25', name: 'Acre', symbol: 'ac', description: 'Large unit of area', category: 'area', isBase: false, baseUnitSymbol: 'm²', conversionFactor: 0.000247105, precision: 4 },

    // Time Units
    { id: '26', name: 'Hour', symbol: 'hr', description: 'Base unit of time', category: 'time', isBase: true, precision: 2 },
    { id: '27', name: 'Minute', symbol: 'min', description: 'Unit of time', category: 'time', isBase: false, baseUnitSymbol: 'hr', conversionFactor: 60, precision: 0 },
    { id: '28', name: 'Second', symbol: 'sec', description: 'Small unit of time', category: 'time', isBase: false, baseUnitSymbol: 'hr', conversionFactor: 3600, precision: 0 },
    { id: '29', name: 'Day', symbol: 'day', description: 'Large unit of time', category: 'time', isBase: false, baseUnitSymbol: 'hr', conversionFactor: 0.0416667, precision: 2 },
];

const UNIT_CATEGORIES = [
    { value: 'all', label: 'All Categories', count: DUMMY_UNITS.length },
    { value: 'weight', label: 'Weight', count: DUMMY_UNITS.filter(u => u.category === 'weight').length },
    { value: 'count', label: 'Count', count: DUMMY_UNITS.filter(u => u.category === 'count').length },
    { value: 'volume', label: 'Volume', count: DUMMY_UNITS.filter(u => u.category === 'volume').length },
    { value: 'length', label: 'Length', count: DUMMY_UNITS.filter(u => u.category === 'length').length },
    { value: 'area', label: 'Area', count: DUMMY_UNITS.filter(u => u.category === 'area').length },
    { value: 'time', label: 'Time', count: DUMMY_UNITS.filter(u => u.category === 'time').length },
];

interface BulkUnitImportProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function BulkUnitImport({ onClose, onSuccess }: BulkUnitImportProps) {
    const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [createdUnits, setCreatedUnits] = useState<Map<string, string>>(new Map());

    const filteredUnits = DUMMY_UNITS.filter(unit => {
        const matchesCategory = categoryFilter === 'all' || unit.category === categoryFilter;
        const matchesSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            unit.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            unit.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const toggleUnit = (id: string) => {
        const newSelected = new Set(selectedUnits);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedUnits(newSelected);
    };

    const toggleAll = () => {
        if (selectedUnits.size === filteredUnits.length) {
            setSelectedUnits(new Set());
        } else {
            setSelectedUnits(new Set(filteredUnits.map(u => u.id)));
        }
    };

    const handleImport = async () => {
        if (selectedUnits.size === 0) {
            toast.error('Please select at least one unit');
            return;
        }

        // Check if storeId is available
        const storeId = localStorage.getItem('storeId');
        if (!storeId) {
            toast.error('Store ID not found. Please log out and log back in.');
            return;
        }

        setLoading(true);
        const unitsToImport = DUMMY_UNITS.filter(u => selectedUnits.has(u.id));
        const unitMap = new Map<string, string>();

        // First pass: Create base units
        const baseUnits = unitsToImport.filter(u => u.isBase);
        let failCount = 0;

        for (const unit of baseUnits) {
            try {
                const response = await unitsApi.create(storeId, {
                    name: unit.name,
                    symbol: unit.symbol,
                    description: unit.description,
                    category: unit.category as any,
                    precision: unit.precision,
                    status: 'active' as any,
                });
                unitMap.set(unit.symbol, response.data.data._id);
            } catch (error: any) {
                console.error(`Failed to create base unit ${unit.name}:`, error);

                // Log detailed error for debugging
                if (error.response?.data) {
                    console.error('Error details:', error.response.data);
                }

                failCount++;

                // If first unit fails with critical error, stop
                if (unitMap.size === 0 && failCount === 1) {
                    const errorMsg = error.response?.data?.error?.message || error.message;
                    if (errorMsg.includes('storeId is required')) {
                        toast.error('Store ID is missing. Please log out and log back in.');
                        setLoading(false);
                        return;
                    }
                    if (errorMsg.includes('tenant') || errorMsg.includes('Tenant')) {
                        toast.error('Unable to import: Please ensure you are logged in with a tenant account');
                        setLoading(false);
                        return;
                    }
                    if (errorMsg.includes('Access denied')) {
                        toast.error('Access denied: You do not have permission to create units for this store');
                        setLoading(false);
                        return;
                    }
                }
            }
        }

        // Second pass: Create derived units
        const derivedUnits = unitsToImport.filter(u => !u.isBase);
        let successCount = unitMap.size;

        for (const unit of derivedUnits) {
            try {
                const baseUnitId = unitMap.get(unit.baseUnitSymbol!);
                if (!baseUnitId) {
                    console.warn(`Base unit ${unit.baseUnitSymbol} not found for ${unit.name}`);
                    failCount++;
                    continue;
                }

                await unitsApi.create(storeId, {
                    name: unit.name,
                    symbol: unit.symbol,
                    description: unit.description,
                    category: unit.category as any,
                    baseUnit: baseUnitId,
                    conversionFactor: unit.conversionFactor,
                    precision: unit.precision,
                    status: 'active' as any,
                });
                successCount++;
            } catch (error: any) {
                console.error(`Failed to create unit ${unit.name}:`, error);
                failCount++;
            }
        }

        setLoading(false);

        if (successCount > 0) {
            toast.success(`Successfully imported ${successCount} units`);
            if (failCount > 0) {
                toast.error(`Failed to import ${failCount} units`);
            }
            onSuccess();
        } else {
            toast.error('Failed to import units. Please check console for details.');
        }
    };

    const allSelected = filteredUnits.length > 0 && selectedUnits.size === filteredUnits.length;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Import Units</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Select units to import ({selectedUnits.size} selected)
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search units..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        {UNIT_CATEGORIES.map(cat => (
                            <button
                                key={cat.value}
                                onClick={() => setCategoryFilter(cat.value)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${categoryFilter === cat.value
                                        ? 'bg-primary text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {cat.label} ({cat.count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Select All */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                    <button
                        onClick={toggleAll}
                        className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-primary"
                    >
                        {allSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                            <Square className="w-5 h-5" />
                        )}
                        {allSelected ? 'Deselect All' : 'Select All'} ({filteredUnits.length})
                    </button>
                    <div className="text-sm text-slate-500">
                        {selectedUnits.size} of {DUMMY_UNITS.length} units selected
                    </div>
                </div>

                {/* Unit List */}
                <div className="flex-1 overflow-y-auto mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredUnits.map((unit) => {
                            const isSelected = selectedUnits.has(unit.id);
                            return (
                                <motion.div
                                    key={unit.id}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => toggleUnit(unit.id)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                            ? 'border-primary bg-primary/5'
                                            : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            {isSelected ? (
                                                <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 border-2 border-slate-300 rounded-lg" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-slate-900">
                                                    {unit.name}
                                                </h3>
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono rounded">
                                                    {unit.symbol}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-2">
                                                {unit.description}
                                            </p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="inline-block px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg capitalize">
                                                    {unit.category}
                                                </span>
                                                {unit.isBase ? (
                                                    <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-lg font-bold">
                                                        Base Unit
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-2 py-1 bg-amber-50 text-amber-600 text-xs rounded-lg font-mono">
                                                        ×{unit.conversionFactor}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {filteredUnits.length === 0 && (
                        <div className="text-center py-12">
                            <Filter className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">No units found</p>
                            <p className="text-sm text-slate-400 mt-2">Try adjusting your filters</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t border-slate-200">
                    <Button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={loading || selectedUnits.size === 0}
                        className="flex-1 gap-2"
                    >
                        <Download className="w-5 h-5" />
                        {loading ? 'Importing...' : `Import ${selectedUnits.size} Units`}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
