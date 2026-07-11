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
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ 
    balance, 
    partyType, 
    showBreakdown = false, 
    balanceBreakdown,
    className = "" 
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
                    sign: '-',
                    color: 'text-emerald-600',
                    text: `${Math.abs(amount).toFixed(2)} (Credit)`,
                    bgColor: 'bg-emerald-50',
                    label: 'Credit Balance'
                };
            }
        } else if (type === 'SUPPLIER') {
            if (amount < 0) {
                return {
                    sign: '-',
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

    return (
        <div className={`p-4 rounded-2xl border border-slate-100 transition-all ${formatted.bgColor} ${className}`}>
            <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        {formatted.label}
                    </p>
                    <p className={`text-2xl font-black ${formatted.color}`}>
                        {formatted.sign}${formatted.text}
                    </p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm text-lg`}>
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
