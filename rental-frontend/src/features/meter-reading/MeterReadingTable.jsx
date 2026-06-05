import { Edit, Trash2, Zap, Droplets, Receipt, Calendar } from "lucide-react";
import { Button } from "../../components/ui/Button";

export function MeterReadingTable({ readings, onEdit, onDelete, onCreateInvoice }) {
  if (!readings || readings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="h-16 w-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Chưa có dữ liệu chốt số</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          Danh sách ghi điện nước đang trống. Hãy thêm mới kỳ chốt số để xuất hóa đơn.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Kỳ chốt (Tháng/Năm)</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hợp đồng / Khách thuê</th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Chỉ số Điện (kWh)</th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Chỉ số Nước (m³)</th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {readings.map((reading) => {
              // Map contract data if populated
              const roomName = reading.contractData?.roomId?.name || "N/A";
              const tenantName = reading.contractData?.tenantId?.fullName || "N/A";
              const contractCode = reading.contractData?.contractCode || reading.contractId;
              
              // Round to handle JS floating point issues with decimals (e.g. 10.2 - 10.1 = 0.1)
              const elecDiff = parseFloat(((reading.electricity?.newIndex || 0) - (reading.electricity?.oldIndex || 0)).toFixed(2));
              const waterDiff = parseFloat(((reading.water?.newIndex || 0) - (reading.water?.oldIndex || 0)).toFixed(2));

              return (
                <tr key={reading._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">Tháng {reading.month}/{reading.year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">P. {roomName}</div>
                    <div className="text-sm text-slate-500">
                      {tenantName} • <span className="text-xs">{contractCode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-amber-500 font-bold mb-1">
                        <Zap className="h-4 w-4" /> {elecDiff}
                      </div>
                      <div className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {reading.electricity?.oldIndex} → {reading.electricity?.newIndex}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-blue-500 font-bold mb-1">
                        <Droplets className="h-4 w-4" /> {waterDiff}
                      </div>
                      <div className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {reading.water?.oldIndex} → {reading.water?.newIndex}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onCreateInvoice(reading)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 px-2 flex items-center gap-1"
                        title="Tạo Hóa đơn ngay"
                      >
                        <Receipt className="h-4 w-4" /> <span className="hidden sm:inline text-xs font-semibold">Tạo HĐ</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onEdit(reading)}
                        className="text-slate-400 hover:text-primary hover:bg-primary/5 h-8 w-8 p-0"
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onDelete(reading._id)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
