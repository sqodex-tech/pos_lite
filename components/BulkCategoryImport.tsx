"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Check, X, Filter, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoriesApi } from '@/lib/api/categories';
import { Button } from '@/components/UI';

interface DummyCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    type: 'pharmacy' | 'shop' | 'vendor' | 'restaurant' | 'supermarket' | 'general';
    sortOrder: number;
}

const DUMMY_CATEGORIES: DummyCategory[] = [
    // Pharmacy Categories (20) - Extended with helpful medical categories
    { id: '1', name: 'Prescription Medicines', description: 'Doctor-prescribed medications for chronic conditions', icon: '💊', color: '#EF4444', type: 'pharmacy', sortOrder: 1 },
    { id: '2', name: 'Over-the-Counter', description: 'Pain relievers, cold meds, and daily remedies', icon: '🏥', color: '#F59E0B', type: 'pharmacy', sortOrder: 2 },
    { id: '3', name: 'Vitamins & Supplements', description: 'Multivitamins, omega-3, probiotics for wellness', icon: '💪', color: '#10B981', type: 'pharmacy', sortOrder: 3 },
    { id: '4', name: 'Medical Equipment', description: 'Blood pressure monitors, thermometers, braces', icon: '🩺', color: '#3B82F6', type: 'pharmacy', sortOrder: 4 },
    { id: '5', name: 'Personal Care', description: 'Soap, deodorant, feminine hygiene products', icon: '🧴', color: '#8B5CF6', type: 'pharmacy', sortOrder: 5 },
    { id: '30', name: 'Baby Care', description: 'Formula, diapers, baby wipes, rash cream', icon: '🍼', color: '#F472B6', type: 'pharmacy', sortOrder: 30 },
    { id: '31', name: 'First Aid', description: 'Bandages, gauze, antiseptics, burn cream', icon: '🩹', color: '#84CC16', type: 'pharmacy', sortOrder: 31 },
    { id: '32', name: 'Oral Care', description: 'Toothpaste, floss, mouthwash, whitening kits', icon: '🦷', color: '#EAB308', type: 'pharmacy', sortOrder: 32 },
    { id: '33', name: 'Skin Care', description: 'Moisturizers, acne treatments, anti-aging creams', icon: '🧴', color: '#14B8A6', type: 'pharmacy', sortOrder: 33 },
    { id: '34', name: 'Hair Care', description: 'Shampoo, conditioner, dye, anti-dandruff', icon: '🧴', color: '#F97316', type: 'pharmacy', sortOrder: 34 },
    { id: '35', name: 'Eye Care', description: 'Contact solution, eye drops, lens cleaners', icon: '👓', color: '#A855F7', type: 'pharmacy', sortOrder: 35 },
    { id: '36', name: 'Digestive Health', description: 'Antacids, laxatives, anti-diarrhea meds', icon: '💊', color: '#22C55E', type: 'pharmacy', sortOrder: 36 },
    { id: '37', name: 'Pain Relief', description: 'Headache pills, muscle rubs, arthritis cream', icon: '💉', color: '#DC2626', type: 'pharmacy', sortOrder: 37 },
    { id: '38', name: 'Allergy Relief', description: 'Antihistamines, nasal sprays, eye drops', icon: '🤧', color: '#FBBF24', type: 'pharmacy', sortOrder: 38 },
    { id: '39', name: 'Sexual Health', description: 'Condoms, lubricants, pregnancy tests', icon: '💏', color: '#EC4899', type: 'pharmacy', sortOrder: 39 },
    { id: '80', name: 'Respiratory Health', description: 'Inhalers, cough syrups, vapor rubs', icon: '🌬️', color: '#0EA5E9', type: 'pharmacy', sortOrder: 80 },
    { id: '81', name: 'Sleep Aids', description: 'Melatonin, sleep masks, herbal teas', icon: '😴', color: '#78716C', type: 'pharmacy', sortOrder: 81 },
    { id: '82', name: 'Diabetes Care', description: 'Glucose meters, test strips, insulin pens', icon: '🩸', color: '#FBBF24', type: 'pharmacy', sortOrder: 82 },
    { id: '83', name: 'Mobility Aids', description: 'Canes, walkers, knee supports', icon: '🦽', color: '#64748B', type: 'pharmacy', sortOrder: 83 },
    { id: '84', name: 'Incontinence', description: 'Adult diapers, pads, protective underwear', icon: '🩲', color: '#D97706', type: 'pharmacy', sortOrder: 84 },

    // Shop Categories (20) - Extended for comprehensive retail
    { id: '6', name: 'Electronics', description: 'Smartphones, laptops, chargers, earbuds', icon: '📱', color: '#6366F1', type: 'shop', sortOrder: 6 },
    { id: '7', name: 'Clothing & Fashion', description: 'Shirts, jeans, dresses, activewear', icon: '👕', color: '#EC4899', type: 'shop', sortOrder: 7 },
    { id: '8', name: 'Home & Garden', description: 'Furniture, plants, tools, decor', icon: '🏡', color: '#14B8A6', type: 'shop', sortOrder: 8 },
    { id: '9', name: 'Books & Stationery', description: 'Novels, notebooks, pens, planners', icon: '📚', color: '#F97316', type: 'shop', sortOrder: 9 },
    { id: '10', name: 'Toys & Games', description: 'Board games, dolls, action figures', icon: '🎮', color: '#A855F7', type: 'shop', sortOrder: 10 },
    { id: '40', name: 'Sports & Outdoors', description: 'Bikes, tents, gym equipment, balls', icon: '⚽', color: '#10B981', type: 'shop', sortOrder: 40 },
    { id: '41', name: 'Beauty & Cosmetics', description: 'Lipstick, foundation, hair tools', icon: '💄', color: '#F472B6', type: 'shop', sortOrder: 41 },
    { id: '42', name: 'Shoes & Accessories', description: 'Sneakers, handbags, belts, sunglasses', icon: '👞', color: '#3B82F6', type: 'shop', sortOrder: 42 },
    { id: '43', name: 'Automotive', description: 'Car mats, air fresheners, dash cams', icon: '🚗', color: '#EF4444', type: 'shop', sortOrder: 43 },
    { id: '44', name: 'Jewelry', description: 'Necklaces, earrings, smartwatches', icon: '💍', color: '#F59E0B', type: 'shop', sortOrder: 44 },
    { id: '45', name: 'Pet Supplies', description: 'Dog food, cat litter, leashes', icon: '🐶', color: '#84CC16', type: 'shop', sortOrder: 45 },
    { id: '46', name: 'Furniture', description: 'Sofas, beds, desks, shelves', icon: '🛋️', color: '#8B5CF6', type: 'shop', sortOrder: 46 },
    { id: '47', name: 'Kitchenware', description: 'Pots, knives, blenders, plates', icon: '🍴', color: '#D97706', type: 'shop', sortOrder: 47 },
    { id: '48', name: 'Musical Instruments', description: 'Guitars, drums, microphones', icon: '🎸', color: '#EAB308', type: 'shop', sortOrder: 48 },
    { id: '49', name: 'Art & Crafts', description: 'Paints, canvases, clay, beads', icon: '🎨', color: '#22C55E', type: 'shop', sortOrder: 49 },
    { id: '85', name: 'Bags & Luggage', description: 'Backpacks, suitcases, travel bags', icon: '🎒', color: '#0EA5E9', type: 'shop', sortOrder: 85 },
    { id: '86', name: 'Home Appliances', description: 'Vacuums, irons, air purifiers', icon: '🧹', color: '#06B6D4', type: 'shop', sortOrder: 86 },
    { id: '87', name: 'Camera & Photo', description: 'DSLRs, tripods, memory cards', icon: '📷', color: '#FBBF24', type: 'shop', sortOrder: 87 },
    { id: '88', name: 'Bike & Scooter', description: 'Electric bikes, helmets, locks', icon: '🚲', color: '#DC2626', type: 'shop', sortOrder: 88 },
    { id: '89', name: 'Party Supplies', description: 'Balloons, banners, tableware', icon: '🎉', color: '#A855F7', type: 'shop', sortOrder: 89 },

    // Vendor Categories (15) - Extended for B2B needs
    { id: '11', name: 'Raw Materials', description: 'Metals, plastics, fabrics for manufacturing', icon: '🏭', color: '#64748B', type: 'vendor', sortOrder: 11 },
    { id: '12', name: 'Packaging Supplies', description: 'Boxes, tape, labels, bubble wrap', icon: '📦', color: '#78716C', type: 'vendor', sortOrder: 12 },
    { id: '13', name: 'Office Supplies', description: 'Printer paper, staplers, file folders', icon: '🖊️', color: '#0EA5E9', type: 'vendor', sortOrder: 13 },
    { id: '14', name: 'Cleaning Supplies', description: 'Mops, disinfectants, trash bags', icon: '🧹', color: '#06B6D4', type: 'vendor', sortOrder: 14 },
    { id: '50', name: 'Industrial Tools', description: 'Drills, saws, welding equipment', icon: '🔧', color: '#6366F1', type: 'vendor', sortOrder: 50 },
    { id: '51', name: 'Safety Gear', description: 'Helmets, gloves, safety glasses', icon: '⛑️', color: '#EF4444', type: 'vendor', sortOrder: 51 },
    { id: '52', name: 'Chemicals', description: 'Solvents, acids, cleaning agents', icon: '🧪', color: '#3B82F6', type: 'vendor', sortOrder: 52 },
    { id: '53', name: 'Fabric & Textiles', description: 'Cotton rolls, polyester, threads', icon: '🧵', color: '#EC4899', type: 'vendor', sortOrder: 53 },
    { id: '54', name: 'Printing Materials', description: 'Ink cartridges, vinyl, cardstock', icon: '🖨️', color: '#F59E0B', type: 'vendor', sortOrder: 54 },
    { id: '55', name: 'Hardware', description: 'Screws, nails, anchors, hinges', icon: '🔩', color: '#10B981', type: 'vendor', sortOrder: 55 },
    { id: '56', name: 'Electrical Supplies', description: 'Cables, outlets, circuit breakers', icon: '🔌', color: '#F97316', type: 'vendor', sortOrder: 56 },
    { id: '57', name: 'Plumbing Supplies', description: 'PVC pipes, faucets, sealants', icon: '🚿', color: '#14B8A6', type: 'vendor', sortOrder: 57 },
    { id: '90', name: 'Furniture Hardware', description: 'Drawer slides, knobs, hinges', icon: '🪑', color: '#84CC16', type: 'vendor', sortOrder: 90 },
    { id: '91', name: 'Signage Materials', description: 'LED panels, banners, stands', icon: '🚧', color: '#EAB308', type: 'vendor', sortOrder: 91 },
    { id: '92', name: 'Uniforms & Apparel', description: 'Work shirts, aprons, caps', icon: '👔', color: '#F472B6', type: 'vendor', sortOrder: 92 },

    // Restaurant Categories (15) - Extended menu coverage
    { id: '15', name: 'Appetizers', description: 'Wings, spring rolls, bruschetta', icon: '🥗', color: '#84CC16', type: 'restaurant', sortOrder: 15 },
    { id: '16', name: 'Main Courses', description: 'Steaks, pasta, curries, burgers', icon: '🍽️', color: '#EAB308', type: 'restaurant', sortOrder: 16 },
    { id: '17', name: 'Desserts', description: 'Cakes, ice cream, cheesecakes', icon: '🍰', color: '#F472B6', type: 'restaurant', sortOrder: 17 },
    { id: '18', name: 'Beverages', description: 'Sodas, juices, milkshakes, tea', icon: '🥤', color: '#3B82F6', type: 'restaurant', sortOrder: 18 },
    { id: '19', name: 'Sides', description: 'Fries, rice, salads, bread', icon: '🍟', color: '#F59E0B', type: 'restaurant', sortOrder: 19 },
    { id: '58', name: 'Soups & Salads', description: 'Tomato soup, caesar salad, bisque', icon: '🥣', color: '#22C55E', type: 'restaurant', sortOrder: 58 },
    { id: '59', name: 'Seafood', description: 'Shrimp, salmon, lobster, fish', icon: '🦐', color: '#06B6D4', type: 'restaurant', sortOrder: 59 },
    { id: '60', name: 'Vegetarian', description: 'Paneer, veggie stir-fry, falafel', icon: '🌱', color: '#10B981', type: 'restaurant', sortOrder: 60 },
    { id: '61', name: 'Grills & Barbecue', description: 'Ribs, kebabs, grilled chicken', icon: '🔥', color: '#DC2626', type: 'restaurant', sortOrder: 61 },
    { id: '62', name: 'Pasta & Noodles', description: 'Spaghetti, ramen, lasagna', icon: '🍝', color: '#8B5CF6', type: 'restaurant', sortOrder: 62 },
    { id: '63', name: 'Breakfast', description: 'Pancakes, omelets, waffles', icon: '🥞', color: '#FBBF24', type: 'restaurant', sortOrder: 63 },
    { id: '64', name: 'Kids Menu', description: 'Nuggets, mini burgers, mac cheese', icon: '👶', color: '#A855F7', type: 'restaurant', sortOrder: 64 },
    { id: '93', name: 'Sandwiches', description: 'Subs, clubs, paninis, wraps', icon: '🥪', color: '#D97706', type: 'restaurant', sortOrder: 93 },
    { id: '94', name: 'Pizza', description: 'Pepperoni, margherita, deep dish', icon: '🍕', color: '#EF4444', type: 'restaurant', sortOrder: 94 },
    { id: '95', name: 'Healthy Options', description: 'Quinoa bowls, smoothies, wraps', icon: '🥗', color: '#22C55E', type: 'restaurant', sortOrder: 95 },

    // Supermarket Categories (20) - Extended grocery coverage
    { id: '20', name: 'Fresh Produce', description: 'Apples, spinach, tomatoes, bananas', icon: '🥬', color: '#22C55E', type: 'supermarket', sortOrder: 20 },
    { id: '21', name: 'Dairy & Eggs', description: 'Milk, yogurt, butter, cheese', icon: '🥛', color: '#FBBF24', type: 'supermarket', sortOrder: 21 },
    { id: '22', name: 'Meat & Seafood', description: 'Chicken, beef, salmon, shrimp', icon: '🥩', color: '#DC2626', type: 'supermarket', sortOrder: 22 },
    { id: '23', name: 'Bakery', description: 'Bread, croissants, cakes, bagels', icon: '🍞', color: '#D97706', type: 'supermarket', sortOrder: 23 },
    { id: '24', name: 'Frozen Foods', description: 'Pizza, veggies, ice cream, meals', icon: '🧊', color: '#06B6D4', type: 'supermarket', sortOrder: 24 },
    { id: '25', name: 'Snacks & Candy', description: 'Chips, chocolate, cookies, nuts', icon: '🍫', color: '#A855F7', type: 'supermarket', sortOrder: 25 },
    { id: '26', name: 'Canned Goods', description: 'Tuna, beans, soup, veggies', icon: '🥫', color: '#78716C', type: 'supermarket', sortOrder: 26 },
    { id: '65', name: 'Beverages', description: 'Coke, water, juice, energy drinks', icon: '🥤', color: '#3B82F6', type: 'supermarket', sortOrder: 65 },
    { id: '66', name: 'Pasta & Grains', description: 'Rice, spaghetti, oats, quinoa', icon: '🍚', color: '#F59E0B', type: 'supermarket', sortOrder: 66 },
    { id: '67', name: 'Oils & Condiments', description: 'Olive oil, ketchup, mayo, spices', icon: '🫗', color: '#EF4444', type: 'supermarket', sortOrder: 67 },
    { id: '68', name: 'Household Essentials', description: 'Toilet paper, detergent, trash bags', icon: '🧻', color: '#64748B', type: 'supermarket', sortOrder: 68 },
    { id: '69', name: 'Baby Products', description: 'Formula, diapers, wipes, food', icon: '🍼', color: '#F472B6', type: 'supermarket', sortOrder: 69 },
    { id: '70', name: 'Pet Food', description: 'Kibble, canned food, treats', icon: '🐱', color: '#84CC16', type: 'supermarket', sortOrder: 70 },
    { id: '71', name: 'Health Foods', description: 'Keto, gluten-free, organic items', icon: '🥗', color: '#14B8A6', type: 'supermarket', sortOrder: 71 },
    { id: '72', name: 'Alcohol', description: 'Beer, wine, vodka, cocktails', icon: '🍷', color: '#8B5CF6', type: 'supermarket', sortOrder: 72 },
    { id: '96', name: 'Coffee & Tea', description: 'Ground coffee, tea bags, pods', icon: '☕', color: '#6366F1', type: 'supermarket', sortOrder: 96 },
    { id: '97', name: 'International Foods', description: 'Spices, noodles, sauces from Asia', icon: '🌍', color: '#10B981', type: 'supermarket', sortOrder: 97 },
    { id: '98', name: 'Deli', description: 'Cold cuts, cheeses, prepared salads', icon: '🧀', color: '#F97316', type: 'supermarket', sortOrder: 98 },
    { id: '99', name: 'Flowers & Plants', description: 'Roses, succulents, bouquets', icon: '🌹', color: '#EC4899', type: 'supermarket', sortOrder: 99 },
    { id: '100', name: 'Batteries & Bulbs', description: 'AA batteries, LED bulbs, chargers', icon: '🔋', color: '#3B82F6', type: 'supermarket', sortOrder: 100 },

    // General Categories (15) - Extended services & digital
    { id: '27', name: 'Services', description: 'Plumbing, electrical, cleaning services', icon: '🛠️', color: '#6366F1', type: 'general', sortOrder: 27 },
    { id: '28', name: 'Digital Products', description: 'Apps, eBooks, software licenses', icon: '💻', color: '#8B5CF6', type: 'general', sortOrder: 28 },
    { id: '29', name: 'Miscellaneous', description: 'Random items that dont fit elsewhere', icon: '📋', color: '#64748B', type: 'general', sortOrder: 29 },
    { id: '73', name: 'Events & Tickets', description: 'Concerts, movies, sports events', icon: '🎫', color: '#EC4899', type: 'general', sortOrder: 73 },
    { id: '74', name: 'Subscriptions', description: 'Meal kits, streaming, book clubs', icon: '📦', color: '#F59E0B', type: 'general', sortOrder: 74 },
    { id: '75', name: 'Gifts & Flowers', description: 'Gift cards, chocolates, bouquets', icon: '🎁', color: '#10B981', type: 'general', sortOrder: 75 },
    { id: '76', name: 'Education', description: 'Online courses, tutoring, books', icon: '📖', color: '#3B82F6', type: 'general', sortOrder: 76 },
    { id: '77', name: 'Travel', description: 'Flights, hotels, car rentals', icon: '✈️', color: '#F97316', type: 'general', sortOrder: 77 },
    { id: '78', name: 'Fitness', description: 'Gym membership, yoga classes', icon: '🏋️', color: '#EF4444', type: 'general', sortOrder: 78 },
    { id: '79', name: 'Automotive Services', description: 'Oil change, tire rotation, wash', icon: '🔧', color: '#22C55E', type: 'general', sortOrder: 79 },
    { id: '101', name: 'Beauty Services', description: 'Haircuts, manicures, massages', icon: '💇', color: '#F472B6', type: 'general', sortOrder: 101 },
    { id: '102', name: 'Home Services', description: 'Maid service, repairs, painting', icon: '🏠', color: '#14B8A6', type: 'general', sortOrder: 102 },
    { id: '103', name: 'NFTs & Crypto', description: 'Digital collectibles, tokens', icon: '₿', color: '#F59E0B', type: 'general', sortOrder: 103 },
    { id: '104', name: 'Insurance', description: 'Car, health, home policies', icon: '🛡️', color: '#84CC16', type: 'general', sortOrder: 104 },
    { id: '105', name: 'Legal Services', description: 'Consultations, document prep', icon: '⚖️', color: '#DC2626', type: 'general', sortOrder: 105 }
];

const CATEGORY_TYPES = [
    { value: 'all', label: 'All Types', count: DUMMY_CATEGORIES.length },
    { value: 'pharmacy', label: 'Pharmacy', count: DUMMY_CATEGORIES.filter(c => c.type === 'pharmacy').length },
    { value: 'shop', label: 'Shop', count: DUMMY_CATEGORIES.filter(c => c.type === 'shop').length },
    { value: 'vendor', label: 'Vendor', count: DUMMY_CATEGORIES.filter(c => c.type === 'vendor').length },
    { value: 'restaurant', label: 'Restaurant', count: DUMMY_CATEGORIES.filter(c => c.type === 'restaurant').length },
    { value: 'supermarket', label: 'Supermarket', count: DUMMY_CATEGORIES.filter(c => c.type === 'supermarket').length },
    { value: 'general', label: 'General', count: DUMMY_CATEGORIES.filter(c => c.type === 'general').length },
];

interface BulkCategoryImportProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function BulkCategoryImport({ onClose, onSuccess }: BulkCategoryImportProps) {
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [importStatus, setImportStatus] = useState<{
        total: number;
        completed: number;
        success: number;
        failed: number;
    } | null>(null);

    const filteredCategories = DUMMY_CATEGORIES.filter(cat => {
        const matchesType = typeFilter === 'all' || cat.type === typeFilter;
        const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cat.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    });

    const toggleCategory = (id: string) => {
        const newSelected = new Set(selectedCategories);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedCategories(newSelected);
    };

    const toggleAll = () => {
        if (selectedCategories.size === filteredCategories.length) {
            setSelectedCategories(new Set());
        } else {
            setSelectedCategories(new Set(filteredCategories.map(c => c.id)));
        }
    };

    const handleImport = async () => {
        if (selectedCategories.size === 0) {
            toast.error('Please select at least one category');
            return;
        }

        const storeId = localStorage.getItem('storeId');
        if (!storeId) {
            toast.error('Store ID not found. Please log out and log back in.');
            return;
        }

        const categoriesToImport = DUMMY_CATEGORIES.filter(c => selectedCategories.has(c.id));
        
        setLoading(true);
        setImportStatus({
            total: categoriesToImport.length,
            completed: 0,
            success: 0,
            failed: 0
        });

        let currentSuccess = 0;
        let currentFailed = 0;
        let currentCompleted = 0;

        const importPromises = categoriesToImport.map(async (category) => {
            try {
                await categoriesApi.create(storeId, {
                    name: category.name,
                    description: category.description,
                    icon: category.icon,
                    color: category.color,
                    sortOrder: category.sortOrder,
                    status: 'active' as any,
                });
                
                currentSuccess++;
            } catch (error: any) {
                console.error(`Failed to create category ${category.name}:`, error);
                currentFailed++;
            } finally {
                currentCompleted++;
                setImportStatus({
                    total: categoriesToImport.length,
                    completed: currentCompleted,
                    success: currentSuccess,
                    failed: currentFailed
                });
            }
        });

        // Use concurrency to drastically speed up API execution
        await Promise.allSettled(importPromises);

        setLoading(false);

        if (currentSuccess > 0) {
            toast.success(`Successfully imported ${currentSuccess} categories`);
            if (currentFailed > 0) {
                toast.error(`Failed to import ${currentFailed} categories`);
            }
            setTimeout(() => {
                onSuccess();
            }, 1000);
        } else {
            toast.error('Failed to import categories. Please try again.');
            setImportStatus(null);
        }
    };

    const allSelected = filteredCategories.length > 0 && selectedCategories.size === filteredCategories.length;

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
                        <h2 className="text-2xl font-bold text-slate-900">Import Categories</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Select categories to import ({selectedCategories.size} selected)
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
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        {CATEGORY_TYPES.map(type => (
                            <button
                                key={type.value}
                                onClick={() => setTypeFilter(type.value)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${typeFilter === type.value
                                        ? 'bg-primary text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {type.label} ({type.count})
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
                        {allSelected ? 'Deselect All' : 'Select All'} ({filteredCategories.length})
                    </button>
                    <div className="text-sm text-slate-500">
                        {selectedCategories.size} of {DUMMY_CATEGORIES.length} categories selected
                    </div>
                </div>

                {/* Category List */}
                <div className="flex-1 overflow-y-auto mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCategories.map((category) => {
                            const isSelected = selectedCategories.has(category.id);
                            return (
                                <motion.div
                                    key={category.id}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => toggleCategory(category.id)}
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
                                                <span className="text-2xl">{category.icon}</span>
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: category.color }}
                                                />
                                            </div>
                                            <h3 className="font-semibold text-slate-900 mb-1">
                                                {category.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 line-clamp-2">
                                                {category.description}
                                            </p>
                                            <div className="mt-2">
                                                <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg capitalize">
                                                    {category.type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {filteredCategories.length === 0 && (
                        <div className="text-center py-12">
                            <Filter className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">No categories found</p>
                            <p className="text-sm text-slate-400 mt-2">Try adjusting your filters</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {importStatus ? (
                    <div className="pt-4 border-t border-slate-200">
                        <div className="mb-2 flex justify-between text-sm font-bold text-slate-700">
                            <span>Importing... ({importStatus.completed} / {importStatus.total})</span>
                            <span className="text-primary">{Math.round((importStatus.completed / importStatus.total) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                            <motion.div 
                                className="bg-primary h-2 rounded-full" 
                                initial={{ width: 0 }}
                                animate={{ width: `${(importStatus.completed / importStatus.total) * 100}%` }}
                                transition={{ ease: "easeOut" }}
                            />
                        </div>
                        <div className="flex gap-4 text-xs font-semibold">
                            <span className="text-emerald-600">{importStatus.success} Successful</span>
                            <span className="text-rose-600 flex-1 text-right">{importStatus.failed} Failed</span>
                        </div>
                    </div>
                ) : (
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
                            disabled={loading || selectedCategories.size === 0}
                            className="flex-1 gap-2"
                        >
                            <Download className="w-5 h-5" />
                            {loading ? 'Starting Import...' : `Import ${selectedCategories.size} Categories`}
                        </Button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
