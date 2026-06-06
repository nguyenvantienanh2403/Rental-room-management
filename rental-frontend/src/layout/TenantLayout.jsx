import { Outlet } from "react-router-dom";
import { BottomNav } from "../features/tenant/components/BottomNav";

export function TenantLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-tenant-accent)]/30 via-white to-[var(--color-tenant-accent)]/10 font-sans text-[var(--color-tenant-primary)] selection:bg-[var(--color-tenant-accent)] selection:text-[var(--color-tenant-primary)] overflow-x-hidden">
      <div className="flex flex-col md:flex-row h-full min-h-screen relative">
        <BottomNav />
        
        {/* Main Content Area */}
        <main className="flex-1 w-full md:pl-[280px]">
          <div className="h-full min-h-screen max-w-5xl mx-auto pb-24 md:pb-8 pt-4 px-4 sm:px-6 md:px-8 transition-all duration-300 ease-in-out">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
