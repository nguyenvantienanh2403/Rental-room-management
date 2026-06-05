import { Outlet } from "react-router-dom";
import { BottomNav } from "../features/tenant/components/BottomNav";

export function TenantLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Navigation - Bottom on Mobile, Sidebar on Desktop */}
      <BottomNav />
      
      {/* Main Content Area */}
      <main className="flex-1 w-full md:max-w-4xl md:mx-auto lg:max-w-5xl xl:max-w-6xl h-screen overflow-y-auto pb-20 md:pb-0">
        <div className="w-full h-full relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
