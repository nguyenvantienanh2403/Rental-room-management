import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Home, Users, Building, FileText, Bell, User as UserIcon, Key, UserCog, Menu, X, DoorOpen } from "lucide-react";
import { authService } from "../services/auth.service";

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Đóng mobile menu khi chuyển trang
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const data = await authService.getMe();
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
    { name: "Quản lý phòng", icon: DoorOpen, path: "/rooms" },
    { name: "Khách thuê", icon: Users, path: "/tenants" },
    { name: "Hợp đồng", icon: FileText, path: "/contracts" },
    { name: "Hóa đơn", icon: FileText, path: "/invoices" },
  ];

  const isAdmin = user?.role?.name?.toLowerCase() === 'admin';

  return (
    <div className="flex h-screen bg-neutral text-neutral-foreground overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Primary Color (Tím) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary text-neutral-foreground flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-xl md:shadow-none ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-foreground flex items-center gap-2">
            <Building className="h-6 w-6 text-tertiary shrink-0" />
            <span className="truncate">Rental-Manager</span>
          </h2>
          {/* Close button for mobile */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-neutral-foreground hover:text-tertiary transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto pb-4">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            return (
              <a
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                  location.pathname.startsWith(item.path) && item.path !== "#"
                    ? "bg-white/20 text-neutral-foreground font-medium border-l-4 border-tertiary shadow-sm" 
                    : "text-neutral-foreground/80 hover:bg-white/10 hover:text-neutral-foreground"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.name}
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full" style={{ backgroundColor: '#FAFAFA' }}>
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 shadow-sm">
          {/* Mobile Menu Button & Logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2 text-primary font-bold text-lg sm:text-xl truncate">
               <Building className="h-5 w-5 sm:h-6 sm:w-6 text-tertiary shrink-0" /> 
               <span className="hidden sm:inline">Rental-Manager</span>
            </div>
          </div>
          
          <div className="hidden md:block font-medium text-slate-500">
            {/* Có thể đặt Breadcrumbs ở đây */}
          </div>

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            <button className="p-2 text-slate-600 hover:text-secondary hover:bg-slate-50 rounded-full transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            
            <div className="relative flex items-center gap-3" ref={dropdownRef}>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">{user?.username || "Tài khoản"}</p>
                <p className="text-xs text-slate-500">{isAdmin ? 'Quản trị viên' : 'Quản lý'}</p>
              </div>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center focus:outline-none hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 rounded-full transition-all"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-white shadow-sm" title={user.username || "Avatar"} />
                ) : (
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-secondary flex items-center justify-center text-neutral-foreground font-bold shadow-sm border-2 border-white" title={user?.username || "Admin"}>
                    {user?.username ? user.username.substring(0, 2).toUpperCase() : 'AD'}
                  </div>
                )}
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 transform origin-top-right transition-all">
                  <div className="px-4 py-3 border-b border-slate-50 sm:hidden">
                    <p className="text-sm font-bold text-slate-900">{user?.username || "Tài khoản"}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || "Chưa có email"}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setIsDropdownOpen(false); navigate("/profile"); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5 hover:text-primary font-medium flex items-center gap-3 transition-colors"
                    >
                      <UserIcon className="h-4 w-4 text-slate-400" /> Hồ sơ cá nhân
                    </button>
                    <button
                      onClick={() => { setIsDropdownOpen(false); navigate("/change-password"); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5 hover:text-primary font-medium flex items-center gap-3 transition-colors"
                    >
                      <Key className="h-4 w-4 text-slate-400" /> Thay đổi mật khẩu
                    </button>
                  </div>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => { setIsDropdownOpen(false); handleLogout(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-3 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-red-500" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 w-full text-neutral-foreground relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
