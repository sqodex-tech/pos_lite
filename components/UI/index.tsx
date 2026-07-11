"use client";

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export * from './AccessDenied';
export * from './Table';
export * from './Modal';
export * from './ThemeToggle';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export function Button({
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    children,
    ...props
}: ButtonProps) {
    const variants = {
        primary: "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20",
        secondary: "bg-secondary text-white hover:bg-blue-600 shadow-lg shadow-secondary/20",
        outline: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    };

    const sizes = {
        sm: "px-4 py-2 text-xs",
        md: "px-6 py-2.5 text-sm",
        lg: "px-8 py-3 text-base",
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading}
            {...props}
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : null}
            {children}
        </button>
    );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, ...props }: InputProps) {
    return (
        <div className="space-y-1.5 w-full">
            {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">{label}</label>}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    className={cn(
                        "w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-700 placeholder:text-slate-400",
                        icon && "pl-12",
                        error && "border-red-500 focus:ring-red-500/10 focus:border-red-500",
                        className
                    )}
                    {...props}
                />
            </div>
            {error && <p className="text-xs font-bold text-red-500 pl-1">{error}</p>}
        </div>
    );
}
