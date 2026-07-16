"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { inventoryApi } from '@/lib/api/inventory';
import { Button } from '@/components/UI';
import toast from 'react-hot-toast';
import api from '@/lib/api/axios';

interface ImportCsvModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    storeId: string;
}

export default function ImportCsvModal({ isOpen, onClose, onSuccess, storeId }: ImportCsvModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleDownloadTemplate = () => {
        const headers = 'name,barcode,purchasePrice,salePrice,stock,lowStockAlert,categoryId,unitId\n';
        const sample = 'Example Product,123456789,10,15,50,5,,\n';
        const blob = new Blob([headers + sample], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventory_template.csv';
        a.click();
    };

    const handleUpload = () => {
        if (!file) return;

        setUploading(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const items = results.data.map((row: any) => ({
                    name: row.name || row.Name,
                    barcode: row.barcode || row.Barcode || '',
                    cost: parseFloat(row.purchasePrice || row['Purchase Price'] || 0),
                    price: parseFloat(row.salePrice || row['Sale Price'] || 0),
                    stock: parseInt(row.stock || row.Stock || 0, 10),
                    lowStockAlert: parseInt(row.lowStockAlert || row['Low Stock Alert'] || 5, 10),
                    categoryId: row.categoryId || null,
                    unitId: row.unitId || null
                })).filter(item => item.name); // basic validation

                if (items.length === 0) {
                    toast.error('No valid items found in CSV');
                    setUploading(false);
                    return;
                }

                try {
                    const res = await api.post(`/inventory/bulk?storeId=${storeId}`, { items });
                    setResult(res.data.data);
                    toast.success('Import completed successfully!');
                    onSuccess();
                } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Failed to import CSV');
                } finally {
                    setUploading(false);
                }
            },
            error: () => {
                toast.error('Failed to parse CSV file');
                setUploading(false);
            }
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800"
                >
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Upload className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-slate-800 dark:text-white">Import Inventory</h3>
                                <p className="text-xs font-bold text-slate-400">Upload multiple products via CSV</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {!result ? (
                            <>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 text-sm text-blue-800 dark:text-blue-300">
                                    <p className="font-bold mb-1">Download Template</p>
                                    <p className="text-xs mb-3">To ensure successful import, please use our standard CSV template.</p>
                                    <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="bg-white">
                                        <FileText className="w-4 h-4 mr-2" /> Download CSV Template
                                    </Button>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select CSV File</label>
                                    <input 
                                        type="file" 
                                        accept=".csv"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="block w-full text-sm text-slate-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-xl file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-primary/10 file:text-primary
                                            hover:file:bg-primary/20
                                            cursor-pointer"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 space-y-4">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h4 className="text-xl font-bold">Import Finished</h4>
                                <div className="flex justify-center gap-8 text-sm">
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase text-[10px]">Imported</p>
                                        <p className="font-black text-2xl text-emerald-600">{result.created}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase text-[10px]">Errors</p>
                                        <p className="font-black text-2xl text-rose-500">{result.errors?.length || 0}</p>
                                    </div>
                                </div>
                                {result.errors?.length > 0 && (
                                    <div className="bg-rose-50 text-rose-600 text-left text-xs p-4 rounded-xl max-h-32 overflow-auto">
                                        <p className="font-bold mb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Skipped Items:</p>
                                        {result.errors.map((e: any, i: number) => (
                                            <div key={i} className="mb-1 truncate">- {e.name}: {e.error}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose}>{result ? 'Close' : 'Cancel'}</Button>
                        {!result && (
                            <Button 
                                className="bg-primary hover:bg-primary-dark text-white font-black shadow-lg shadow-primary/20 min-w-[120px]"
                                onClick={handleUpload}
                                disabled={!file || uploading}
                            >
                                {uploading ? 'Importing...' : 'Upload & Import'}
                            </Button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
