import { useState, useEffect } from 'react';
import { 
  Receipt, FileText, CheckCircle2, AlertCircle, Eye,
  ChevronRight, Copy, ArrowRight, QrCode
} from 'lucide-react';
import { invoiceService } from '../../services/invoice.service';
import toast from 'react-hot-toast';
import { formatMoney, formatDate } from '../../utils/format';

export function TenantInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unpaid');
  
  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const response = await invoiceService.getAll();
      let data = response.data?.invoices || response.data?.data || response.data || [];
      // Sort newest first
      data = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInvoices(data);
    } catch (error) {
      toast.error("Không thể tải danh sách hóa đơn");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'issued':
        return { 
          color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', 
          icon: AlertCircle, label: 'Chưa thanh toán' 
        };
      case 'paid':
        return { 
          color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', 
          icon: CheckCircle2, label: 'Đã thanh toán' 
        };
      case 'cancelled':
        return { 
          color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', 
          icon: FileText, label: 'Đã hủy' 
        };
      default:
        return { 
          color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', 
          icon: FileText, label: 'Bản nháp' 
        };
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép!");
  };

  const unpaidInvoices = invoices.filter(inv => inv.status === 'issued');
  const otherInvoices = invoices.filter(inv => inv.status !== 'issued');
  
  const displayInvoices = activeTab === 'unpaid' ? unpaidInvoices : otherInvoices;

  const InvoiceCard = ({ invoice }) => {
    const status = getStatusConfig(invoice.status);
    const StatusIcon = status.icon;
    const isOverdue = invoice.status === 'issued' && new Date(invoice.dueDate) < new Date();

    return (
      <div 
        onClick={() => setSelectedInvoice(invoice)}
        className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-white shadow-xl shadow-[var(--color-tenant-primary)]/5 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
      >
        <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${status.bg} border-r ${status.border}`} />
        
        <div className="flex justify-between items-start mb-4 pl-3">
          <div>
            <h3 className="font-bold text-[var(--color-tenant-primary)] text-lg">Hóa đơn T{invoice.month}/{invoice.year}</h3>
            <p className="text-sm font-medium text-[var(--color-tenant-primary)]/50 mt-1">Phòng {invoice.contractId?.roomId?.name}</p>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${status.bg} ${status.color} border ${status.border} text-xs font-bold`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label}
          </div>
        </div>

        <div className="pl-3">
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-2xl md:text-3xl font-black text-[var(--color-tenant-primary)] tracking-tight">
              {formatMoney(invoice.totalAmount).replace('₫', '')}
            </span>
            <span className="text-lg font-bold text-[var(--color-tenant-primary)]/50">₫</span>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--color-tenant-primary)]/10 pt-4">
            <div className="text-sm font-medium">
              <span className="text-[var(--color-tenant-primary)]/50">Hạn: </span>
              <span className={`${isOverdue ? 'text-red-500 font-bold' : 'text-[var(--color-tenant-primary)]'}`}>
                {formatDate(invoice.dueDate)}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[var(--color-tenant-primary)]/5 flex items-center justify-center text-[var(--color-tenant-primary)] group-hover:bg-[var(--color-tenant-primary)] group-hover:text-white transition-colors">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--color-tenant-primary)] tracking-tight">Hóa đơn & Thanh toán</h1>
          <p className="text-[var(--color-tenant-primary)]/50 font-medium mt-1">Quản lý các khoản chi phí của bạn</p>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-white flex gap-1 relative z-10 w-full md:w-fit">
        <button
          onClick={() => setActiveTab('unpaid')}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 relative ${
            activeTab === 'unpaid' 
              ? 'text-[var(--color-tenant-primary)] bg-white shadow-md' 
              : 'text-[var(--color-tenant-primary)]/50 hover:bg-white/50'
          }`}
        >
          Cần thanh toán
          {unpaidInvoices.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'unpaid' ? 'bg-red-100 text-red-600' : 'bg-[var(--color-tenant-primary)]/10 text-[var(--color-tenant-primary)]'
            }`}>
              {unpaidInvoices.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
            activeTab === 'history' 
              ? 'text-[var(--color-tenant-primary)] bg-white shadow-md' 
              : 'text-[var(--color-tenant-primary)]/50 hover:bg-white/50'
          }`}
        >
          Lịch sử
        </button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white/40 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : displayInvoices.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-white shadow-xl shadow-[var(--color-tenant-primary)]/5 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-[var(--color-tenant-primary)]/5 text-[var(--color-tenant-primary)]/30 rounded-full flex items-center justify-center mb-6">
            <Receipt className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-[var(--color-tenant-primary)] mb-2">Trống</h3>
          <p className="text-[var(--color-tenant-primary)]/50 font-medium max-w-sm">
            {activeTab === 'unpaid' ? 'Bạn đã thanh toán tất cả hóa đơn. Tuyệt vời!' : 'Chưa có lịch sử thanh toán nào.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {displayInvoices.map(invoice => (
            <InvoiceCard key={invoice._id} invoice={invoice} />
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedInvoice && !isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[var(--color-tenant-primary)]/20 backdrop-blur-sm" onClick={() => setSelectedInvoice(null)} />
          <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-[var(--color-tenant-primary)] to-[#5a2d6a] p-6 text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-black">Hóa đơn T{selectedInvoice.month}</h3>
                  <p className="text-white/70 font-medium text-sm mt-1">Phòng {selectedInvoice.contractId?.roomId?.name}</p>
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <span className="sr-only">Close</span>
                  &times;
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/10`}>
                  {getStatusConfig(selectedInvoice.status).label}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
              {/* Line items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Tiền phòng</span>
                  <span className="font-bold text-slate-800">{formatMoney(selectedInvoice.roomCharge)}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Tiền điện</span>
                  <span className="font-bold text-slate-800">{formatMoney(selectedInvoice.electricityTotal)}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Tiền nước</span>
                  <span className="font-bold text-slate-800">{formatMoney(selectedInvoice.waterTotal)}</span>
                </div>
                
                {selectedInvoice.otherFees?.map((fee, idx) => (
                  <div key={idx} className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">{fee.name}</span>
                    <span className="font-bold text-slate-800">{formatMoney(fee.amount)}</span>
                  </div>
                ))}
                
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Giảm giá</span>
                    <span className="font-bold text-red-500">-{formatMoney(selectedInvoice.discount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-6 border-t border-slate-100">
              <div className="flex justify-between items-end mb-6">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Tổng cộng</span>
                <span className="text-3xl font-black text-[var(--color-tenant-primary)] tracking-tight">{formatMoney(selectedInvoice.totalAmount)}</span>
              </div>
              
              {selectedInvoice.status === 'issued' && (
                <button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full bg-[var(--color-tenant-primary)] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[var(--color-tenant-primary-hover)] shadow-xl shadow-[var(--color-tenant-primary)]/30 transition-all flex justify-center items-center gap-2"
                >
                  <QrCode className="w-5 h-5" /> Thanh toán ngay
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL (VietQR) */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            
            <div className="p-6 text-center relative border-b border-slate-100">
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                &times;
              </button>
              <h3 className="text-xl font-black text-[var(--color-tenant-primary)]">Thanh toán chuyển khoản</h3>
              <p className="text-slate-500 text-sm mt-1">Quét mã QR qua ứng dụng ngân hàng</p>
            </div>

            <div className="p-6 md:p-8">
              {(() => {
                const landlord = selectedInvoice.contractId?.roomId?.buildingId?.landlordId;
                const bankInfo = landlord?.bankInfo;
                
                if (!bankInfo || !bankInfo.bankId || !bankInfo.accountNumber) {
                  return (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-slate-800 mb-2">Chưa có thông tin ngân hàng</h4>
                      <p className="text-slate-500 text-sm">Chủ trọ chưa cấu hình thông tin nhận thanh toán. Vui lòng liên hệ trực tiếp.</p>
                    </div>
                  );
                }

                const qrUrl = `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNumber}-compact2.png?amount=${selectedInvoice.totalAmount}&addInfo=Thanh toan tien phong T${selectedInvoice.month} phong ${selectedInvoice.contractId?.roomId?.name}&accountName=${encodeURIComponent(bankInfo.accountName || landlord.fullName)}`;

                return (
                  <>
                    <div className="flex justify-center mb-8">
                      <div className="bg-white p-3 rounded-3xl shadow-2xl shadow-[var(--color-tenant-primary)]/10 border border-slate-100 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-tenant-primary)] to-[#5a2d6a] opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity"></div>
                        <img 
                          src={qrUrl} 
                          alt="VietQR" 
                          className="w-56 h-56 object-contain rounded-2xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-8">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ngân hàng</p>
                        <p className="font-bold text-[var(--color-tenant-primary)]">{bankInfo.bankId}</p>
                      </div>
                      
                      <div className="flex items-center justify-between group">
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Số tài khoản</p>
                          <p className="font-bold text-[var(--color-tenant-primary)] text-lg tracking-wider">{bankInfo.accountNumber}</p>
                        </div>
                        <button 
                          onClick={() => handleCopy(bankInfo.accountNumber)}
                          className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:text-[var(--color-tenant-primary)] hover:border-[var(--color-tenant-primary)]/30 transition-colors shadow-sm"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Chủ tài khoản</p>
                        <p className="font-bold text-[var(--color-tenant-primary)]">{bankInfo.accountName || landlord.fullName}</p>
                      </div>

                      <div className="flex items-center justify-between group pt-4 border-t border-slate-200">
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Số tiền</p>
                          <p className="font-black text-xl text-[var(--color-tenant-primary)] tracking-tight">{formatMoney(selectedInvoice.totalAmount)}</p>
                        </div>
                        <button 
                          onClick={() => handleCopy(selectedInvoice.totalAmount.toString())}
                          className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:text-[var(--color-tenant-primary)] hover:border-[var(--color-tenant-primary)]/30 transition-colors shadow-sm"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        toast.success('Hệ thống sẽ cập nhật sau khi nhận được thông báo từ ngân hàng.');
                        setIsPaymentModalOpen(false);
                      }}
                      className="w-full bg-[var(--color-tenant-primary)] text-white font-bold py-4 rounded-2xl hover:bg-[var(--color-tenant-primary-hover)] transition-colors shadow-xl shadow-[var(--color-tenant-primary)]/20"
                    >
                      Xong
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
