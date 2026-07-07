'use client';

import { Eye, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-pos-bg flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex gap-16 items-center">
        {/* Left Side: Login Form */}
        <div className="w-full max-w-md">
          <div className="flex gap-4 mb-8">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#cde0ec] hover:bg-[#b8d2e2] rounded-2xl transition-colors">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              <span className="font-medium text-pos-text">Google</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#cde0ec] hover:bg-[#b8d2e2] rounded-2xl transition-colors">
              <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="w-5 h-5" />
              <span className="font-medium text-pos-text">Facebook</span>
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 mb-8 relative">
            <span className="bg-pos-bg px-4 relative z-10">You can sign in</span>
            <div className="absolute inset-0 flex items-center z-0">
              <div className="w-full border-t border-gray-300"></div>
            </div>
          </div>

          <form className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-11 pr-10 py-4 bg-white border-none rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pos-blue focus:ring-opacity-50 text-sm placeholder-gray-400"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                <CheckCircle2 size={18} />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <input
                type="password"
                placeholder="Password"
                className="w-full pl-11 pr-10 py-4 bg-white border-none rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pos-blue focus:ring-opacity-50 text-sm placeholder-gray-400"
              />
              <button type="button" className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                <Eye size={18} />
              </button>
            </div>

            <button
              type="button"
              className="w-full py-4 mt-6 bg-pos-sidebar text-white rounded-2xl shadow-md hover:bg-[#3f4857] transition-all transform hover:scale-[1.02] font-medium"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Right Side: Illustration (Using placeholder or CSS for now as we don't have the exact vector asset) */}
        <div className="hidden md:flex flex-1 items-center justify-center relative">
          {/* Recreating the illustration with CSS/SVG */}
          <div className="relative w-80 h-96">
            {/* Door Frame */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-80 bg-[#d1d5db] rounded-t-full flex items-end justify-center pb-2">
              {/* Door */}
              <div className="w-32 h-64 bg-white flex flex-col gap-2 p-2">
                 <div className="flex-1 flex gap-2"><div className="flex-1 border border-gray-200"></div><div className="flex-1 border border-gray-200"></div></div>
                 <div className="flex-1 flex gap-2"><div className="flex-1 border border-gray-200"></div><div className="flex-1 border border-gray-200"></div></div>
                 <div className="flex-1 flex gap-2"><div className="flex-1 border border-gray-200"></div><div className="flex-1 border border-gray-200"></div></div>
              </div>
            </div>
            {/* Person (simplified CSS representation) */}
            <div className="absolute bottom-0 right-10 flex flex-col items-center">
              <div className="w-8 h-8 bg-[#1f2937] rounded-full mb-1"></div>
              <div className="w-16 h-20 bg-pos-blue rounded-t-xl relative">
                <div className="absolute left-[-10px] top-6 w-14 h-4 bg-[#fca5a5] origin-right -rotate-45 rounded-full flex items-center">
                    <div className="w-4 h-4 bg-pos-blue rounded-full absolute -left-2 shadow"></div>
                </div>
              </div>
              <div className="flex gap-2 w-16 px-1">
                <div className="w-6 h-24 bg-[#1f2937]"></div>
                <div className="w-6 h-24 bg-[#1f2937]"></div>
              </div>
              <div className="flex gap-4 w-20 justify-center">
                <div className="w-8 h-3 bg-[#1f2937] rounded-full"></div>
                <div className="w-8 h-3 bg-[#1f2937] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
