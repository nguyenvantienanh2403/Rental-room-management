import { useState, useEffect } from "react";
import { Loader2, Save, X, Building, Zap, Droplets, AlertCircle } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { meterReadingService } from "../../services/meterReading.service";
import toast from "react-hot-toast";

export function BulkMeterReadingModal({ isOpen, onClose, contracts, readings, buildings, onSuccess }) {
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [gridData, setGridData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [alreadyReadCount, setAlreadyReadCount] = useState(0);

  // Khởi tạo dữ liệu lưới khi chọn tòa nhà
  useEffect(() => {
    if (!selectedBuilding) {
      setGridData([]);
      return;
    }

    // Lọc các hợp đồng đang hoạt động trong tòa nhà được chọn
    const activeContractsInBuilding = contracts.filter(c => 
      c.status === 'active' && 
      (c.roomId?.buildingId?._id === selectedBuilding || c.roomId?.buildingId === selectedBuilding)
    );

    // Lọc bỏ những phòng ĐÃ chốt số trong tháng này
    let skippedCount = 0;
    const eligibleContracts = activeContractsInBuilding.filter(contract => {
      const hasReadThisMonth = readings.some(r => 
        (r.contractId === contract._id || r.contractId?._id === contract._id) && 
        r.month === Number(month) && 
        r.year === Number(year)
      );
      if (hasReadThisMonth) skippedCount++;
      return !hasReadThisMonth;
    });

    setAlreadyReadCount(skippedCount);

    const initialData = eligibleContracts.map(contract => {
      // Tìm số cũ từ lịch sử
      const contractReadings = readings.filter(r => r.contractId === contract._id);
      let oldElec = 0;
      let oldWater = 0;

      if (contractReadings.length > 0) {
        contractReadings.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        const latestReading = contractReadings[0];
        oldElec = latestReading.electricity?.newIndex || 0;
        oldWater = latestReading.water?.newIndex || 0;
      }

      return {
        contractId: contract._id,
        roomName: contract.roomId?.name || "N/A",
        tenantName: contract.tenantId?.fullName || "N/A",
        oldElec: oldElec,
        newElec: oldElec, // Mặc định số mới = số cũ (chưa tiêu thụ)
        oldWater: oldWater,
        newWater: oldWater
      };
    });

    // Sắp xếp theo tên phòng cho dễ nhập
    initialData.sort((a, b) => a.roomName.localeCompare(b.roomName));
    
    setGridData(initialData);
  }, [selectedBuilding, month, year, contracts, readings]);

  const handleInputChange = (contractId, field, value) => {
    setGridData(prev => prev.map(row => {
      if (row.contractId === contractId) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const handleSubmit = async () => {
    if (gridData.length === 0) {
      toast.error("Không có dữ liệu phòng nào để lưu!");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(`Đang lưu ${gridData.length} kỳ chốt số...`);

    try {
      const promises = gridData.map(row => {
        const payload = {
          contractId: row.contractId,
          month: Number(month),
          year: Number(year),
          electricity: {
            oldIndex: Number(row.oldElec),
            newIndex: Number(row.newElec)
          },
          water: {
            oldIndex: Number(row.oldWater),
            newIndex: Number(row.newWater)
          }
        };
        return meterReadingService.create(payload);
      });

      // Gửi đồng loạt (Tối ưu hóa performance)
      await Promise.allSettled(promises);
      
      toast.success("Lưu hàng loạt thành công!", { id: toastId });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Có lỗi xảy ra trong quá trình lưu!", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ghi Điện Nước Hàng Loạt" maxWidth="max-w-5xl">
      <div className="space-y-6">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Kỳ chốt (Tháng)</label>
            <Input type="number" min="1" max="12" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div className="w-full sm:w-1/4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Kỳ chốt (Năm)</label>
            <Input type="number" min="2000" value={year} onChange={e => setYear(e.target.value)} />
          </div>
        </div>

        {/* Lưới nhập liệu */}
        {alreadyReadCount > 0 && (
          <div className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200 flex items-start gap-2 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
            <p>Có <b>{alreadyReadCount} phòng</b> đã chốt điện nước trong kỳ {month}/{year}. Hệ thống đã tự động ẩn các phòng này để tránh nhập trùng.</p>
          </div>
        )}

        {selectedBuilding && gridData.length > 0 && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase border-r border-slate-200 w-1/4">Phòng / Khách</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-amber-600 uppercase border-r border-slate-200 w-1/3">
                      <div className="flex items-center justify-center gap-1"><Zap className="w-4 h-4"/> Điện (kWh)</div>
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-blue-600 uppercase w-1/3">
                      <div className="flex items-center justify-center gap-1"><Droplets className="w-4 h-4"/> Nước (m³)</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {gridData.map((row, index) => (
                    <tr key={row.contractId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 border-r border-slate-200">
                        <div className="font-bold text-slate-900 text-base">P. {row.roomName}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[150px]" title={row.tenantName}>{row.tenantName}</div>
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 bg-amber-50/30">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 text-center text-sm font-medium text-slate-500 bg-white border border-slate-200 rounded p-1">
                            {row.oldElec}
                          </div>
                          <span className="text-slate-400">→</span>
                          <input
                            type="number"
                            step="any"
                            min={row.oldElec}
                            className="w-24 text-center text-sm font-bold border-2 border-amber-300 focus:border-amber-500 focus:ring-0 rounded p-1 transition-colors"
                            value={row.newElec}
                            onChange={(e) => handleInputChange(row.contractId, 'newElec', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2 bg-blue-50/30">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 text-center text-sm font-medium text-slate-500 bg-white border border-slate-200 rounded p-1">
                            {row.oldWater}
                          </div>
                          <span className="text-slate-400">→</span>
                          <input
                            type="number"
                            step="any"
                            min={row.oldWater}
                            className="w-24 text-center text-sm font-bold border-2 border-blue-300 focus:border-blue-500 focus:ring-0 rounded p-1 transition-colors"
                            value={row.newWater}
                            onChange={(e) => handleInputChange(row.contractId, 'newWater', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedBuilding && gridData.length === 0 && (
          <div className="text-center p-8 bg-slate-50 rounded-lg border border-slate-200">
            <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">
              {alreadyReadCount > 0 
                ? `Toàn bộ các phòng trong tòa nhà này đã hoàn tất chốt sổ điện nước kỳ ${month}/${year}.` 
                : "Không tìm thấy hợp đồng nào đang có hiệu lực trong tòa nhà này."}
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Đóng</Button>
          <Button 
            className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2" 
            onClick={handleSubmit} 
            disabled={isSaving || gridData.length === 0}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu tất cả ({gridData.length} phòng)
          </Button>
        </div>
      </div>
    </Modal>
  );
}
