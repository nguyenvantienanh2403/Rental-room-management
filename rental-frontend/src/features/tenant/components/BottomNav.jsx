import { Home, Receipt, Wrench, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'home', path: '/t', icon: Home, label: 'Trang chủ' },
    { id: 'invoices', path: '/t/invoices', icon: Receipt, label: 'Hóa đơn' },
    { id: 'issues', path: '/t/issues', icon: Wrench, label: 'Sự cố' },
    { id: 'profile', path: '/t/profile', icon: User, label: 'Cá nhân' }
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-6 py-2 pb-safe shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)]">
        <div className="max-w-md mx-auto flex justify-between items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/t' && location.pathname.startsWith(item.path));
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center w-16 h-12 transition-colors ${
                  isActive ? "text-primary" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div className={`relative p-1 rounded-full transition-all duration-300 ${isActive ? 'bg-primary/10 mb-0.5' : 'mb-1'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                </div>
                <span className={`text-[10px] font-medium transition-all duration-300 ${isActive ? 'opacity-100 transform translate-y-0' : 'opacity-80 transform translate-y-0.5'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar Navigation */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-black text-primary tracking-tight">Rental App</h1>
          <p className="text-xs text-slate-500 font-medium">Tenant Portal</p>
        </div>
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/t' && location.pathname.startsWith(item.path));
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="font-semibold text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
