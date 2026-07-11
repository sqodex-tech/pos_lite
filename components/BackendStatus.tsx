"use client";

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/axios';

export function BackendStatus() {
    const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        checkBackend();
        const interval = setInterval(checkBackend, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const checkBackend = async () => {
        try {
            await api.get('/tenants/plans');
            setStatus('connected');
            setShowBanner(false);
        } catch (error: any) {
            if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
                setStatus('disconnected');
                setShowBanner(true);
            } else {
                // Other errors (like 401) mean backend is running
                setStatus('connected');
                setShowBanner(false);
            }
        }
    };

    if (!showBanner) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-rose-500 text-white px-4 py-3 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5" />
                    <div>
                        <p className="font-bold text-sm">Backend API Not Connected</p>
                        <p className="text-xs opacity-90">
                            Please start the backend server on port 5001. Run: <code className="bg-rose-600 px-2 py-0.5 rounded">npm run dev</code>
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowBanner(false)}
                    className="text-white hover:bg-rose-600 px-3 py-1 rounded-lg text-sm"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
}
