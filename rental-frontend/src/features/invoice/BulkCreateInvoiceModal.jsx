import { useState, useEffect } from "react";
import { Loader2, Receipt, AlertCircle, Zap, Building } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { invoiceService } from "../../services/invoice.service";
import toast from "react-hot-toast";

export function BulkCreateInvoiceModal({ isOpen, onClose, contracts, buildings, invoices, onSuccess }) {
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  // Danh sách các hợp đồng (phòng) đủ điều kiện xuất hóa đơn
  const [eligibleContracts, setEligibleContracts] = useState([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Phân tích dữ liệu để tìm ra các phòng cần xuất hóa đơn
  useEffect(() => {
    if (!selectedBuilding || !isOpen) {
      setEligibleContracts([]);
      return;
    }

    const analyzeData = async () => {
      setIsLoadingData(true);
      try {
        // Lọc các hợp đồng trong tòa nhà này
        const buildingContracts = contracts.filter(c => 
          c.status === 'active' && 
          (c.roomId?.buildingId?._id === selectedBuilding || c.roomId?.buildingId === selectedBuilding)
        );

        // Lọc ra các hợp đồng CHƯA CÓ hóa đơn trong tháng/năm này
        const eligible = [];
        for (const contract of buildingContracts) {
          // Kiểm tra xem đã có hóa đơn tháng này chưa
          const hasInvoice = invoices.some(inv => 
            (inv.contractId?._id === contract._id || inv.contractId === contract._id) && 
            inv.month === Number(month) && 
            inv.year === Number(year)
          );

          if (!hasInvoice) {
            eligible.push({
              contract,
              roomName: contract.roomId?.name || "N/A",
              tenantName: contract.tenantId?.fullName || "N/A",
              discount: 0
            });
          }
        }
        
        eligible.sort((a, b) => a.roomName.localeCompare(b.roomName));
        setEligibleContracts(eligible);
      } catch (error) {
        toast.error("Lỗi khi phân tích dữ liệu phòng");
      } finally {
        setIsLoadingData(false);
      }
    };

    analyzeData();
  }, [selectedBuilding, month, year, contracts, invoices, isOpen]);

  const handleSubmit = async () => {
    if (eligibleContracts.length === 0) {
      toast.error("Không có phòng nào cần xuất hóa đơn!");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(`Đang tạo ${eligibleContracts.length} hóa đơn...`);

    try {
      const promises = eligibleContracts.map(item => {
        // Hệ thống backend sẽ tự động tính toán điện nước cũ/mới nếu không truyền vào (hoặc dựa trên API)
        // Tuy nhiên theo logic backend của chúng ta hiện tại, chúng ta nên truyền các chỉ số là 0 nếu không biết, 
        // hoặc lý tưởng nhất là Backend tự xử lý. Trong trường hợp Backend bắt buộc, chúng ta truyền 0.
        const payload = {
          contractId: item.contract.contractId || item.contract._id,
          month: Number(month),
          year: Number(year),
          discount: Number(item.discount || 0),
          // Nếu backend tự móc dữ liệu từ meter-reading, ta có thể bỏ qua. Ở đây truyền tạm 0.
          electricityOldIndex: 0,
          electricityNewIndex: 0,
          waterOldIndex: 0,
          waterNewIndex: 0
        };
        return invoiceService.create(payload);
      });

      const results = await Promise.allSettled(promises);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;
      
      if (failCount === 0) {
        toast.success(`Tạo thành công ${successCount} hóa đơn!`, { id: toastId });
      } else {
        toast.error(`Tạo thành công ${successCount}, thất bại ${failCount} hóa đơn! (Có thể do thiếu số điện nước)`, { id: toastId });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Có lỗi xảy ra trong quá trình xuất hóa đơn!", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xuất Hóa Đơn Hàng Loạt" maxWidth="max-w-4xl">
      <div className="space-y-6">
        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
          <Zap className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
          <div className="text-sm">
            <p className="font-bold mb-1">Tính năng xuất hóa đơn tự động</p>
            <p>Hệ thống sẽ tự động quét các phòng trong Tòa nhà được chọn, lọc ra những phòng chưa có hóa đơn của tháng và tự động xuất hóa đơn dựa trên số điện/nước đã chốt.</p>
          </div>
        </div>

        {/* Thanh công cụ chọn tháng và tòa nhà */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-end">
          <div className="w-full sm:w-1/3">
            <label className="block text-sm font-medium text-slate-700 mb-1">Chọn Tòa nhà</label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Chọn tòa nhà --</option>
              {buildings.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-1/4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Kỳ HĐ (Tháng)</label>
            <Input type="number" min="1" max="12" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div className="w-full sm:w-1/4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Kỳ HĐ (Năm)</label>
            <Input type="number" min="2000" value={year} onChange={e => setYear(e.target.value)} />
          </div>
        </div>

        {/* Kết quả phân tích */}
        {selectedBuilding && !isLoadingData && (
          <div>
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              Kết quả quét: 
              <span className={eligibleContracts.length > 0 ? "text-green-600" : "text-amber-500"}>
                Tìm thấy {eligibleContracts.length} phòng cần xuất hóa đơn
              </span>
            </h4>
            
            {eligibleContracts.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Phòng</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Khách thuê</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Mã hợp đồng</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {eligibleContracts.map((item) => (
                      <tr key={item.contract._id}>
                        <td className="px-4 py-2 font-bold text-slate-900 text-sm">P. {item.roomName}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{item.tenantName}</td>
                        <td className="px-4 py-2 text-sm text-slate-500">{item.contract.contractCode}</td>
                        <td className="px-4 py-2 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Sẵn sàng xuất</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-6 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-amber-700 font-medium">Tuyệt vời! Toàn bộ các phòng trong tòa nhà này đã được xuất hóa đơn.</p>
              </div>
            )}
          </div>
        )}

        {isLoadingData && (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Đóng</Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2" 
            onClick={handleSubmit} 
            disabled={isSaving || eligibleContracts.length === 0}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
            Tiến hành Tạo {eligibleContracts.length} Hóa Đơn
          </Button>
        </div>
      </div>
    </Modal>
  );
}
