import { Calendar, ChevronRight, CheckCircle2, AlertCircle, Receipt, QrCode } from 'lucide-react';
import { formatMoney } from '../../../utils/format';

export function BillCard({ invoice, onPayClick }) {
  if (!invoice) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white shadow-xl shadow-[var(--color-tenant-primary)]/5 flex flex-col items-center justify-center text-center h-full min-h-[220px]">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-[var(--color-tenant-primary)] mb-1">Không có nợ cước</h3>
        <p className="text-[var(--color-tenant-primary)]/50 text-sm font-medium">Bạn đã thanh toán đầy đủ các hóa đơn hiện tại.</p>
      </div>
    );
  }

  const isOverdue = new Date(invoice.dueDate) < new Date();

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[var(--color-tenant-primary)] via-[#4a2654] to-[#5a2d6a] text-white shadow-2xl shadow-[var(--color-tenant-primary)]/30 group transition-transform duration-300 hover:-translate-y-1">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 rounded-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 rounded-full bg-black/10 blur-2xl" />
      <div className="absolute top-1/2 right-4 w-12 h-12 rounded-full border border-white/10" />
      <div className="absolute top-1/2 right-12 w-6 h-6 rounded-full border border-white/10" />

      <div className="relative z-10 flex flex-col h-full justify-between gap-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider mb-3">
              <Receipt className="w-3.5 h-3.5" />
              Hóa đơn tháng {invoice.month}/{invoice.year}
            </div>
            
            {isOverdue && (
              <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-1 rounded-md bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest animate-pulse shadow-lg shadow-red-500/20">
                <AlertCircle className="w-3 h-3" />
                Quá hạn thanh toán
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <div>
          <p className="text-white/60 text-sm font-medium mb-1">Tổng số tiền cần thanh toán</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl md:text-5xl font-black tracking-tight">{formatMoney(invoice.totalAmount).replace('₫', '')}</span>
            <span className="text-xl md:text-2xl font-bold text-white/60">₫</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-2 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
            <Calendar className="w-4 h-4" />
            Hạn: {new Date(invoice.dueDate).toLocaleDateString('vi-VN')}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => onPayClick(invoice)}
              className="flex items-center gap-2 bg-white text-[var(--color-tenant-primary)] px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <QrCode className="w-4 h-4" />
              Thanh toán
            </button>
            <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
