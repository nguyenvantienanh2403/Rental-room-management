import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HelpCircle, UserCircle2, Bell, ShieldCheck, ChevronRight, FileText, Activity, Wallet, Receipt } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { invoiceService } from '../../services/invoice.service';
import { meterReadingService } from '../../services/meterReading.service';
import toast from 'react-hot-toast';

import { BillCard } from '../../features/tenant/components/BillCard';
import { UsageChart } from '../../features/tenant/components/UsageChart';
import { NotificationDropdown } from '../../features/tenant/components/NotificationDropdown';
import { notificationService } from '../../services/notification.service';
import { formatMoney } from '../../utils/format';

export function TenantDashboard() {
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('Chào bạn');
  
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Chào buổi sáng');
    else if (hour < 18) setGreeting('Chào buổi chiều');
    else setGreeting('Chào buổi tối');

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // 1. Get unpaid invoices
        const invRes = await invoiceService.getAll({ status: 'issued' });
        const unpaid = invRes.data?.invoices || invRes.data || [];
        if (unpaid.length > 0) {

          // Sort by due date, pick the closest one
          const closest = unpaid.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
          setInvoice(closest);
        }

        // 3. Get meter readings for chart
        const meterRes = await meterReadingService.getAll();
        const meterList = meterRes.data?.readings || meterRes.data?.data || meterRes.data || [];
        
        if (Array.isArray(meterList) && meterList.length > 0) {
          // Sort by year, month descending
          meterList.sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            return b.month - a.month;
          });

          // Take last 6
          const last6 = meterList.slice(0, 6).reverse();
          const formattedChart = last6.map(r => ({
            month: `T${r.month}`,
            elec: (r.electricity?.newIndex || 0) - (r.electricity?.oldIndex || 0),
            water: (r.water?.newIndex || 0) - (r.water?.oldIndex || 0)
          }));
          setChartData(formattedChart);
        }

        // 4. Get unread notifications count
        try {
          const unreadRes = await notificationService.getUnreadCount();
          setUnreadCount(unreadRes.data?.count || unreadRes.data || 0);
        } catch (e) {
          console.error("Failed to load notifications count", e);
        }

      } catch (error) {
        toast.error("Không thể tải dữ liệu bảng điều khiển.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handlePayClick = (inv) => {
    navigate('/t/invoices');
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        <div className="h-40 bg-white/40 rounded-3xl"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="h-24 bg-white/40 rounded-2xl"></div>
          <div className="h-24 bg-white/40 rounded-2xl"></div>
          <div className="h-24 bg-white/40 rounded-2xl hidden md:block"></div>
        </div>
        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-5 h-80 bg-white/40 rounded-3xl"></div>
          <div className="md:col-span-7 h-80 bg-white/40 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* 1. Welcome Banner */}
      <div className="relative bg-gradient-to-br from-white to-slate-50/50 rounded-[2.5rem] p-6 md:p-10 shadow-2xl shadow-[var(--color-tenant-primary)]/5 border border-white mb-6 md:mb-8 flex flex-col md:flex-row justify-between md:items-center gap-6">
        
        {/* Abstract shapes */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-[var(--color-tenant-accent)] to-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[var(--color-tenant-primary)]/10 to-transparent rounded-full blur-3xl -z-10 -ml-10 -mb-10"></div>
        
        <div className="flex items-center gap-5 z-10 w-full md:w-auto">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[var(--color-tenant-primary)] to-[#5a2d6a] p-1 shadow-lg shadow-[var(--color-tenant-primary)]/20 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 className="w-10 h-10 text-[var(--color-tenant-primary)]/20" />
              )}
            </div>
          </div>
          <div>
            <p className="text-[var(--color-tenant-primary)]/60 font-bold text-sm md:text-base uppercase tracking-widest">{greeting},</p>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--color-tenant-primary)] tracking-tight leading-tight">
              {user?.fullName || user?.username || 'Khách hàng'}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--color-tenant-accent)]/30 text-[var(--color-tenant-primary)] text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Khách thuê
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 self-end md:self-center z-10 relative">
          <button 
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-[var(--color-tenant-primary)] hover:bg-slate-50 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
            )}
          </button>
          <NotificationDropdown isOpen={isNotificationOpen} onClose={() => { setIsNotificationOpen(false); setUnreadCount(0); }} />
        </div>
      </div>

      {/* 2. Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 border border-white shadow-xl shadow-[var(--color-tenant-primary)]/5 flex items-center gap-4 group hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--color-tenant-primary)]/50 uppercase tracking-wider mb-0.5">Công nợ</p>
            <p className="text-lg font-black text-[var(--color-tenant-primary)] leading-none">{invoice ? formatMoney(invoice.totalAmount).replace('₫', '') : '0'}<span className="text-sm">₫</span></p>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 border border-white shadow-xl shadow-[var(--color-tenant-primary)]/5 flex items-center gap-4 group hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-tenant-primary)]/5 text-[var(--color-tenant-primary)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--color-tenant-primary)]/50 uppercase tracking-wider mb-0.5">Trạng thái</p>
            <p className="text-sm font-black text-emerald-600 leading-none">Đang thuê</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 border border-white shadow-xl shadow-[var(--color-tenant-primary)]/5 flex items-center gap-4 group hover:-translate-y-1 transition-transform duration-300 col-span-2 md:col-span-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="flex-1 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-[var(--color-tenant-primary)]/50 uppercase tracking-wider mb-0.5">Hóa đơn</p>
              <p className="text-sm font-black text-[var(--color-tenant-primary)] leading-none">{invoice ? 'Cần thanh toán' : 'Đã thanh toán'}</p>
            </div>
            <Link to="/t/invoices" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[var(--color-tenant-primary)]/50 hover:bg-[var(--color-tenant-primary)] hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Main Content Grid */}
      <div className="grid md:grid-cols-12 gap-6 md:gap-8">
        
        {/* Unpaid Bill Section */}
        <section className="md:col-span-5 h-full">
          <BillCard invoice={invoice} onPayClick={handlePayClick} />
        </section>

        {/* Usage Chart Section */}
        <section className="md:col-span-7 h-full">
          <UsageChart data={chartData} />
        </section>
      </div>

      {/* 4. Quick Actions */}
      <section>
        <h2 className="text-sm font-black text-[var(--color-tenant-primary)] uppercase tracking-wider mb-4 px-2">Tiện ích nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Link to="/t/invoices" className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-lg shadow-[var(--color-tenant-primary)]/5 border border-white flex flex-col items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-[var(--color-tenant-primary)]">Hóa đơn</span>
          </Link>
          
          <Link to="/t/profile" className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-lg shadow-[var(--color-tenant-primary)]/5 border border-white flex flex-col items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-tenant-accent)]/30 text-[var(--color-tenant-primary)] flex items-center justify-center group-hover:scale-110 group-hover:bg-[var(--color-tenant-primary)] group-hover:text-white transition-all">
              <UserCircle2 className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-[var(--color-tenant-primary)]">Hồ sơ cá nhân</span>
          </Link>

          <Link to="/t/contracts" className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-lg shadow-[var(--color-tenant-primary)]/5 border border-white flex flex-col items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-[var(--color-tenant-primary)]">Hợp đồng</span>
          </Link>

          <button onClick={() => toast("Tính năng hỗ trợ đang phát triển")} className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-lg shadow-[var(--color-tenant-primary)]/5 border border-white flex flex-col items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-all">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-[var(--color-tenant-primary)]">Liên hệ hỗ trợ</span>
          </button>
        </div>
      </section>
    </div>
  );
}
