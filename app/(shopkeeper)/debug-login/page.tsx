"use client";

import React, { useState } from 'react';
import { authApi } from '@/lib/api/auth';

export default function DebugLoginPage() {
    const [email, setEmail] = useState('admin@store.com');
    const [password, setPassword] = useState('password123');
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
        console.log(message);
    };

    const testLogin = async () => {
        setLogs([]);
        setLoading(true);
        
        try {
            addLog('Starting login test...');
            addLog(`Email: ${email}`);
            addLog(`Password: ${password}`);
            
            addLog('Calling API...');
            const response = await authApi.login({ email, password });
            
            addLog('✓ API call successful');
            addLog(`Status: ${response.status}`);
            addLog(`Response data: ${JSON.stringify(response.data, null, 2)}`);
            
            const { user, accessToken } = response.data.data;
            
            addLog(`User ID: ${user._id}`);
            addLog(`User Name: ${user.name}`);
            addLog(`User Email: ${user.email}`);
            addLog(`User Role: ${user.role}`);
            addLog(`User Status: ${user.status}`);
            
            if (user.tenantId) {
                addLog(`Tenant ID: ${user.tenantId._id}`);
                addLog(`Tenant Name: ${user.tenantId.name}`);
                addLog(`Tenant Status: ${user.tenantId.status}`);
            } else {
                addLog('❌ No tenant data!');
            }
            
            addLog(`Access Token: ${accessToken ? '✓ Present' : '❌ Missing'}`);
            
            // Test localStorage
            addLog('Testing localStorage...');
            localStorage.setItem('test-token', accessToken);
            localStorage.setItem('test-user', JSON.stringify(user));
            
            const retrievedToken = localStorage.getItem('test-token');
            const retrievedUser = localStorage.getItem('test-user');
            
            addLog(`Token stored: ${retrievedToken ? '✓ Yes' : '❌ No'}`);
            addLog(`User stored: ${retrievedUser ? '✓ Yes' : '❌ No'}`);
            
            if (retrievedUser) {
                const parsedUser = JSON.parse(retrievedUser);
                addLog(`Parsed user role: ${parsedUser.role}`);
                addLog(`Parsed user tenantId: ${parsedUser.tenantId ? '✓ Present' : '❌ Missing'}`);
                if (parsedUser.tenantId) {
                    addLog(`Parsed tenant status: ${parsedUser.tenantId.status}`);
                }
            }
            
            // Test cookies
            addLog('Testing cookies...');
            document.cookie = `test-token=${accessToken}; path=/; max-age=3600`;
            document.cookie = `test-role=${user.role}; path=/; max-age=3600`;
            
            const cookies = document.cookie;
            addLog(`Cookies: ${cookies}`);
            
            addLog('✓ All tests passed!');
            addLog('You can now try the actual login page');
            
        } catch (error: any) {
            addLog('❌ Error occurred!');
            if (error.response) {
                addLog(`Status: ${error.response.status}`);
                addLog(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
            } else if (error.request) {
                addLog('No response from server');
                addLog('Is the backend running on port 5001?');
            } else {
                addLog(`Error: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const clearStorage = () => {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach(c => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        addLog('✓ Storage cleared');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-800 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Login Debug Tool</h1>
                
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Test Credentials</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border rounded"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border rounded"
                            />
                        </div>
                        
                        <div className="flex gap-4">
                            <button
                                onClick={testLogin}
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Testing...' : 'Test Login'}
                            </button>
                            
                            <button
                                onClick={clearStorage}
                                className="px-6 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
                            >
                                Clear Storage
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="bg-slate-900 rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Debug Logs</h2>
                    <div className="bg-black rounded p-4 font-mono text-sm text-green-400 h-96 overflow-y-auto">
                        {logs.length === 0 ? (
                            <div className="text-slate-500">Click "Test Login" to start debugging...</div>
                        ) : (
                            logs.map((log, index) => (
                                <div key={index} className="mb-1">{log}</div>
                            ))
                        )}
                    </div>
                </div>
                
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-bold text-yellow-900 mb-2">Instructions:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                        <li>Click "Test Login" to test the login API</li>
                        <li>Check the debug logs for any errors</li>
                        <li>If successful, try the actual login page at /login</li>
                        <li>If it fails, share the debug logs</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
