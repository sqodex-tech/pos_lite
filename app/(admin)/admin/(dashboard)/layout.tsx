import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AuthGuard from "@/components/admin/AuthGuard";
import AdminPageTransition from "@/components/admin/AdminPageTransition";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden w-full">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden w-full">
          <Header />
          <main className="flex-1 overflow-y-auto w-full p-8 bg-slate-50/50 dark:bg-slate-900/50">
            <AdminPageTransition>
              {children}
            </AdminPageTransition>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
