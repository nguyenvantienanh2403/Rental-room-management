import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, Filter, Plus, FileText, Zap, Droplets } from "lucide-react";
import { meterReadingService } from "../services/meterReading.service";
import { contractService } from "../services/contract.service";
import { invoiceService } from "../services/invoice.service";
import { buildingService } from "../services/building.service";
import { MeterReadingTable } from "../features/meter-reading/MeterReadingTable";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export function MeterReadingPage() {
  const [readings, setReadings] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  
  const [selectedReading, setSelectedReading] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    contractId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    electricityOldIndex: 0,
    electricityNewIndex: 0,
    waterOldIndex: 0,
    waterNewIndex: 0
  });

  const [invoiceDiscount, setInvoiceDiscount] = useState(0);

  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [readingsRes, contractsRes, buildingsRes] = await Promise.all([
        meterReadingService.getAll(),
        contractService.getAll(),
        buildingService.getAll()
      ]);
      
      const contractList = Array.isArray(contractsRes) ? contractsRes : (contractsRes?.data?.contracts || contractsRes?.data || []);
      const buildingList = Array.isArray(buildingsRes) ? buildingsRes : (buildingsRes?.data?.buildings || buildingsRes?.data || []);
      setBuildings(buildingList);
      
      // Gắn thông tin Tòa nhà vào hợp đồng
      const enhancedContracts = contractList.map(c => {
        const bId = c.roomId?.buildingId?._id || c.roomId?.buildingId;
        const b = buildingList.find(b => b._id === bId);
        return { ...c, buildingName: b?.name || 'Tòa nhà' };
      });
      setContracts(enhancedContracts);

      let list = Array.isArray(readingsRes) ? readingsRes : (readingsRes?.data?.readings || readingsRes?.data || []);
      
      // Map contract data into readings for display
      const mappedList = list.map(r => {
        const c = contractList.find(contract => contract._id === r.contractId);
        return { ...r, contractData: c };
      });
      
      setReadings(mappedList);
    } catch (error) {
      toast.error("Không thể tải dữ liệu điện nước");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddNew = () => {
    setSelectedReading(null);
    setFormData({
      contractId: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      electricityOldIndex: 0,
      electricityNewIndex: 0,
      waterOldIndex: 0,
      waterNewIndex: 0
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (reading) => {
    setSelectedReading(reading);
    setFormData({
      contractId: reading.contractId,
      month: reading.month,
      year: reading.year,
      electricityOldIndex: reading.electricity?.oldIndex || 0,
      electricityNewIndex: reading.electricity?.newIndex || 0,
      waterOldIndex: reading.water?.oldIndex || 0,
      waterNewIndex: reading.water?.newIndex || 0
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setSelectedReading(id);
    setIsDeleteModalOpen(true);
  };

  const handleCreateInvoiceClick = (reading) => {
    setSelectedReading(reading);
    setInvoiceDiscount(0);
    setIsInvoiceModalOpen(true);
  };

  const handleContractChange = (e) => {
    const selectedContractId = e.target.value;
    
    // Tìm các kỳ ghi điện nước trước đó của hợp đồng này
    const contractReadings = readings.filter(r => r.contractId === selectedContractId);
    
    let oldElec = 0;
    let oldWater = 0;
    
    if (contractReadings.length > 0) {
      // Sắp xếp giảm dần theo năm và tháng để lấy kỳ gần nhất
      contractReadings.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
      
      const latestReading = contractReadings[0];
      oldElec = latestReading.electricity?.newIndex || 0;
      oldWater = latestReading.water?.newIndex || 0;
    }
    
    setFormData({
      ...formData,
      contractId: selectedContractId,
      electricityOldIndex: oldElec,
      waterOldIndex: oldWater
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Đang lưu dữ liệu...");
    
    try {
      const payload = {
        contractId: formData.contractId,
        month: Number(formData.month),
        year: Number(formData.year),
        electricity: {
          oldIndex: Number(formData.electricityOldIndex),
          newIndex: Number(formData.electricityNewIndex)
        },
        water: {
          oldIndex: Number(formData.waterOldIndex),
          newIndex: Number(formData.waterNewIndex)
        }
      };

      if (selectedReading?._id) {
        await meterReadingService.update(selectedReading._id, payload);
        toast.success("Cập nhật thành công!", { id: toastId });
      } else {
        await meterReadingService.create(payload);
        toast.success("Thêm mới thành công!", { id: toastId });
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsSaving(true);
    const toastId = toast.loading("Đang xóa...");
    try {
      await meterReadingService.delete(selectedReading);
      toast.success("Đã xóa kỳ chốt số!", { id: toastId });
      await fetchData();
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi xóa", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmCreateInvoice = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Đang tạo hóa đơn...");
    try {
      const payload = {
        contractId: selectedReading.contractId,
        month: selectedReading.month,
        year: selectedReading.year,
        electricityOldIndex: selectedReading.electricity?.oldIndex || 0,
        electricityNewIndex: selectedReading.electricity?.newIndex || 0,
        waterOldIndex: selectedReading.water?.oldIndex || 0,
        waterNewIndex: selectedReading.water?.newIndex || 0,
        discount: Number(invoiceDiscount)
      };

      await invoiceService.create(payload);
      toast.success("Tạo hóa đơn thành công!", { id: toastId });
      setIsInvoiceModalOpen(false);
      
      // Navigate to Invoices page
      navigate('/invoices');
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi tạo hóa đơn. Có thể hóa đơn tháng này đã tồn tại.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Lọc dữ liệu
  const filteredReadings = readings.filter(r => {
    const term = searchTerm.toLowerCase();
    const tenantName = (r.contractData?.tenantId?.fullName || '').toLowerCase();
    const contractCode = (r.contractData?.contractCode || '').toLowerCase();
    const roomName = (r.contractData?.roomId?.name || '').toLowerCase();
    
    const matchSearch = tenantName.includes(term) || contractCode.includes(term) || roomName.includes(term);
    const matchMonth = selectedMonthFilter === "all" || r.month.toString() === selectedMonthFilter;
    
    return matchSearch && matchMonth;
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Điện Nước</h2>
          <p className="text-slate-500">Chốt chỉ số điện nước hàng tháng cho các phòng.</p>
        </div>
        <Button onClick={handleAddNew} className="bg-primary hover:bg-primary-hover text-white border-none shadow-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> Ghi Điện Nước
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-1/2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Tên khách, Mã HĐ, Phòng..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative w-full md:w-1/4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 absolute left-3 pointer-events-none" />
          <select
            className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
          >
            <option value="all">Tất cả các tháng</option>
            <option value="1">Tháng 1</option>
            <option value="2">Tháng 2</option>
            <option value="3">Tháng 3</option>
            <option value="4">Tháng 4</option>
            <option value="5">Tháng 5</option>
            <option value="6">Tháng 6</option>
            <option value="7">Tháng 7</option>
            <option value="8">Tháng 8</option>
            <option value="9">Tháng 9</option>
            <option value="10">Tháng 10</option>
            <option value="11">Tháng 11</option>
            <option value="12">Tháng 12</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <MeterReadingTable 
          readings={filteredReadings} 
          onEdit={handleEditClick} 
          onDelete={handleDeleteClick}
          onCreateInvoice={handleCreateInvoiceClick}
        />
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedReading ? "Cập nhật Điện Nước" : "Ghi Điện Nước mới"} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Hợp đồng / Phòng *</label>
                <select
                  value={formData.contractId}
                  onChange={handleContractChange}
                  required
                  disabled={!!selectedReading}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary disabled:bg-slate-100"
                >
                  <option value="" disabled>-- Chọn Hợp đồng --</option>
                  {contracts.filter(c => c.status === 'active' || c._id === formData.contractId).map(c => (
                    <option key={c._id} value={c._id}>[{c.buildingName}] P. {c.roomId?.name} - {c.tenantId?.fullName} ({c.contractCode})</option>
                  ))}
                </select>
             </div>
             
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kỳ chốt (Tháng) *</label>
                <Input type="number" min="1" max="12" value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} required />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kỳ chốt (Năm) *</label>
                <Input type="number" min="2000" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required />
             </div>

             <div className="col-span-2 mt-2">
               <h4 className="text-sm font-bold text-amber-600 flex items-center gap-2 border-b border-amber-200 pb-2"><Zap className="w-4 h-4"/> Chỉ số Điện (kWh)</h4>
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số cũ</label>
                <Input type="number" step="any" min="0" value={formData.electricityOldIndex} onChange={e => setFormData({...formData, electricityOldIndex: e.target.value})} required />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số mới</label>
                <Input type="number" step="any" min="0" value={formData.electricityNewIndex} onChange={e => setFormData({...formData, electricityNewIndex: e.target.value})} required />
             </div>
             
             <div className="col-span-2 mt-2">
               <h4 className="text-sm font-bold text-blue-600 flex items-center gap-2 border-b border-blue-200 pb-2"><Droplets className="w-4 h-4"/> Chỉ số Nước (m³)</h4>
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số cũ</label>
                <Input type="number" step="any" min="0" value={formData.waterOldIndex} onChange={e => setFormData({...formData, waterOldIndex: e.target.value})} required />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số mới</label>
                <Input type="number" step="any" min="0" value={formData.waterNewIndex} onChange={e => setFormData({...formData, waterNewIndex: e.target.value})} required />
             </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSaving} className="bg-primary text-white">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Lưu lại
            </Button>
          </div>
        </form>
      </Modal>

      {/* QUICK INVOICE MODAL */}
      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Tạo Hóa Đơn Nhanh">
        {selectedReading && (
          <form onSubmit={handleConfirmCreateInvoice} className="space-y-4">
             <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
               Hệ thống sẽ dựa trên chỉ số điện nước (Tháng {selectedReading.month}/{selectedReading.year}) của phòng <b>{selectedReading.contractData?.roomId?.name}</b> để xuất Hóa đơn.
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Có áp dụng Giảm giá (VNĐ) không?</label>
                <Input type="number" min="0" value={invoiceDiscount} onChange={e => setInvoiceDiscount(e.target.value)} placeholder="Nhập số tiền giảm giá nếu có" />
             </div>
             <div className="pt-4 border-t flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Đồng ý Tạo Hóa Đơn
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Xác nhận xóa">
        <div className="space-y-4">
          <p className="text-slate-600">
            Bạn có chắc chắn muốn xóa kỳ ghi điện nước này không? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSaving}>Hủy</Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleConfirmDelete} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Xóa xác nhận
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
