"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/UI';

export default function APITestPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const [hasToken, setHasToken] = useState(false);

    useEffect(() => {
        setHasToken(!!localStorage.getItem('token'));
    }, []);

    const testConnection = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

            const response = await fetch(`${apiUrl}/tenants/plans`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            setResult({
                status: response.status,
                data: data,
                token: token ? 'Token exists' : 'No token',
                apiUrl: apiUrl
            });
        } catch (error: any) {
            setResult({
                error: error.message,
                token: localStorage.getItem('token') ? 'Token exists' : 'No token',
                apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'
            });
        } finally {
            setLoading(false);
            setHasToken(!!localStorage.getItem('token'));
        }
    };

    return (
        <div className="min-h-screen p-8 bg-slate-50 dark:bg-slate-800">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">API Connection Test</h1>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm mb-6">
                    <h2 className="text-lg font-bold mb-4">Configuration</h2>
                    <div className="space-y-2 text-sm">
                        <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}</p>
                        <p><strong>Token:</strong> {hasToken ? '✅ Present' : '❌ Missing'}</p>
                    </div>
                </div>

                <Button onClick={testConnection} disabled={loading} className="mb-6">
                    {loading ? 'Testing...' : 'Test API Connection'}
                </Button>

                {result && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold mb-4">Result</h2>
                        <pre className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg overflow-auto text-xs">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
