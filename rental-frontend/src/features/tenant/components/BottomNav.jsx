import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Receipt, User, FileSignature, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'home', path: '/t', icon: Home, label: 'Trang chủ', exact: true },
    { id: 'invoices', path: '/t/invoices', icon: Receipt, label: 'Hóa đơn', exact: false },
    { id: 'contracts', path: '/t/contracts', icon: FileSignature, label: 'Hợp đồng', exact: false },
    { id: 'profile', path: '/t/profile', icon: User, label: 'Cá nhân', exact: false }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <>
      {/* Mobile Bottom Navigation (Glassmorphism) */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-[var(--color-tenant-primary)]/10 rounded-2xl flex justify-around items-center p-2 transition-all">
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`relative flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-300 ${
                  active 
                    ? 'text-white' 
                    : 'text-[var(--color-tenant-primary)]/50 hover:text-[var(--color-tenant-primary)]/80 hover:bg-white/50'
                }`}
              >
                {active && (
                  <div className="absolute inset-0 bg-[var(--color-tenant-primary)] rounded-xl shadow-lg -z-10 animate-in fade-in zoom-in duration-300" />
                )}
                <Icon 
                  className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110 -translate-y-0.5' : ''}`} 
                  strokeWidth={active ? 2.5 : 2} 
                />
                <span className={`text-[10px] mt-1 font-bold transition-all duration-300 ${active ? 'opacity-100' : 'opacity-80'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar (Premium Gradient & Hover effects) */}
      <div className="hidden md:flex flex-col w-[280px] fixed top-0 left-0 h-screen bg-white/80 backdrop-blur-3xl border-r border-white/40 shadow-2xl shadow-[var(--color-tenant-primary)]/5 z-40">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-tenant-primary)] to-[#5a2d6a] flex items-center justify-center text-white shadow-lg shadow-[var(--color-tenant-primary)]/30">
              <Home className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-[var(--color-tenant-primary)] to-[#5a2d6a] bg-clip-text text-transparent tracking-tight">Rental App</h1>
              <p className="text-xs font-bold text-[var(--color-tenant-primary)]/50 uppercase tracking-widest">Khách Thuê</p>
            </div>
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="px-6 mb-8">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--color-tenant-accent)]/20 to-transparent border border-[var(--color-tenant-accent)]/30 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-tenant-primary)]/5 flex items-center justify-center border border-[var(--color-tenant-primary)]/10 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-[var(--color-tenant-primary)]/40" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-tenant-primary)] leading-tight">{user.fullName || user.username}</h3>
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" /> Đã xác thực
                </span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 relative overflow-hidden group ${
                  active 
                    ? 'text-white shadow-lg shadow-[var(--color-tenant-primary)]/20' 
                    : 'text-[var(--color-tenant-primary)]/60 hover:text-[var(--color-tenant-primary)] hover:bg-[var(--color-tenant-primary)]/5'
                }`}
              >
                {active && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-tenant-primary)] to-[#5a2d6a] -z-10" />
                )}
                <Icon 
                  className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} 
                  strokeWidth={active ? 2.5 : 2} 
                />
                {item.label}
                {active && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-2xl font-bold text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
}
