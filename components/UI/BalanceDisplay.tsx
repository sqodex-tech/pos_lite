'use client';

import React from 'react';

interface BalanceBreakdown {
    totalPurchases?: number;
    totalPayments?: number;
}

interface BalanceDisplayProps {
    balance: number;
    partyType: 'CUSTOMER' | 'SUPPLIER';
    showBreakdown?: boolean;
    balanceBreakdown?: BalanceBreakdown;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ 
    balance, 
    partyType, 
    showBreakdown = false, 
    balanceBreakdown,
    className = "",
    size = 'md'
}) => {
    const formatBalance = (amount: number, type: 'CUSTOMER' | 'SUPPLIER') => {
        if (type === 'CUSTOMER') {
            if (amount > 0) {
                return {
                    sign: '+',
                    color: 'text-rose-600',
                    text: `${amount.toFixed(2)} (Owes)`,
                    bgColor: 'bg-rose-50',
                    label: 'Receivable'
                };
            } else if (amount < 0) {
                return {
                    sign: '',
                    color: 'text-emerald-600',
                    text: `${Math.abs(amount).toFixed(2)} (Credit)`,
                    bgColor: 'bg-emerald-50',
                    label: 'Credit Balance'
                };
            }
        } else if (type === 'SUPPLIER') {
            if (amount < 0) {
                return {
                    sign: '',
                    color: 'text-orange-600',
                    text: `${Math.abs(amount).toFixed(2)} (Payable)`,
                    bgColor: 'bg-orange-50',
                    label: 'Account Payable'
                };
            } else if (amount > 0) {
                return {
                    sign: '+',
                    color: 'text-blue-600',
                    text: `${amount.toFixed(2)} (Prepaid)`,
                    bgColor: 'bg-blue-50',
                    label: 'Prepaid Expense'
                };
            }
        }

        return {
            sign: '',
            color: 'text-slate-600',
            text: `${Math.abs(amount).toFixed(2)}`,
            bgColor: 'bg-slate-50',
            label: 'Settled'
        };
    };

    const formatted = formatBalance(balance, partyType);

    const sizeConfig = {
        sm: {
            padding: 'p-2',
            amount: 'text-lg',
            label: 'text-[9px]',
            iconBox: 'w-8 h-8',
            icon: 'text-sm'
        },
        md: {
            padding: 'p-3',
            amount: 'text-xl',
            label: 'text-[10px]',
            iconBox: 'w-10 h-10',
            icon: 'text-lg'
        },
        lg: {
            padding: 'p-4',
            amount: 'text-2xl',
            label: 'text-xs',
            iconBox: 'w-12 h-12',
            icon: 'text-xl'
        }
    };
    
    const sc = sizeConfig[size];

    return (
        <div className={`${sc.padding} rounded-2xl border border-slate-100 transition-all ${formatted.bgColor} ${className}`}>
            <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                    <p className={`${sc.label} uppercase tracking-wider font-bold text-slate-400`}>
                        {formatted.label}
                    </p>
                    <p className={`${sc.amount} font-black ${formatted.color}`}>
                        {formatted.sign}Rs {formatted.text}
                    </p>
                </div>
                <div className={`${sc.iconBox} rounded-full flex items-center justify-center bg-white shadow-sm ${sc.icon}`}>
                    {partyType === 'CUSTOMER' ? '👤' : '🚛'}
                </div>
            </div>

            {showBreakdown && balanceBreakdown && (
                <div className="mt-4 pt-4 border-t border-white/50 space-y-2 text-xs font-bold text-slate-500">
                    <div className="flex justify-between">
                        <span className="opacity-60">Total {partyType === 'CUSTOMER' ? 'Sales' : 'Purchases'}</span>
                        <span>Rs {(balanceBreakdown.totalPurchases || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="opacity-60">Total Payments</span>
                        <span>Rs {(balanceBreakdown.totalPayments || 0).toFixed(2)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BalanceDisplay;
