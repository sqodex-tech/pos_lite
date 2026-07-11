"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
    value: string;
    label: string;
    icon?: string;
    color?: string;
    description?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    allowClear?: boolean;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    label,
    error,
    required,
    disabled,
    allowClear = true
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(search.toLowerCase()) ||
        option.description?.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => 
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredOptions[highlightedIndex]) {
                    onChange(filteredOptions[highlightedIndex].value);
                    setIsOpen(false);
                    setSearch('');
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSearch('');
                break;
        }
    };

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearch('');
        setHighlightedIndex(0);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div className="space-y-1.5 w-full" ref={containerRef}>
            {label && (
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
            )}
            
            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className={`
                        w-full bg-slate-50 dark:bg-slate-800 border rounded-2xl py-3 px-4 outline-none transition-all
                        flex items-center justify-between gap-2
                        ${isOpen ? 'bg-white dark:bg-slate-900 ring-4 ring-primary/10 border-primary' : 'border-slate-100 dark:border-slate-800'}
                        ${error ? 'border-rose-500 focus:ring-rose-500/10' : ''}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white dark:hover:bg-slate-900 cursor-pointer'}
                    `}
                >
                    <div className="flex items-center gap-2 flex-1 text-left">
                        {selectedOption ? (
                            <>
                                {selectedOption.icon && (
                                    <span className="text-lg">{selectedOption.icon}</span>
                                )}
                                {selectedOption.color && (
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: selectedOption.color }}
                                    />
                                )}
                                <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                                    {selectedOption.label}
                                </span>
                            </>
                        ) : (
                            <span className="text-slate-400">{placeholder}</span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                        {allowClear && value && !disabled && (
                            <div
                                onClick={handleClear}
                                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </div>
                        )}
                        <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform ${
                                isOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </div>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden"
                        >
                            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setHighlightedIndex(0);
                                        }}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Search..."
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm text-slate-700 dark:text-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="max-h-64 overflow-y-auto">
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((option, index) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => handleSelect(option.value)}
                                            onMouseEnter={() => setHighlightedIndex(index)}
                                            className={`
                                                w-full px-4 py-3 flex items-center gap-3 transition-colors text-left
                                                ${highlightedIndex === index ? 'bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}
                                                ${value === option.value ? 'bg-primary/10' : ''}
                                            `}
                                        >
                                            {option.icon && (
                                                <span className="text-lg flex-shrink-0">{option.icon}</span>
                                            )}
                                            {option.color && (
                                                <div
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: option.color }}
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                                    {option.label}
                                                </div>
                                                {option.description && (
                                                    <div className="text-xs text-slate-500 truncate">
                                                        {option.description}
                                                    </div>
                                                )}
                                            </div>
                                            {value === option.value && (
                                                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-center text-slate-400 text-sm">
                                        No options found
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {error && (
                <p className="text-xs font-bold text-rose-500 pl-1">{error}</p>
            )}
        </div>
    );
}
