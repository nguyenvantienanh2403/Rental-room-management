import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, Filter, Printer, Copy, AlertCircle, Save, X, Zap, Plus } from "lucide-react";
import { invoiceService } from "../services/invoice.service";
import { contractService } from "../services/contract.service";
import { buildingService } from "../services/building.service";
import { InvoiceTable } from "../features/invoice/InvoiceTable";
import { InvoicePrintTemplate } from "../features/invoice/InvoicePrintTemplate";
import { BulkCreateInvoiceModal } from "../features/invoice/BulkCreateInvoiceModal";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import toast from "react-hot-toast";
import { toPng } from 'html-to-image';

export function InvoicePage() {
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("all");

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Create Form State
  const [createFormData, setCreateFormData] = useState({
    contractId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    electricityOldIndex: '',
    electricityNewIndex: '',
    waterOldIndex: '',
    waterNewIndex: '',
    discount: ''
  });

  // Edit Form State
  const [editFormData, setEditFormData] = useState({ discount: 0, dueDate: '', status: 'draft' });
  const [editOtherFees, setEditOtherFees] = useState([]);

  const printRef = useRef(null);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedStatusFilter !== "all") params.status = selectedStatusFilter;
      if (selectedMonthFilter !== "all") params.month = selectedMonthFilter;
      
      const [invoiceRes, contractRes, buildingRes] = await Promise.all([
        invoiceService.getAll(params),
        contractService.getAll({ status: 'active' }),
        buildingService.getAll()
      ]);
      
      let list = Array.isArray(invoiceRes) ? invoiceRes : (invoiceRes?.data?.invoices || invoiceRes?.data || []);
      setInvoices(list);
      
      let contractList = Array.isArray(contractRes) ? contractRes : (contractRes?.data?.contracts || contractRes?.data || []);
      let buildingList = Array.isArray(buildingRes) ? buildingRes : (buildingRes?.data?.buildings || buildingRes?.data || []);
      
      setBuildings(buildingList);
      
      const enhancedContracts = contractList.map(c => {
        const bId = c.roomId?.buildingId?._id || c.roomId?.buildingId;
        const b = buildingList.find(b => b._id === bId);
        return { ...c, buildingName: b?.name || 'Tòa nhà' };
      });
      setContracts(enhancedContracts);
    } catch (error) {
      toast.error("Không thể tải danh sách hóa đơn");
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatusFilter, selectedMonthFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleViewClick = async (invoice) => {
    setIsLoading(true);
    let fullContract = contracts.find(c => c._id === (invoice.contractId?._id || invoice.contractId));
    
    if (!fullContract && invoice.contractId?._id) {
       try {
         const res = await contractService.getById(invoice.contractId._id);
         fullContract = res.data?.contract || res.data || res;
       } catch (err) {
         console.error("Could not fetch full contract", err);
       }
    }
    setIsLoading(false);
    
    setSelectedInvoice({ ...invoice, fullContract });
    setIsViewModalOpen(true);
  };

  const handleEditClick = (invoice) => {
    setSelectedInvoice(invoice);
    setEditFormData({
      discount: invoice.discount || 0,
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      status: invoice.status || 'draft'
    });
    setEditOtherFees(invoice.otherFees ? JSON.parse(JSON.stringify(invoice.otherFees)) : []);
    setIsEditModalOpen(true);
  };

  const handleUpdateFee = (index, field, value) => {
    const updatedFees = [...editOtherFees];
    updatedFees[index][field] = field === 'amount' ? Number(value) : value;
    setEditOtherFees(updatedFees);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Đang cập nhật hóa đơn...");
    try {
      if (selectedInvoice.status === 'draft') {
        const updatePayload = {
          discount: Number(editFormData.discount),
          otherFees: editOtherFees
        };
        if (editFormData.dueDate) {
          updatePayload.dueDate = new Date(editFormData.dueDate).toISOString();
        }
        await invoiceService.update(selectedInvoice._id, updatePayload);
      }

      if (editFormData.status !== selectedInvoice.status) {
        await invoiceService.updateStatus(selectedInvoice._id, editFormData.status);
      }

      toast.success("Cập nhật thành công!", { id: toastId });
      await fetchInvoices();
      setIsEditModalOpen(false);
      
      // Update selectedInvoice if view modal is open (edge case)
      if (isViewModalOpen) {
         setSelectedInvoice({...selectedInvoice, status: editFormData.status, discount: editFormData.discount});
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Đang tạo hóa đơn...");
    try {
      const payload = {
        contractId: createFormData.contractId,
        month: Number(createFormData.month),
        year: Number(createFormData.year),
        electricityOldIndex: Number(createFormData.electricityOldIndex || 0),
        electricityNewIndex: Number(createFormData.electricityNewIndex || 0),
        waterOldIndex: Number(createFormData.waterOldIndex || 0),
        waterNewIndex: Number(createFormData.waterNewIndex || 0),
        discount: Number(createFormData.discount || 0)
      };

      await invoiceService.create(payload);
      toast.success("Tạo hóa đơn thành công!", { id: toastId });
      await fetchInvoices();
      setIsCreateModalOpen(false);
      setCreateFormData({
        contractId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        electricityOldIndex: '',
        electricityNewIndex: '',
        waterOldIndex: '',
        waterNewIndex: '',
        discount: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi tạo hóa đơn", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // Reload to restore React bindings after print messes with DOM
  };

  const handleCopyImage = async () => {
    if (printRef.current === null) return;
    const toastId = toast.loading("Đang tạo hình ảnh...");
    try {
      const dataUrl = await toPng(printRef.current, { 
        cacheBust: true, 
        backgroundColor: '#ffffff',
        pixelRatio: 2 // High quality
      });
      
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      toast.success("Đã copy hình ảnh hóa đơn vào bộ nhớ tạm (Clipboard)!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Không thể copy hình ảnh, trình duyệt của bạn có thể không hỗ trợ", { id: toastId });
    }
  };

  const handleAddNew = () => {
    setIsCreateModalOpen(true);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const term = searchTerm.toLowerCase();
    const tenantName = (invoice.contractId?.tenantId?.fullName || '').toLowerCase();
    const contractCode = (invoice.contractId?.contractCode || '').toLowerCase();
    const roomName = (invoice.contractId?.roomId?.name || '').toLowerCase();
    return tenantName.includes(term) || contractCode.includes(term) || roomName.includes(term);
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Hóa đơn</h2>
          <p className="text-slate-500">Quản lý và theo dõi trạng thái thanh toán.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsBulkModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm flex items-center gap-2">
            <Zap className="h-4 w-4" /> Tạo Hàng Loạt
          </Button>
          <Button onClick={handleAddNew} className="bg-primary hover:bg-primary-hover text-white border-none shadow-sm flex items-center gap-2">
            <Plus className="h-4 w-4" /> Tạo Hóa Đơn
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl">
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
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="draft">Bản nháp</option>
              <option value="issued">Chưa thanh toán</option>
              <option value="paid">Đã thanh toán</option>
            </select>
          </div>
          
          <div className="relative w-full md:w-1/4">
            <select
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
            >
              <option value="all">Tháng này</option>
              <option value="1">Tháng 1</option>
              <option value="2">Tháng 2</option>
              <option value="3">Tháng 3</option>
              <option value="4">Tháng 4</option>
              <option value="5">Tháng 5</option>
              <option value="6">Tháng 6</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <InvoiceTable 
          invoices={filteredInvoices} 
          onEdit={handleEditClick} 
          onView={handleViewClick} 
        />
      )}

      {/* VIEW & PRINT MODAL */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Chi tiết Hóa đơn" maxWidth="max-w-5xl">
        <div className="space-y-4">
          <div className="flex justify-end gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <Button onClick={handleCopyImage} className="bg-white text-slate-700 border-slate-300 hover:bg-slate-100 flex items-center gap-2">
              <Copy className="h-4 w-4 text-blue-500" /> Copy dạng Hình ảnh
            </Button>
            <Button onClick={handlePrint} className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2">
              <Printer className="h-4 w-4" /> Xuất Hóa Đơn / In
            </Button>
          </div>
          
          {/* Vùng Render Mẫu Hóa đơn để In/Copy */}
          <div className="border border-slate-200 rounded-lg overflow-x-auto bg-slate-100 p-4 flex justify-center">
             <div className="shadow-lg">
                {selectedInvoice && (
                  <InvoicePrintTemplate ref={printRef} invoice={selectedInvoice} />
                )}
             </div>
          </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Chỉnh sửa Hóa đơn">
        {selectedInvoice && (
          <form onSubmit={handleEditSubmit} className="space-y-5">
            {selectedInvoice.status === 'paid' && (
               <div className="bg-amber-50 text-amber-800 p-3 rounded-lg flex items-start gap-2 border border-amber-200 text-sm">
                 <AlertCircle className="h-5 w-5 shrink-0" />
                 <p>Hóa đơn này đã được thanh toán. Không khuyến khích chỉnh sửa số tiền.</p>
               </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                  >
                    <option value="draft">Bản nháp (Draft)</option>
                    <option value="issued">Chưa thanh toán (Issued)</option>
                    <option value="paid">Đã thanh toán (Paid)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hạn thanh toán</label>
                  <Input type="date" value={editFormData.dueDate} onChange={e => setEditFormData({...editFormData, dueDate: e.target.value})} disabled={selectedInvoice?.status !== 'draft'} />
               </div>
               <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giảm giá (VNĐ)</label>
                  <Input type="number" min="0" value={editFormData.discount} onChange={e => setEditFormData({...editFormData, discount: e.target.value})} disabled={selectedInvoice?.status !== 'draft'} />
               </div>
            </div>

            {editOtherFees.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-bold text-slate-700 border-b pb-2">Phụ phí / Dịch vụ</h4>
                {editOtherFees.map((fee, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <div className="w-1/2">
                       <Input value={fee.name} onChange={e => handleUpdateFee(idx, 'name', e.target.value)} disabled />
                    </div>
                    <div className="w-1/2">
                       <Input type="number" min="0" value={fee.amount} onChange={e => handleUpdateFee(idx, 'amount', e.target.value)} disabled={selectedInvoice?.status !== 'draft'} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isSaving} className="bg-primary text-white">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Lưu thay đổi
              </Button>
            </div>
          </form>
        )}
      </Modal>
      
      {/* CREATE MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Tạo Hóa đơn mới" maxWidth="max-w-3xl">
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Chọn Hợp đồng *</label>
                <select
                  value={createFormData.contractId}
                  onChange={(e) => setCreateFormData({...createFormData, contractId: e.target.value})}
                  required
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>-- Chọn hợp đồng đang hiệu lực --</option>
                  {contracts.map(c => (
                    <option key={c._id} value={c._id}>[{c.buildingName}] {c.contractCode} - Khách: {c.tenantId?.fullName} (Phòng: {c.roomId?.name})</option>
                  ))}
                </select>
             </div>
             
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kỳ hóa đơn (Tháng) *</label>
                <Input type="number" min="1" max="12" value={createFormData.month} onChange={e => setCreateFormData({...createFormData, month: e.target.value})} required />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kỳ hóa đơn (Năm) *</label>
                <Input type="number" min="2000" value={createFormData.year} onChange={e => setCreateFormData({...createFormData, year: e.target.value})} required />
             </div>

             <div className="col-span-2">
               <h4 className="text-sm font-bold text-slate-700 border-b pb-2 mt-2 mb-3">Chỉ số Điện Nước</h4>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số Điện cũ</label>
                <Input type="number" step="any" min="0" value={createFormData.electricityOldIndex} onChange={e => setCreateFormData({...createFormData, electricityOldIndex: e.target.value})} placeholder="VD: 1000" />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số Điện mới</label>
                <Input type="number" step="any" min="0" value={createFormData.electricityNewIndex} onChange={e => setCreateFormData({...createFormData, electricityNewIndex: e.target.value})} placeholder="VD: 1090" />
             </div>
             
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số Nước cũ</label>
                <Input type="number" step="any" min="0" value={createFormData.waterOldIndex} onChange={e => setCreateFormData({...createFormData, waterOldIndex: e.target.value})} placeholder="VD: 100" />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số Nước mới</label>
                <Input type="number" step="any" min="0" value={createFormData.waterNewIndex} onChange={e => setCreateFormData({...createFormData, waterNewIndex: e.target.value})} placeholder="VD: 102" />
             </div>

             <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Giảm giá (VNĐ)</label>
                <Input type="number" min="0" value={createFormData.discount} onChange={e => setCreateFormData({...createFormData, discount: e.target.value})} placeholder="VD: 50000" />
             </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-hover text-white">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Printer className="h-4 w-4 mr-2" />} Tạo Hóa Đơn
            </Button>
          </div>
        </form>
      </Modal>

      {/* BULK CREATE INVOICE MODAL */}
      <BulkCreateInvoiceModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        contracts={contracts}
        buildings={buildings}
        invoices={invoices}
        onSuccess={fetchInvoices}
      />

    </div>
  );
}
