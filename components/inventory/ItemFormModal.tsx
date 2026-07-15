"use client";

import React, { useState } from 'react';
import { X, Package, Banknote, AlertTriangle, Barcode, Info, Tag, Settings, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, ScanLine, Plus, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { inventoryApi, Item } from '@/lib/api/inventory';
import { Category } from '@/lib/api/categories';
import { Brand } from '@/lib/api/brands';
import { Unit } from '@/lib/api/units';
import { Button, Input } from '@/components/UI';
import SearchableSelect from './SearchableSelect';
import BarcodeScanner from './BarcodeScanner';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

interface ItemFormModalProps {
    item: Item | null;
    categories: Category[];
    brands: Brand[];
    units: Unit[];
    onClose: () => void;
    onSuccess: () => void;
}

const TABS = [
    { id: 'basic', label: 'Basic Info', icon: Info, fields: ['name', 'barcode'] },
    { id: 'classification', label: 'Classification', icon: Tag, fields: ['categoryId', 'unitId'] },
    { id: 'pricing', label: 'Pricing', icon: Banknote, fields: ['purchasePrice', 'salePrice'] },
    { id: 'settings', label: 'Settings', icon: Settings, fields: ['lowStockAlert'] }
];

export default function ItemFormModal({
    item,
    categories,
    brands,
    units,
    onClose,
    onSuccess
}: ItemFormModalProps) {
    const [activeTab, setActiveTab] = useState('basic');
    const [formData, setFormData] = useState({
        name: item?.name || '',
        barcode: item?.barcode || '',
        purchasePrice: item?.purchasePrice?.toString() || '',
        salePrice: item?.salePrice?.toString() || '',
        lowStockAlert: item?.lowStockAlert?.toString() || '10',
        stockModifier: '0', 
        expiryDate: item?.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
        status: item?.status || 'active',
        categoryId: item?.categoryId?.id || item?.categoryId || '',
        brandId: item?.brandId?.id || item?.brandId || '',
        unitId: item?.unitId?.id || item?.unitId || '',
    });
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Global physical barcode scanner detection
    useBarcodeScanner({
        onScan: (scannedBarcode) => {
            if (!showScanner) { // Only if camera scanner is not active
                setFormData(prev => ({ ...prev, barcode: scannedBarcode }));
                if (errors.barcode) setErrors(prev => ({ ...prev, barcode: '' }));
                toast.success('Barcode detected!');
            }
        }
    });

    const categoryOptions = categories.map(cat => ({
        value: cat.id,
        label: cat.name,
        icon: cat.icon,
        color: cat.color,
        description: cat.description
    }));

    const brandOptions = brands.map(brand => ({
        value: brand.id,
        label: brand.name,
        description: brand.description
    }));

    const unitOptions = units.map(unit => ({
        value: unit.id,
        label: unit.name,
        description: `${unit.symbol} - ${unit.category}`
    }));

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.barcode.trim()) newErrors.barcode = 'Barcode is required';

        const purchasePrice = parseFloat(formData.purchasePrice);
        if (isNaN(purchasePrice) || purchasePrice < 0) newErrors.purchasePrice = 'Valid purchase price is required';

        const salePrice = parseFloat(formData.salePrice);
        if (isNaN(salePrice) || salePrice < 0) newErrors.salePrice = 'Valid sale price is required';

        if (purchasePrice > salePrice) newErrors.salePrice = 'Sale price should be greater than purchase price';

        const lowStock = parseInt(formData.lowStockAlert);
        if (isNaN(lowStock) || lowStock < 0) newErrors.lowStockAlert = 'Valid low stock alert is required';

        const stockMod = parseFloat(formData.stockModifier);
        if (isNaN(stockMod) || stockMod < 0) newErrors.stockModifier = 'Must be a valid positive number';

        if (!formData.categoryId) newErrors.categoryId = 'Category is required';
        if (!formData.unitId) newErrors.unitId = 'Unit is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the form errors');
            return;
        }

        setLoading(true);
        try {
            const storeId = localStorage.getItem('storeId') || '';
            const payload: any = {
                name: formData.name.trim(),
                barcode: formData.barcode.trim(),
                purchasePrice: parseFloat(formData.purchasePrice),
                salePrice: parseFloat(formData.salePrice),
                lowStockAlert: parseInt(formData.lowStockAlert),
                status: formData.status as 'active' | 'inactive',
                categoryId: formData.categoryId || undefined,
                brandId: formData.brandId || undefined,
                unitId: formData.unitId || undefined,
                expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
                storeId 
            };

            const stockModValue = parseFloat(formData.stockModifier);
            if (!isNaN(stockModValue) && stockModValue > 0) {
                if (item) {
                    payload.addStock = stockModValue;
                } else {
                    payload.initialStock = stockModValue;
                }
            }

            if (item) {
                await inventoryApi.update(item.id, storeId, payload);
                toast.success('Product updated successfully');
            } else {
                await inventoryApi.create(storeId, payload);
                toast.success('Product created successfully');
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

    const profitMargin = formData.purchasePrice && formData.salePrice
        ? ((parseFloat(formData.salePrice) - parseFloat(formData.purchasePrice)) / parseFloat(formData.purchasePrice) * 100).toFixed(2)
        : '0';

    const currentTabIndex = TABS.findIndex(t => t.id === activeTab);
    const hasNextTab = currentTabIndex < TABS.length - 1;
    const hasPrevTab = currentTabIndex > 0;

    const handleNext = () => {
        if (hasNextTab) setActiveTab(TABS[currentTabIndex + 1].id);
    };

    const handlePrev = () => {
        if (hasPrevTab) setActiveTab(TABS[currentTabIndex - 1].id);
    };

    const hasErrorsInTab = (tabFields: string[]) => {
        return tabFields.some(field => errors[field]);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full my-8 overflow-hidden shadow-2xl flex flex-col md:flex-row"
            >
                <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-800/50 p-6 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Package className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                {item ? 'Edit Product' : 'Add Product'}
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                {item ? 'Update information' : 'Create new item'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const hasError = hasErrorsInTab(tab.fields);
                            const Icon = tab.icon;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap text-left
                                        ${isActive 
                                            ? 'bg-white dark:bg-slate-900 text-primary shadow-sm border border-slate-200 dark:border-slate-700' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 border border-transparent'}
                                    `}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                                    <span className="font-medium flex-1">{tab.label}</span>
                                    {hasError && <AlertCircle className="w-4 h-4 text-rose-500" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 flex flex-col relative h-[600px] bg-white dark:bg-slate-900">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 z-10 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>

                    <div className="flex-1 overflow-y-auto p-8 pt-16 md:pt-8">
                        <AnimatePresence mode="wait">
                            {activeTab === 'basic' && (
                                <motion.div
                                    key="basic"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.15 }}
                                    className="space-y-6 max-w-xl mx-auto"
                                >
                                    <div className="mb-8">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Basic Information</h3>
                                        <p className="text-sm text-slate-500">Provide the essential details for this product.</p>
                                    </div>
                                    <Input
                                        label="Product Name"
                                        icon={<Package className="w-5 h-5" />}
                                        value={formData.name}
                                        onChange={(e) => {
                                            setFormData({ ...formData, name: e.target.value });
                                            if (errors.name) setErrors({ ...errors, name: '' });
                                        }}
                                        placeholder="e.g., Coca Cola 500ml"
                                        error={errors.name}
                                        required
                                    />
                                    <div className="flex items-end gap-3">
                                        <div className="flex-1">
                                            <Input
                                                label="Barcode"
                                                icon={<Barcode className="w-5 h-5" />}
                                                value={formData.barcode}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, barcode: e.target.value });
                                                    if (errors.barcode) setErrors({ ...errors, barcode: '' });
                                                }}
                                                placeholder="e.g., 1234567890123"
                                                error={errors.barcode}
                                                required
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setShowScanner(true)}
                                            className="mb-[2px] px-4 py-3 h-[46px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                                            title="Scan Barcode"
                                        >
                                            <ScanLine className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'classification' && (
                                <motion.div
                                    key="classification"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.15 }}
                                    className="space-y-6 max-w-xl mx-auto"
                                >
                                    <div className="mb-8">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Classification</h3>
                                        <p className="text-sm text-slate-500">Organize the product into categories, brands, and units.</p>
                                    </div>
                                    <SearchableSelect
                                        label="Category"
                                        options={categoryOptions}
                                        value={formData.categoryId}
                                        onChange={(value) => {
                                            setFormData({ ...formData, categoryId: value });
                                            if (errors.categoryId) setErrors({ ...errors, categoryId: '' });
                                        }}
                                        placeholder="Select a category"
                                        allowClear
                                        error={errors.categoryId}
                                        required
                                    />
                                    <SearchableSelect
                                        label="Brand"
                                        options={brandOptions}
                                        value={formData.brandId}
                                        onChange={(value) => {
                                            setFormData({ ...formData, brandId: value });
                                        }}
                                        placeholder="Select a brand (optional)"
                                        allowClear
                                    />
                                    <SearchableSelect
                                        label="Unit of Measure"
                                        options={unitOptions}
                                        value={formData.unitId}
                                        onChange={(value) => {
                                            setFormData({ ...formData, unitId: value });
                                            if (errors.unitId) setErrors({ ...errors, unitId: '' });
                                        }}
                                        placeholder="Select a unit"
                                        allowClear
                                        error={errors.unitId}
                                        required
                                    />
                                </motion.div>
                            )}

                            {activeTab === 'pricing' && (
                                <motion.div
                                    key="pricing"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.15 }}
                                    className="space-y-6 max-w-xl mx-auto"
                                >
                                    <div className="mb-8">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pricing</h3>
                                        <p className="text-sm text-slate-500">Set the purchase and selling price of the product.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Purchase Price"
                                            icon={<Banknote className="w-5 h-5" />}
                                            type="number"
                                            step="0.01"
                                            value={formData.purchasePrice}
                                            onChange={(e) => {
                                                setFormData({ ...formData, purchasePrice: e.target.value });
                                                if (errors.purchasePrice) setErrors({ ...errors, purchasePrice: '' });
                                            }}
                                            placeholder="0.00"
                                            error={errors.purchasePrice}
                                            required
                                        />
                                        <Input
                                            label="Sale Price"
                                            icon={<Banknote className="w-5 h-5" />}
                                            type="number"
                                            step="0.01"
                                            value={formData.salePrice}
                                            onChange={(e) => {
                                                setFormData({ ...formData, salePrice: e.target.value });
                                                if (errors.salePrice) setErrors({ ...errors, salePrice: '' });
                                            }}
                                            placeholder="0.00"
                                            error={errors.salePrice}
                                            required
                                        />
                                    </div>
                                    {formData.purchasePrice && formData.salePrice && (
                                        <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Profit Margin</span>
                                                <span className={`text-xl font-bold ${parseFloat(profitMargin) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {profitMargin}%
                                                </span>
                                            </div>
                                            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                                Profit per unit: ${(parseFloat(formData.salePrice) - parseFloat(formData.purchasePrice)).toFixed(2)}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'settings' && (
                                <motion.div
                                    key="settings"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.15 }}
                                    className="space-y-6 max-w-xl mx-auto"
                                >
                                    <div className="mb-8">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Inventory Settings</h3>
                                        <p className="text-sm text-slate-500">Configure stock alerts and visibility.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Low Stock Alert Threshold"
                                            icon={<AlertTriangle className="w-5 h-5" />}
                                            type="number"
                                            value={formData.lowStockAlert}
                                            onChange={(e) => setFormData({ ...formData, lowStockAlert: e.target.value })}
                                            placeholder="10"
                                            error={errors.lowStockAlert}
                                            required
                                        />
                                        <Input
                                            label={item ? "Add Stock (Incremental)" : "Initial Stock"}
                                            icon={<Plus className="w-5 h-5" />}
                                            type="number"
                                            step="any"
                                            value={formData.stockModifier}
                                            onChange={(e) => setFormData({ ...formData, stockModifier: e.target.value })}
                                            placeholder="0"
                                            error={errors.stockModifier}
                                        />
                                        <div className="col-span-2">
                                            <Input
                                                label="Expiry Date (Optional)"
                                                icon={<Calendar className="w-5 h-5" />}
                                                type="date"
                                                value={formData.expiryDate}
                                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-3 px-4 outline-none transition-all focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-700 dark:text-slate-300 cursor-pointer"
                                            required
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between mt-auto">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="outline"
                            className="w-32"
                        >
                            Cancel
                        </Button>
                        <div className="flex gap-3">
                            {hasPrevTab && (
                                <Button
                                    type="button"
                                    onClick={handlePrev}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </Button>
                            )}
                            {hasNextTab ? (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    className="gap-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600"
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={() => handleSubmit()}
                                    disabled={loading}
                                    isLoading={loading}
                                    className="gap-2"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    {item ? 'Update Product' : 'Create Product'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {showScanner && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col relative"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Scan Barcode</h3>
                                    <p className="text-sm text-slate-500 mt-1">Position barcode within the frame</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowScanner(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-black/20">
                                <BarcodeScanner
                                    onScanSuccess={(decodedText) => {
                                        setFormData(prev => ({ ...prev, barcode: decodedText }));
                                        if (errors.barcode) setErrors(prev => ({ ...prev, barcode: '' }));
                                        toast.success('Barcode scanned successfully!');
                                        setShowScanner(false);
                                    }}
                                    onScanFailure={(error) => {}}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
