"use client";

import React, { useState } from 'react';
import {
    Search,
    ShoppingCart,
    User,
    Plus,
    Minus,
    Trash2,
    Calculator,
    Barcode,
    QrCode,
    Grid,
    List,
    X
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button, Input, AccessDenied } from '@/components/UI';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';
import { inventoryApi, Item } from '@/lib/api/inventory';
import { categoriesApi, Category } from '@/lib/api/categories';
import { customersApi, Customer } from '@/lib/api/customers';
import { suppliersApi, Supplier } from '@/lib/api/suppliers';
import { transactionsApi } from '@/lib/api/transactions';
import BalanceDisplay from '@/components/UI/BalanceDisplay';

export default function POSPage() {
    const [transactionType, setTransactionType] = useState<'SALE' | 'PURCHASE'>('SALE');
    const [cart, setCart] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [items, setItems] = useState<Item[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'CREDIT'>('CASH');
    const [amountPaid, setAmountPaid] = useState<string>('');
    const [draftOrderId, setDraftOrderId] = useState<string>('...');
    const [scanBuffer, setScanBuffer] = useState('');
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (!showCameraScanner) return;

        let scanner: any = null;
        const timer = setTimeout(() => {
            scanner = new Html5QrcodeScanner(
                "qr-reader", 
                { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true }, 
                false
            );
            
            scanner.render(
                (decodedText: string) => {
                    if (scanner) {
                        scanner.clear().catch(console.error);
                    }
                    setShowCameraScanner(false);
                    
                    const product = items.find(i => i.barcode === decodedText || i.id === decodedText || i.name.toLowerCase() === decodedText.toLowerCase());
                    if (product) {
                        addToCart(product, '📦');
                        toast.success(`Scanned: ${product.name}`);
                    } else {
                        toast.error(`Product not found: ${decodedText}`);
                    }
                },
                (err: any) => {
                    // Ignore continuous scan errors
                }
            );
        }, 100);

        return () => {
            clearTimeout(timer);
            if (scanner) {
                scanner.clear().catch(console.error);
            }
        };
    }, [showCameraScanner, items]);
    const { hasPermission, loading } = usePermissions();

    const fetchNextOrderId = async () => {
        try {
            const storeId = localStorage.getItem('storeId') || '';
            const txRes = await transactionsApi.getAll(storeId, { limit: 1, type: transactionType });
            const count = txRes.data.meta?.total || 0;
            const prefix = transactionType === 'SALE' ? 'SALE' : 'PURCHASE';
            setDraftOrderId(`${prefix}-${String(count).padStart(4, '0')}`);
        } catch (err) {
            setDraftOrderId('...');
        }
    };

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const storeId = localStorage.getItem('storeId') || '';
                const [itemsRes, catsRes, custRes, suppRes] = await Promise.all([
                    inventoryApi.getAll(storeId, { limit: 50, status: 'active', search: debouncedSearch }),
                    categoriesApi.getAll(storeId, { limit: 100, status: 'active' }),
                    customersApi.getAll(storeId, { limit: 50, search: debouncedSearch }),
                    suppliersApi.getAll({ limit: 50, search: debouncedSearch }).catch(() => ({ data: { data: [] } }))
                ]);
                
                setItems(Array.isArray(itemsRes.data.data) ? itemsRes.data.data : []);
                setCategories(Array.isArray(catsRes.data.data) ? catsRes.data.data : []);
                setCustomers(Array.isArray(custRes.data.data) ? custRes.data.data : []);
                setSuppliers(Array.isArray(suppRes.data?.data) ? suppRes.data.data : []);
                fetchNextOrderId();
            } catch (error) {
                toast.error('Failed to load POS catalog');
            } finally {
                setIsFetching(false);
            }
        };

        if (hasPermission(PERMISSIONS.CREATE_TRANSACTION) && !loading) {
            loadData();
        } else if (!loading) {
            setIsFetching(false);
        }
    }, [hasPermission, loading, transactionType, debouncedSearch]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const addToCart = (product: Item, icon: string) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            const price = transactionType === 'PURCHASE' ? product.purchasePrice || 0 : product.salePrice;
            return [...prev, { id: product.id, name: product.name, price, image: icon, qty: 1 }];
        });
        toast.success(`${product.name} added`);
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.qty + delta;
                return newQty > 0 ? { ...item, qty: newQty } : item;
            }
            return item;
        }).filter(item => item.qty > 0));
    };

    const barcodeBuffer = React.useRef('');
    const barcodeTimeout = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                e.preventDefault();
                searchInputRef.current?.focus();
                return;
            }
            if (e.key === 'F4') {
                e.preventDefault();
                setCart([]);
                return;
            }
            if (e.key === 'F8') {
                e.preventDefault();
                document.getElementById('checkout-btn')?.click();
                return;
            }

            // Ignore if typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as HTMLElement).isContentEditable
            ) {
                return;
            }

            if (e.key === 'Enter') {
                if (barcodeBuffer.current) {
                    const scannedBarcode = barcodeBuffer.current;
                    const product = items.find(i => i.barcode === scannedBarcode);
                    
                    if (product) {
                        addToCart(product, '📦');
                    } else {
                        toast.error(`Product not found for barcode: ${scannedBarcode}`);
                    }
                    barcodeBuffer.current = '';
                }
            } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                barcodeBuffer.current += e.key;
                
                if (barcodeTimeout.current) {
                    clearTimeout(barcodeTimeout.current);
                }
                
                barcodeTimeout.current = setTimeout(() => {
                    barcodeBuffer.current = '';
                }, 100);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (barcodeTimeout.current) clearTimeout(barcodeTimeout.current);
        };
    }, [items]);

    const isSale = transactionType === 'SALE';

    const handleCheckout = async () => {
        if (isCheckingOut) return;
        setIsCheckingOut(true);
        try {
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const tax = 0;
        const finalTotal = subtotal;

        let actualAmountPaid = amountPaid !== '' ? parseFloat(amountPaid) : 0;
        if (isNaN(actualAmountPaid)) actualAmountPaid = 0;

        if (cart.length === 0) {
            if (isSale && selectedCustomer && actualAmountPaid > 0) {
                // If cart is empty, but they selected a customer and entered an amountPaid,
                // assume they are just paying off their loan/credit balance.
                try {
                    const storeId = localStorage.getItem('storeId') || '';
                    await customersApi.recordPayment(storeId, selectedCustomer.id, {
                        amount: actualAmountPaid,
                        paymentMethod,
                        reference: 'POS Manual Payment'
                    });
                    toast.success('Payment recorded successfully!');
                    setAmountPaid('');
                    setSelectedCustomer(null);
                    // Refresh customers to get updated balance
                    const custRes = await customersApi.getAll(storeId, { limit: 1000 });
                    setCustomers(Array.isArray(custRes.data.data) ? custRes.data.data : []);
                    return;
                } catch (error: any) {
                    toast.error(error.response?.data?.error || error.response?.data?.message || 'Payment failed');
                    return;
                }
            } else {
                toast.error('Cart is empty. Please add items or select a customer to pay a loan balance.');
                return;
            }
        }

        if (paymentMethod === 'CREDIT' || actualAmountPaid < finalTotal) {
            if (isSale && !selectedCustomer) {
                toast.error('Please select a customer for credit / partial payment');
                return;
            }
            if (!isSale && !selectedSupplier) {
                toast.error('Please select a supplier for credit / partial payment');
                return;
            }
        }

        const storeId = localStorage.getItem('storeId') || '';

        let finalPaymentMethod: string = paymentMethod;
        const paymentDetails: any = {};
        
        if (paymentMethod === 'CREDIT') {
            paymentDetails.credit = finalTotal;
        } else if (actualAmountPaid < finalTotal) {
            finalPaymentMethod = 'MIXED';
            paymentDetails[paymentMethod.toLowerCase()] = actualAmountPaid;
            paymentDetails.credit = finalTotal - actualAmountPaid;
        } else if (actualAmountPaid > finalTotal && (isSale ? selectedCustomer : selectedSupplier)) {
            finalPaymentMethod = 'MIXED';
            paymentDetails[paymentMethod.toLowerCase()] = actualAmountPaid;
            paymentDetails.credit = finalTotal - actualAmountPaid; // Negative credit adjusts their balance (adds to funds)
        } else {
            paymentDetails[paymentMethod.toLowerCase()] = finalTotal;
        }

        const payload: any = {
            storeId,
            partyType: isSale ? 'CUSTOMER' : 'SUPPLIER',
            type: transactionType,
            items: cart.map(item => ({
                itemId: item.id,
                itemName: item.name,
                quantity: item.qty,
                price: item.price,
                total: item.price * item.qty
            })),
            subtotal,
            tax,
            total: finalTotal,
            paymentMethod: finalPaymentMethod,
            paymentDetails
        };

        if (isSale && selectedCustomer) {
            payload.partyId = selectedCustomer.id;
        } else if (!isSale && selectedSupplier) {
            payload.partyId = selectedSupplier.id;
        }

        try {
            await transactionsApi.create(storeId, payload);
            toast.success(isSale ? 'Sale completed successfully!' : 'Purchase completed successfully!');
            setCart([]);
            setAmountPaid('');
            if (isSale) {
                setSelectedCustomer(null);
                const custRes = await customersApi.getAll(storeId, { limit: 1000 });
                setCustomers(Array.isArray(custRes.data.data) ? custRes.data.data : []);
            } else {
                setSelectedSupplier(null);
                const suppRes = await suppliersApi.getAll({ limit: 1000 }).catch(() => ({ data: { data: [] } }));
                setSuppliers(Array.isArray(suppRes.data?.data) ? suppRes.data.data : []);
            }
            fetchNextOrderId();
        } catch (error: any) {
            toast.error(error.response?.data?.error || error.response?.data?.message || 'Checkout failed');
        }
        } finally {
            setIsCheckingOut(false);
        }
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const finalTotal = total;
    const parsedPaid = amountPaid !== '' ? parseFloat(amountPaid) : 0;
    const numericPaid = isNaN(parsedPaid) ? 0 : parsedPaid;
    const difference = numericPaid - finalTotal;

    if (loading || isFetching) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!hasPermission(PERMISSIONS.CREATE_TRANSACTION)) {
        return <AccessDenied />;
    }

    return (
        <div className="h-[calc(100vh-120px)] flex gap-8 overflow-hidden">
            {/* Products Section */}
            <div className="flex-1 flex flex-col gap-6 no-print">
                <div className="flex items-center justify-between">
                    <div className="relative w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search product or scan barcode... (F2)"
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowCameraScanner(true)}
                            className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-primary dark:hover:text-primary rounded-xl transition-colors shadow-sm"
                            title="Scan with Camera"
                        >
                            <QrCode className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-3 border rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-3 border rounded-xl transition-colors ${viewMode === 'list' ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    <div className={`pb-6 ${viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-4 gap-6' : 'flex flex-col gap-4'}`}>
                        {items
                            .filter(p => {
                                const searchLower = search.toLowerCase();
                                const nameMatch = p.name?.toLowerCase().includes(searchLower) || false;
                                const barcodeMatch = p.barcode?.toLowerCase().includes(searchLower) || false;
                                return nameMatch || barcodeMatch;
                            })
                            .map(product => {
                                const cat = categories.find(c => c.id === (product.categoryId?.id || product.categoryId));
                                const icon = cat?.icon || '📦';
                                return (
                                    <motion.div
                                        key={product.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => addToCart(product, icon)}
                                        className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all cursor-pointer group ${viewMode === 'grid' ? 'p-4 text-center' : 'p-3 flex items-center gap-4'}`}
                                    >
                                        <div className={`${viewMode === 'grid' ? 'w-full aspect-square mb-4 text-4xl' : 'w-16 h-16 text-2xl shrink-0'} bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 transition-colors`}>
                                            {icon}
                                        </div>
                                        <div className={viewMode === 'list' ? 'flex-1 text-left' : ''}>
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{product.name}</h4>
                                            <p className="text-primary font-bold mt-1">Rs {product.salePrice.toFixed(2)}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        {items.length === 0 && search === '' && (
                            <div className="col-span-full py-12 text-center text-slate-400">
                                No active products in inventory.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cart Section */}
            <div className="w-[360px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-50 flex flex-col overflow-hidden shrink-0">
                <div className="p-5 border-b border-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ShoppingCart className="w-6 h-6 text-primary" />
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">New Order</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {cart.length > 0 && (
                                <button onClick={() => setCart([])} className="text-[10px] text-slate-400 hover:text-rose-500 font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 dark:hover:bg-rose-950/30 rounded transition-colors" title="Clear Cart (F4)">Clear (F4)</button>
                            )}
                            <span className="bg-slate-50 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                                #{draftOrderId}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => {
                                setTransactionType('SALE');
                                setCart([]);
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                                transactionType === 'SALE'
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            Sell
                        </button>
                        <button
                            onClick={() => {
                                setTransactionType('PURCHASE');
                                setCart([]);
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                                transactionType === 'PURCHASE'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            Purchase
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 flex items-center gap-2">
                            <User className="w-3 h-3" /> Select {transactionType === 'SALE' ? 'Customer' : 'Supplier'}
                        </label>
                        {transactionType === 'SALE' ? (
                            <select 
                                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                value={selectedCustomer?.id || ''}
                                onChange={(e) => {
                                    const cust = customers.find(c => c.id === e.target.value);
                                    setSelectedCustomer(cust || null);
                                }}
                            >
                                <option value="">Walk-in Customer</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                                ))}
                            </select>
                        ) : (
                            <select 
                                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                value={selectedSupplier?.id || ''}
                                onChange={(e) => {
                                    const supp = suppliers.find(s => s.id === e.target.value);
                                    setSelectedSupplier(supp || null);
                                }}
                            >
                                <option value="">Walk-in Supplier</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {transactionType === 'SALE' && selectedCustomer && (
                        <BalanceDisplay 
                            balance={selectedCustomer.outstandingBalance || 0} 
                            partyType="CUSTOMER"
                            size="sm"
                            className="!border-none bg-primary/5 hover:bg-primary/10"
                        />
                    )}
                    {transactionType === 'PURCHASE' && selectedSupplier && (
                        <BalanceDisplay 
                            balance={selectedSupplier.payableBalance || 0} 
                            partyType="SUPPLIER"
                            className="!p-2 border-none bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                        />
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <AnimatePresence>
                        {cart.map(item => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center gap-2 group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-xl hover:border-primary/20 transition-colors relative"
                            >
                                <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-sm shrink-0 group-hover:bg-primary/10 transition-colors">
                                    {item.image}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate pr-6">{item.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] font-bold text-slate-400">Rs {item.price.toFixed(2)}</p>
                                        <p className="text-[10px] font-black text-primary">Total: Rs {(item.price * item.qty).toFixed(2)}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-1 shrink-0">
                                    <button
                                        onClick={() => updateQuantity(item.id, -1)}
                                        className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-700 rounded transition-all shadow-sm"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs font-black w-4 text-center">{item.qty}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, 1)}
                                        className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-700 rounded transition-all shadow-sm"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-slate-800 text-slate-300 hover:text-rose-500 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 transition-all opacity-0 group-hover:opacity-100 z-10"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 pt-10">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-200">
                                <ShoppingCart className="w-8 h-8" />
                            </div>
                            <p className="text-slate-400 font-bold text-sm">Cart is empty.<br />Select products to start.</p>
                        </div>
                    )}
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.05)] z-10 flex flex-col gap-2.5">
                    {/* Total Pay Box */}
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/30 px-3 py-2 rounded-lg">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Total Pay</span>
                        </div>
                        <span className="text-lg font-black text-primary">Rs {finalTotal.toFixed(2)}</span>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        {(['CASH', 'CARD'] as const).map((method) => (
                            <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`py-1.5 text-[10px] font-bold rounded transition-all ${
                                    paymentMethod === method 
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white font-black' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                            >
                                {method}
                            </button>
                        ))}
                    </div>

                    {/* Paid Amount Input */}
                    <div className="flex items-center justify-between gap-3 px-1">
                        <span className="text-xs font-bold text-slate-500 shrink-0">Amt Paid</span>
                        <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rs</span>
                            <input
                                type="number"
                                placeholder={finalTotal.toFixed(2)}
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                                className="w-full text-right pr-2.5 pl-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    {/* Change Return / Balance Due Feedback */}
                    {cart.length > 0 && (difference !== 0 || amountPaid !== '') && (
                        <div className="px-1">
                            {difference > 0 ? (
                                (isSale ? selectedCustomer : selectedSupplier) ? (
                                    <div className="flex justify-between items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/10">
                                        <span>Added to Funds:</span>
                                        <span>Rs {difference.toFixed(2)}</span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/10">
                                        <span>Return Change:</span>
                                        <span>Rs {difference.toFixed(2)}</span>
                                    </div>
                                )
                            ) : difference < 0 ? (
                                !selectedCustomer ? (
                                    <div className="flex justify-between items-center text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded border border-rose-100 dark:border-rose-900/10">
                                        <span>Amount Short (No Credit):</span>
                                        <span>Rs {Math.abs(difference).toFixed(2)}</span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded border border-amber-100 dark:border-amber-900/10">
                                        <span>Added to Debt:</span>
                                        <span>Rs {Math.abs(difference).toFixed(2)}</span>
                                    </div>
                                )
                            ) : null}
                        </div>
                    )}

                    {/* Action Button */}
                    <Button 
                        id="checkout-btn"
                        className={`w-full py-2.5 text-xs font-black rounded-lg shadow-md shadow-primary/20 transition-transform active:scale-[0.98] ${isCheckingOut ? 'opacity-70 cursor-not-allowed' : ''}`} 
                        onClick={handleCheckout}
                        disabled={isCheckingOut}
                    >
                        {isCheckingOut ? 'Processing...' : 'Checkout (F8)'}
                    </Button>
                </div>
            </div>

            {/* Camera Scanner Modal */}
            <AnimatePresence>
                {showCameraScanner && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-6 w-full max-w-md flex flex-col relative"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-2">
                                    <QrCode className="w-6 h-6 text-primary" /> Scan Barcode
                                </h3>
                                <button 
                                    onClick={() => setShowCameraScanner(false)} 
                                    className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 p-2">
                                <div id="qr-reader" className="w-full"></div>
                            </div>
                            
                            <p className="text-sm text-center text-slate-500 mt-6 font-bold">
                                Point your camera at the barcode or QR code. The product will be added automatically.
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
