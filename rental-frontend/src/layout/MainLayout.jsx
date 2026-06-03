import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, Home, Users, Building, FileText, Bell } from "lucide-react";
import { authService } from "../services/auth.service";

export function MainLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Tổng quan", icon: Home, path: "/dashboard" },
    { name: "Quản lý tòa nhà", icon: Building, path: "#" },
    { name: "Khách thuê", icon: Users, path: "#" },
    { name: "Hóa đơn", icon: FileText, path: "#" },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Primary Color (Tím) */}
      <aside className="w-64 bg-primary text-white flex flex-col hidden md:flex">
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building className="h-6 w-6" />
            RentalPro
          </h2>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                item.path === "/dashboard" 
                  ? "bg-white/20 text-white font-medium" 
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-white/80 hover:bg-white/10 hover:text-white transition-colors hover:text-secondary"
          >
            <LogOut className="h-5 w-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar for mobile and extra actions */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 md:justify-end">
          <div className="md:hidden flex items-center gap-2 text-primary font-bold text-xl">
             <Building className="h-6 w-6" /> RentalPro
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-primary transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-white font-medium">
              AD
            </div>
            {/* Logout on mobile */}
            <button onClick={handleLogout} className="md:hidden text-slate-500 hover:text-secondary">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page Content - Neutral Background */}
        <main className="flex-1 overflow-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
