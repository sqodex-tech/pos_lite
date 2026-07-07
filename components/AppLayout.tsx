'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Do not show sidebar/topbar on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Determine topbar props based on route
  const getTopbarProps = () => {
    switch(pathname) {
      case '/customers':
        return { showAddButton: true, addButtonLabel: 'Add client' };
      case '/items':
      case '/new-item':
        return { showAddButton: true, addButtonLabel: 'Add Item' };
      case '/suppliers':
        return { showAddButton: true, addButtonLabel: 'Add supplier' };
      default:
        return { showAddButton: false };
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-pos-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar {...getTopbarProps()} />
        <main className="flex-1 overflow-y-auto px-8 pb-8 pt-4">
          {children}
        </main>
      </div>
    </div>
  );
}
