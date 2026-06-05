import { useState, useEffect } from "react";
import { BillCard } from "../../features/tenant/components/BillCard";
import { UsageChart } from "../../features/tenant/components/UsageChart";
import { Bell, UserCircle2, ShieldCheck, HelpCircle, LogOut, User as UserIcon, Home as HomeIcon } from "lucide-react";
import { authService } from "../../services/auth.service";
import { invoiceService } from "../../services/invoice.service";
import { meterReadingService } from "../../services/meterReading.service";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export function TenantDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user profile
        const userRes = await authService.getMe();
        const userData = userRes?.data || userRes;
        setUser(userData);

        // Fetch unpaid invoice and usage history concurrently
        // Assuming the backend filters data based on the logged-in user's token
        const [invoicesRes, meterRes] = await Promise.all([
          invoiceService.getAll({ status: 'issued' }),
          meterReadingService.getAll()
        ]);

        const invoiceList = Array.isArray(invoicesRes) ? invoicesRes : (invoicesRes?.data?.invoices || invoicesRes?.data || []);
        const meterList = Array.isArray(meterRes) ? meterRes : (meterRes?.data?.readings || meterRes?.data || []);

        // Sort invoices by dueDate ascending, pick the most urgent unpaid one
        if (invoiceList.length > 0) {
          invoiceList.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
          setInvoice(invoiceList[0]);
        }

        // Process meter readings for chart (last 6 months)
        if (meterList.length > 0) {
          // Sort by year desc, month desc
          meterList.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
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

      } catch (error) {
        toast.error("Không thể tải dữ liệu. Vui lòng thử lại sau.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handlePayClick = (inv) => {
    toast.success("Tính năng hiển thị mã VietQR đang được phát triển!");
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="h-10 w-40 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
        </div>
        <div className="h-48 bg-slate-200 rounded-2xl"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-4 sm:px-6 w-full max-w-md mx-auto md:max-w-none md:grid md:grid-cols-12 md:gap-8">
      {/* Header section (Mobile full width, Desktop span full) */}
      <div className="flex justify-between items-center mb-6 md:col-span-12">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Xin chào, {user?.fullName || user?.username || "Khách"} 👋</h1>
          <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            Khách thuê
          </p>
        </div>
        <div className="flex items-center gap-3 relative">
          <button 
            onClick={() => navigate("/")}
            className="p-2 bg-white rounded-full shadow-sm border border-slate-100 text-slate-600 hover:text-primary transition-colors relative"
            title="Về trang chủ RentalMarket"
          >
            <HomeIcon className="w-5 h-5" />
          </button>
          <button className="p-2 bg-white rounded-full shadow-sm border border-slate-100 text-slate-600 hover:text-primary transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center focus:outline-none hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 rounded-full transition-all"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shadow-sm border-2 border-white">
                {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'KT'}
              </div>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 transform origin-top-right transition-all">
              <div className="px-4 py-3 border-b border-slate-50">
                <p className="text-sm font-bold text-slate-900">{user?.fullName || "Khách Thuê"}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || "Chưa có email"}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setIsDropdownOpen(false); navigate("/t/profile"); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5 hover:text-primary font-medium flex items-center gap-3 transition-colors"
                >
                  <UserIcon className="h-4 w-4 text-slate-400" /> Hồ sơ cá nhân
                </button>
                <button
                  onClick={() => { setIsDropdownOpen(false); navigate("/"); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5 hover:text-primary font-medium flex items-center gap-3 transition-colors"
                >
                  <HomeIcon className="h-4 w-4 text-slate-400" /> Trang chủ RentalMarket
                </button>
              </div>
              <div className="py-1 border-t border-slate-50">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-3 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-red-400" /> Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 md:space-y-0 md:col-span-12 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {/* Unpaid Bill Card */}
        <section className="lg:col-span-1">
          <div className="flex justify-between items-end mb-3 px-1">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Hóa đơn nợ</h2>
          </div>
          <BillCard invoice={invoice} onPayClick={handlePayClick} />
        </section>

        {/* Usage Chart */}
        <section className="lg:col-span-1">
          <div className="flex justify-between items-end mb-3 px-1">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Thống kê tiêu thụ</h2>
          </div>
          <UsageChart data={chartData} />
        </section>

        {/* Quick Actions */}
        <section className="lg:col-span-1">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 px-1">Tiện ích nhanh</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4 h-[calc(100%-2rem)]">
            <button className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors h-full min-h-[120px]">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-slate-700">Gửi hỗ trợ</span>
            </button>
            <button className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors h-full min-h-[120px]">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCircle2 className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-slate-700">Giấy tờ số</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
