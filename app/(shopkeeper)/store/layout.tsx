"use client";

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Navbar } from '@/components/Layout/Navbar';
import { BackendStatus } from '@/components/BackendStatus';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            router.push('/login');
            return;
        }

        try {
            const user = JSON.parse(userStr);

            // Check if tenant has subscription active
            // Allow access to /store/plans so they can activate it
            const isInactive = user.tenant && user.tenant.status !== 'active';
            const isPlansPage = pathname.startsWith('/store/plans');

            if (user.role === 'ADMIN' && isInactive && !isPlansPage) {
                router.push('/store/plans');
                return;
            }

            // Check if store is selected
            const storeId = localStorage.getItem('storeId');
            const isStorePage = pathname.startsWith('/store/stores');
            
            // If no store is selected, they should only be able to access plans, or stores page to create/select a store
            if (!storeId && !isPlansPage && !isStorePage) {
                // If they are an ADMIN, they can create/select a store
                if (user.role === 'ADMIN') {
                    router.push('/store/stores');
                    return;
                }
            }
        } catch (error) {
            console.error('Admin Layout - Error parsing user data:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
        }
    }, [router]);

    return (
        <>
            <BackendStatus />
            <div className="flex h-screen bg-background overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <Navbar />
                    <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}
