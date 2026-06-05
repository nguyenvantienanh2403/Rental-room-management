import { Receipt, AlertCircle, ChevronRight, QrCode } from "lucide-react";

export function BillCard({ invoice, onPayClick }) {
  if (!invoice) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center py-8">
        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
          <Receipt className="w-6 h-6 text-green-500" />
        </div>
        <h3 className="font-bold text-slate-800">Không có nợ cước</h3>
        <p className="text-sm text-slate-500 mt-1">Tuyệt vời! Bạn đã thanh toán đầy đủ các hóa đơn.</p>
      </div>
    );
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const isOverdue = new Date(invoice.dueDate) < new Date();

  return (
    <div className="bg-gradient-to-br from-primary/90 to-primary text-white rounded-2xl p-5 shadow-lg shadow-primary/20 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-black/10 rounded-full blur-xl"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
            <Receipt className="w-3.5 h-3.5" />
            Hóa đơn Tháng {invoice.month}/{invoice.year}
          </div>
          {isOverdue && (
            <div className="flex items-center gap-1 bg-red-500/90 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse">
              <AlertCircle className="w-3 h-3" />
              Quá hạn
            </div>
          )}
        </div>

        <div className="mb-6">
          <p className="text-primary-50 text-sm mb-1 font-medium">Tổng tiền cần thanh toán</p>
          <div className="flex items-baseline gap-1">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{formatMoney(invoice.totalAmount)}</h2>
          </div>
          <p className="text-xs text-white/80 mt-1.5 flex items-center gap-1">
            Hạn đóng: <span className="font-semibold text-white">{new Date(invoice.dueDate).toLocaleDateString('vi-VN')}</span>
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => onPayClick(invoice)}
            className="flex-1 bg-white text-primary font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm active:scale-[0.98]"
          >
            <QrCode className="w-5 h-5" />
            Thanh toán ngay
          </button>
          <button className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors backdrop-blur-sm border border-white/20">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
