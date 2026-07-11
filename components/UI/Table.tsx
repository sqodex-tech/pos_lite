"use client";

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
}

export function Table<T>({
    columns,
    data,
    isLoading,
    onRowClick,
    emptyMessage = "No data found."
}: TableProps<T>) {
    return (
        <div className="w-full overflow-hidden border border-slate-100 rounded-[2rem] bg-white shadow-premium">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            {columns.map((column, idx) => (
                                <th
                                    key={idx}
                                    className={cn(
                                        "px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100",
                                        column.className
                                    )}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    {columns.map((_, j) => (
                                        <td key={j} className="px-6 py-5">
                                            <div className="h-4 bg-slate-100 rounded-lg w-full" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 font-medium">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item, idx) => (
                                <tr
                                    key={idx}
                                    onClick={() => onRowClick?.(item)}
                                    className={cn(
                                        "group transition-all hover:bg-slate-50/50 cursor-pointer",
                                        onRowClick && "active:scale-[0.99] active:bg-slate-100"
                                    )}
                                >
                                    {columns.map((column, colIdx) => (
                                        <td
                                            key={colIdx}
                                            className={cn(
                                                "px-6 py-5 text-sm font-semibold text-slate-600 transition-colors group-hover:text-slate-900 border-b border-slate-50",
                                                column.className
                                            )}
                                        >
                                            {typeof column.accessor === 'function'
                                                ? column.accessor(item)
                                                : (item[column.accessor] as React.ReactNode)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
