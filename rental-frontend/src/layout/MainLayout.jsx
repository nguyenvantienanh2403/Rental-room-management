import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, Home, Users, Building, FileText, Bell, User as UserIcon, Key, UserCog } from "lucide-react";
import { authService } from "../services/auth.service";

export function MainLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const data = await authService.getMe();
        // Giả sử backend trả về data object chứa thông tin user
        setUser(data.data || data);
      } catch (error) {
        console.error("Lỗi lấy thông tin user:", error);
      }
    };
    fetchMe();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Tổng quan", icon: Home, path: "/dashboard" },
    { name: "Quản lý người dùng", icon: UserCog, path: "/users", adminOnly: true },
    { name: "Quản lý tòa nhà", icon: Building, path: "/buildings" },
    { name: "Quản lý phòng", icon: Home, path: "/rooms" },
    { name: "Khách thuê", icon: Users, path: "/tenants" },
    { name: "Hóa đơn", icon: FileText, path: "/invoices" },
  ];

  const isAdmin = user?.role?.name?.toLowerCase() === 'admin';

  return (
    <div className="flex h-screen bg-neutral text-neutral-foreground overflow-hidden">
      {/* Sidebar - Primary Color (Tím) */}
      <aside className="w-64 bg-primary text-neutral-foreground flex flex-col hidden md:flex">
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-foreground flex items-center gap-2">
            <Building className="h-6 w-6 text-tertiary" />
            Rental-Manager
          </h2>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto pb-4">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            return (
              <a
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                  window.location.pathname.startsWith(item.path) && item.path !== "#"
                    ? "bg-white/20 text-neutral-foreground font-medium border-l-4 border-tertiary" 
                    : "text-neutral-foreground/80 hover:bg-white/10 hover:text-neutral-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: '#FAFAFA' }}>
        {/* Topbar for mobile and extra actions */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 md:justify-end">
          <div className="md:hidden flex items-center gap-2 text-primary font-bold text-xl">
             <Building className="h-6 w-6 text-tertiary" /> Rental-Manager
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-600 hover:text-secondary transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center focus:outline-none hover:ring-2 hover:ring-primary/50 rounded-full transition-all"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="h-8 w-8 rounded-full object-cover border border-slate-200" title={user.username || "Avatar"} />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-neutral-foreground font-medium" title={user?.username || "Admin"}>
                    {user?.username ? user.username.substring(0, 2).toUpperCase() : 'AD'}
                  </div>
                )}
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{user?.username || "Tài khoản"}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || "Chưa có email"}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setIsDropdownOpen(false); navigate("/profile"); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-primary/10 hover:text-secondary flex items-center gap-3 transition-colors"
                    >
                      <UserIcon className="h-4 w-4 text-slate-400" /> Me
                    </button>
                    <button
                      onClick={() => { setIsDropdownOpen(false); navigate("/change-password"); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-primary/10 hover:text-secondary flex items-center gap-3 transition-colors"
                    >
                      <Key className="h-4 w-4 text-slate-400" /> Thay đổi mật khẩu
                    </button>
                  </div>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => { setIsDropdownOpen(false); handleLogout(); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-red-500" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
            {/* Logout on mobile */}
            <button onClick={handleLogout} className="md:hidden text-slate-600 hover:text-secondary">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 text-neutral-foreground">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
