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
    Grid,
    List
} from 'lucide-react';
import { Button, Input, AccessDenied } from '@/components/UI';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';
import { inventoryApi, Item } from '@/lib/api/inventory';
import { categoriesApi, Category } from '@/lib/api/categories';
import { customersApi, Customer } from '@/lib/api/customers';
import { transactionsApi } from '@/lib/api/transactions';
import BalanceDisplay from '@/components/UI/BalanceDisplay';

export default function POSPage() {
    const [cart, setCart] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<Item[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'CREDIT'>('CASH');
    const [isFetching, setIsFetching] = useState(true);
    const { hasPermission, loading } = usePermissions();

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const storeId = localStorage.getItem('storeId') || '';
                const [itemsRes, catsRes, custRes] = await Promise.all([
                    inventoryApi.getAll(storeId, { limit: 1000, status: 'active' }),
                    categoriesApi.getAll(storeId, { limit: 1000, status: 'active' }),
                    customersApi.getAll(storeId, { limit: 1000 })
                ]);
                
                setItems(Array.isArray(itemsRes.data.data) ? itemsRes.data.data : []);
                setCategories(Array.isArray(catsRes.data.data) ? catsRes.data.data : []);
                setCustomers(Array.isArray(custRes.data.data) ? custRes.data.data : []);
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
    }, [hasPermission, loading]);

    const addToCart = (product: Item, icon: string) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { id: product.id, name: product.name, price: product.salePrice, image: icon, qty: 1 }];
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

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        if (!selectedCustomer) {
            toast.error('Please select a customer');
            return;
        }

        const storeId = localStorage.getItem('storeId') || '';
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const tax = subtotal * 0.1;

        const payload = {
            storeId,
            partyId: selectedCustomer.id,
            partyType: 'CUSTOMER',
            type: 'SALE',
            items: cart.map(item => ({
                itemId: item.id,
                name: item.name,
                quantity: item.qty,
                price: item.price,
                total: item.price * item.qty
            })),
            subtotal,
            tax,
            total: subtotal + tax,
            paymentMethod: paymentMethod,
            paymentDetails: {
                [paymentMethod.toLowerCase()]: subtotal + tax
            }
        };

        try {
            await transactionsApi.create(storeId, payload);
            toast.success('Sale completed successfully!');
            setCart([]);
            setSelectedCustomer(null);
            
            // Refresh customers to get updated balances
            const custRes = await customersApi.getAll(storeId, { limit: 1000 });
            setCustomers(Array.isArray(custRes.data.data) ? custRes.data.data : []);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Checkout failed');
        }
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

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
            <div className="flex-1 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="relative w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search product or scan barcode..."
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400">
                            <Grid className="w-5 h-5" />
                        </button>
                        <button className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400">
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pb-6">
                        {items
                            .filter(p => 
                                p.name.toLowerCase().includes(search.toLowerCase()) || 
                                p.barcode.toLowerCase().includes(search.toLowerCase())
                            )
                            .map(product => {
                                const cat = categories.find(c => c.id === (product.categoryId?.id || product.categoryId));
                                const icon = cat?.icon || '📦';
                                return (
                                    <motion.div
                                        key={product.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => addToCart(product, icon)}
                                        className="card-premium p-4 cursor-pointer text-center group"
                                    >
                                        <div className="w-full aspect-square bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-4xl mb-4 group-hover:bg-primary/10 transition-colors">
                                            {icon}
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{product.name}</h4>
                                        <p className="text-primary font-bold mt-1">Rs {product.salePrice.toFixed(2)}</p>
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
            <div className="w-[400px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-50 flex flex-col overflow-hidden">
                <div className="p-8 border-b border-slate-50 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ShoppingCart className="w-6 h-6 text-primary" />
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">New Order</h3>
                        </div>
                        <span className="bg-slate-50 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                            #ORD-{Date.now().toString().slice(-4)}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 flex items-center gap-2">
                            <User className="w-3 h-3" /> Select Customer
                        </label>
                        <select 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
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
                    </div>

                    {selectedCustomer && (
                        <BalanceDisplay 
                            balance={selectedCustomer.outstandingBalance || 0} 
                            partyType="CUSTOMER"
                            className="!p-3 border-none bg-primary/5 hover:bg-primary/10"
                        />
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <AnimatePresence>
                        {cart.map(item => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center gap-4 group"
                            >
                                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xl shrink-0">
                                    {item.image}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.name}</p>
                                    <p className="text-xs font-bold text-primary">Rs {item.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-2 py-1">
                                    <button
                                        onClick={() => updateQuantity(item.id, -1)}
                                        className="text-slate-400 hover:text-primary transition-colors"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, 1)}
                                        className="text-slate-400 hover:text-primary transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-2 text-slate-300 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 pt-20">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-200">
                                <ShoppingCart className="w-10 h-10" />
                            </div>
                            <p className="text-slate-400 font-bold text-sm">Cart is empty.<br />Select products to start.</p>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50/50 dark:bg-slate-800/50 space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-slate-400 font-bold text-xs uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span>Rs {total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 font-bold text-xs uppercase tracking-widest">
                            <span>Taxes (10%)</span>
                            <span>Rs {(total * 0.1).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-50">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Pay</span>
                        <span className="text-3xl font-black text-primary">Rs {(total * 1.1).toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                        {(['CASH', 'CARD', 'CREDIT'] as const).map((method) => (
                            <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                    paymentMethod === method 
                                    ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-400'
                                }`}
                            >
                                {method}
                            </button>
                        ))}
                    </div>

                    <Button 
                        className={`w-full py-5 text-xl relative overflow-hidden group shadow-lg ${
                            paymentMethod === 'CREDIT' ? 'shadow-rose-100' : 'shadow-primary/30'
                        }`} 
                        size="lg" 
                        onClick={handleCheckout}
                    >
                        <div className="absolute inset-0 bg-white/10 dark:bg-slate-900/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        {paymentMethod === 'CREDIT' ? 'Confirm Credit Sale' : 'Complete Payment'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
