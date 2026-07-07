'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  PackagePlus, 
  Package, 
  Settings, 
  LogOut,
  Zap
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Customers', icon: Users, path: '/customers' },
  { name: 'Suppliers', icon: Truck, path: '/suppliers' },
  { name: 'New Item', icon: PackagePlus, path: '/new-item' },
  { name: 'All Items', icon: Package, path: '/items' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-pos-sidebar text-white h-screen flex flex-col rounded-r-[40px] overflow-hidden shadow-2xl flex-shrink-0 relative z-20">
      <div className="p-8 flex items-center gap-3">
        <div className="bg-pos-accent text-white p-1.5 rounded-full">
          <Zap size={20} fill="currentColor" />
        </div>
        <span className="text-xl font-bold tracking-wide">Logoipsum</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-in-out ${
                isActive 
                  ? 'bg-pos-white text-pos-text shadow-[0_4px_20px_rgba(0,0,0,0.1)] transform scale-[1.02]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-[#e5edf5]' : ''}`}>
                <Icon size={20} className={isActive ? 'text-pos-blue' : ''} />
              </div>
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <button className="flex items-center gap-4 px-4 py-3.5 w-full rounded-2xl border border-gray-600 text-gray-300 hover:bg-white/5 hover:text-white transition-all group">
          <div className="p-2 rounded-xl bg-white/10 group-hover:bg-white/20 transition-colors">
            <LogOut size={20} className="text-pos-accent" />
          </div>
          <span className="font-medium text-sm">Log out</span>
        </button>
      </div>
    </aside>
  );
}
