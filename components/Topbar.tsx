'use client';

import { Search, Filter, Bell, Plus } from 'lucide-react';

interface TopbarProps {
  showAddButton?: boolean;
  addButtonLabel?: string;
  onAddClick?: () => void;
}

export default function Topbar({ showAddButton = false, addButtonLabel = 'Add', onAddClick }: TopbarProps) {
  return (
    <header className="flex items-center justify-between py-6 px-8 bg-transparent">
      <div className="flex items-center gap-4 flex-1">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search your text here..."
            className="w-full pl-11 pr-4 py-3 bg-white border-none rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pos-blue focus:ring-opacity-50 text-sm placeholder-gray-400"
          />
        </div>

        {/* Filters */}
        <button className="flex items-center gap-2 px-6 py-3 bg-white text-gray-500 rounded-2xl shadow-sm hover:bg-gray-50 hover:text-gray-700 transition-colors">
          <Filter size={18} />
          <span className="text-sm font-medium">Filters</span>
        </button>

        {/* Dynamic Add Button */}
        {showAddButton && (
          <button 
            onClick={onAddClick}
            className="flex items-center gap-2 px-6 py-3 bg-pos-sidebar text-white rounded-2xl shadow-md hover:bg-[#3f4857] transition-colors ml-2"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">{addButtonLabel}</span>
          </button>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-3.5 bg-pos-sidebar text-gray-300 rounded-2xl hover:text-white hover:bg-[#3f4857] transition-colors">
          <Bell size={20} />
          <span className="absolute top-3 right-3 w-2 h-2 bg-pos-accent rounded-full border-2 border-pos-sidebar"></span>
        </button>
      </div>
    </header>
  );
}
