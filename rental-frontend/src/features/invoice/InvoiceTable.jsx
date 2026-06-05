import { Eye, Edit, FileDown, Calendar, DollarSign, Home } from "lucide-react";
import { Button } from "../../components/ui/Button";

export function InvoiceTable({ invoices, onView, onEdit }) {
  if (!invoices || invoices.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="h-16 w-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Chưa có hóa đơn nào</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          Danh sách hóa đơn đang trống. Hãy chốt số điện nước để tạo hóa đơn.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "draft":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Bản nháp</span>;
      case "issued":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Chưa thanh toán</span>;
      case "paid":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Đã thanh toán</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Không rõ</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    return d.toLocaleDateString("vi-VN");
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hợp đồng / Phòng</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Khách thuê</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Kỳ hóa đơn</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng tiền</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hạn thanh toán</th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {invoices.map((invoice) => (
              <tr key={invoice._id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-slate-900">{invoice.contractId?.contractCode || "N/A"}</div>
                  <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <Home className="w-3 h-3" /> P. {invoice.contractId?.roomId?.name || "N/A"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mr-3 border border-primary/20">
                      {(invoice.contractId?.tenantId?.fullName || "A").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{invoice.contractId?.tenantId?.fullName || "N/A"}</div>
                      <div className="text-xs text-slate-500">{invoice.contractId?.tenantId?.phoneNumber || "N/A"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">Tháng {invoice.month}/{invoice.year}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-tertiary">
                    {formatMoney(invoice.totalAmount)}
                  </div>
                  {invoice.discount > 0 && (
                    <div className="text-xs text-green-600 line-through opacity-70">
                      {formatMoney(invoice.totalAmount + invoice.discount)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(invoice.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {formatDate(invoice.dueDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onView(invoice)}
                      className="text-slate-400 hover:text-primary hover:bg-primary/5 h-8 w-8 p-0"
                      title="Xem chi tiết / Xuất HĐ"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEdit(invoice)}
                      className="text-slate-400 hover:text-amber-500 hover:bg-amber-50 h-8 w-8 p-0"
                      title="Chỉnh sửa"
                      disabled={invoice.status === 'paid'}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
