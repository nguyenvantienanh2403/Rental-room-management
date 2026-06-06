import { useState, useEffect } from "react";
import { Receipt, FileText, CheckCircle2, AlertCircle, Eye, Calendar, DollarSign, ArrowLeft, QrCode, Copy } from "lucide-react";
import { invoiceService } from "../../services/invoice.service";
import toast from "react-hot-toast";

export function TenantInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await invoiceService.getAll();
        const list = Array.isArray(res) ? res : (res?.data?.invoices || res?.data || []);
        // Sort descending by created date
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setInvoices(list);
      } catch (err) {
        toast.error("Không thể tải danh sách hóa đơn");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const unpaidInvoices = invoices.filter(i => i.status === 'issued');
  const otherInvoices = invoices.filter(i => i.status !== 'issued');

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'issued':
        return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertCircle, label: 'Chưa thanh toán' };
      case 'paid':
        return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2, label: 'Đã thanh toán' };
      case 'cancelled':
        return { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', icon: FileText, label: 'Đã hủy' };
      default:
        return { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', icon: FileText, label: 'Bản nháp' };
    }
  };

  const InvoiceCard = ({ invoice }) => {
    const statusConfig = getStatusConfig(invoice.status);
    const StatusIcon = statusConfig.icon;

    return (
      <div 
        onClick={() => setSelectedInvoice(invoice)}
        className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className={`absolute top-0 left-0 w-1.5 h-full ${statusConfig.bg}`}></div>
        
        <div className="flex justify-between items-start mb-4 pl-2">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Hóa đơn tháng {invoice.month}/{invoice.year}</h3>
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
              <Calendar className="w-3.5 h-3.5" /> Hạn: {new Date(invoice.dueDate).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border ${statusConfig.border} ${statusConfig.bg} ${statusConfig.color} text-xs font-semibold`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusConfig.label}
          </div>
        </div>

        <div className="pl-2 border-t border-slate-50 pt-4 flex justify-between items-end">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Tổng cộng</p>
            <p className="text-2xl font-bold text-slate-800">{formatMoney(invoice.totalAmount)}</p>
          </div>
          <button className="flex items-center gap-1 text-sm font-semibold text-primary group-hover:text-primary-hover transition-colors">
            <Eye className="w-4 h-4" /> Chi tiết
          </button>
        </div>
      </div>
    );
  };

  const DetailModal = () => {
    if (!selectedInvoice) return null;
    const inv = selectedInvoice;
    const statusConfig = getStatusConfig(inv.status);

    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-primary p-6 text-white relative">
            <button 
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-1">Chi tiết Hóa đơn</h2>
            <p className="opacity-90 font-medium">Tháng {inv.month}/{inv.year}</p>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className={`p-4 rounded-xl flex items-center justify-between mb-6 ${statusConfig.bg} border ${statusConfig.border}`}>
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Trạng thái</p>
                <p className={`font-bold flex items-center gap-1.5 ${statusConfig.color}`}>
                  <statusConfig.icon className="w-4 h-4" /> {statusConfig.label}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 font-medium mb-1">Hạn thanh toán</p>
                <p className="font-bold text-slate-700">{new Date(inv.dueDate).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Receipt className="w-5 h-5 text-primary" /> Chi tiết khoản thu
              </h3>
              
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-slate-600">Tiền phòng</span>
                <span className="font-semibold text-slate-800">{formatMoney(inv.roomCharge)}</span>
              </div>
              
              {inv.electricityTotal > 0 && (
                <div className="flex justify-between items-center py-2 text-sm border-t border-slate-50">
                  <span className="text-slate-600">Tiền điện</span>
                  <span className="font-semibold text-slate-800">{formatMoney(inv.electricityTotal)}</span>
                </div>
              )}
              
              {inv.waterTotal > 0 && (
                <div className="flex justify-between items-center py-2 text-sm border-t border-slate-50">
                  <span className="text-slate-600">Tiền nước</span>
                  <span className="font-semibold text-slate-800">{formatMoney(inv.waterTotal)}</span>
                </div>
              )}
              
              {inv.otherFees?.map((fee, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 text-sm border-t border-slate-50">
                  <span className="text-slate-600">{fee.name}</span>
                  <span className="font-semibold text-slate-800">{formatMoney(fee.amount)}</span>
                </div>
              ))}
              
              {inv.discount > 0 && (
                <div className="flex justify-between items-center py-2 text-sm border-t border-slate-50 text-green-600">
                  <span>Giảm giá</span>
                  <span className="font-semibold">-{formatMoney(inv.discount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-medium">Tổng thanh toán</span>
              <span className="text-3xl font-black text-primary">{formatMoney(inv.totalAmount)}</span>
            </div>
            
            {inv.status === 'issued' && (
              <button 
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 transition-all flex justify-center items-center gap-2"
              >
                <DollarSign className="w-5 h-5" /> Thanh toán ngay
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const PaymentModal = () => {
    if (!selectedInvoice) return null;
    const inv = selectedInvoice;
    const landlord = inv.contractId?.roomId?.buildingId?.landlordId;
    const bankInfo = landlord?.bankInfo;
    const roomName = inv.contractId?.roomId?.name;

    const qrMessage = `Thanh toan HD ${inv.month} ${inv.year} phong ${roomName}`;
    
    // Using VietQR API standard format
    // https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-compact2.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<ACCOUNT_NAME>
    const qrUrl = bankInfo?.bankId && bankInfo?.accountNumber 
      ? `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNumber}-compact2.png?amount=${inv.totalAmount}&addInfo=${encodeURIComponent(qrMessage)}&accountName=${encodeURIComponent(bankInfo.accountName || '')}`
      : null;

    const copyToClipboard = (text, label) => {
      navigator.clipboard.writeText(text);
      toast.success(`Đã sao chép ${label}!`);
    };

    return (
      <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-primary p-5 text-white relative flex justify-center items-center">
            <button 
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold flex items-center gap-2"><QrCode className="w-5 h-5" /> Thanh toán</h2>
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col items-center text-center">
            {qrUrl ? (
              <>
                <p className="text-slate-500 text-sm mb-4">Quét mã QR dưới đây bằng ứng dụng ngân hàng để thanh toán</p>
                <div className="bg-white p-2 border-2 border-primary/20 rounded-2xl mb-6 shadow-sm">
                  <img src={qrUrl} alt="VietQR Code" className="w-64 h-64 object-contain" />
                </div>
                
                <div className="w-full space-y-3 text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-0.5">Ngân hàng</p>
                    <p className="font-bold text-slate-800">{bankInfo.bankId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-0.5">Tên tài khoản</p>
                    <p className="font-bold text-slate-800 uppercase">{bankInfo.accountName}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-medium mb-0.5">Số tài khoản</p>
                      <p className="font-bold text-primary text-lg">{bankInfo.accountNumber}</p>
                    </div>
                    <button onClick={() => copyToClipboard(bankInfo.accountNumber, "Số tài khoản")} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-600 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <div>
                      <p className="text-xs text-slate-400 font-medium mb-0.5">Nội dung CK</p>
                      <p className="font-mono font-medium text-slate-700 text-sm">{qrMessage}</p>
                    </div>
                    <button onClick={() => copyToClipboard(qrMessage, "Nội dung")} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-600 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 w-full">
                  <button 
                    onClick={() => {
                      toast.success("Hệ thống đã ghi nhận yêu cầu. Chủ trọ sẽ kiểm tra và cập nhật hóa đơn của bạn!");
                      setIsPaymentModalOpen(false);
                      setSelectedInvoice(null);
                    }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl transition-colors"
                  >
                    Tôi đã chuyển khoản
                  </button>
                </div>
              </>
            ) : (
              <div className="py-8">
                <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Chưa cấu hình thanh toán</h3>
                <p className="text-slate-500 text-sm">Chủ trọ chưa cập nhật thông tin Ngân hàng nhận tiền. Vui lòng liên hệ trực tiếp Chủ trọ để thanh toán.</p>
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="mt-6 w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full pt-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-4 sm:px-6 w-full max-w-md mx-auto md:max-w-none">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Quản lý Hóa đơn</h1>
        <p className="text-slate-500 text-sm">Theo dõi chi phí thuê phòng của bạn</p>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Chưa có hóa đơn nào</h3>
          <p className="text-slate-500 text-sm">Bạn hiện không có hóa đơn nào trong hệ thống.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {unpaidInvoices.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Cần thanh toán</h2>
              <div className="space-y-4">
                {unpaidInvoices.map(inv => (
                  <InvoiceCard key={inv._id} invoice={inv} />
                ))}
              </div>
            </section>
          )}

          {otherInvoices.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Lịch sử hóa đơn</h2>
              <div className="space-y-4">
                {otherInvoices.map(inv => (
                  <InvoiceCard key={inv._id} invoice={inv} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {selectedInvoice && !isPaymentModalOpen && <DetailModal />}
      {isPaymentModalOpen && <PaymentModal />}
    </div>
  );
}
