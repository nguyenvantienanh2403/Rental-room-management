import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Search, Loader2, Trash2, Filter, FileText, Calendar, DollarSign, Plug, Droplets, PlusCircle, MinusCircle, User, DoorOpen } from "lucide-react";
import { contractService } from "../services/contract.service";
import { roomService } from "../services/room.service";
import { tenantService } from "../services/tenant.service";
import { buildingService } from "../services/building.service";
import { ContractTable } from "../features/contract/ContractTable";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import toast from "react-hot-toast";

export function ContractPage() {
  const [contracts, setContracts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [buildings, setBuildings] = useState([]);
  
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedContract, setSelectedContract] = useState(null);
  const [formData, setFormData] = useState({ 
    roomId: '', 
    tenantId: '', 
    startDate: '', 
    endDate: '',
    deposit: '',
    monthlyPrice: '', 
    electricityPrice: '',
    waterPrice: '',
    status: 'active',
    services: []
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load Dependencies
  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [roomRes, tenantRes, buildingRes] = await Promise.all([
          roomService.getAll(),
          tenantService.getAll(),
          buildingService.getAll()
        ]);
        
        let roomList = Array.isArray(roomRes) ? roomRes : (roomRes?.data?.rooms || roomRes?.data || []);
        let tenantList = Array.isArray(tenantRes) ? tenantRes : (tenantRes?.data?.tenants || tenantRes?.data || []);
        let buildingList = Array.isArray(buildingRes) ? buildingRes : (buildingRes?.data?.buildings || buildingRes?.data || []);
        
        setRooms(roomList);
        setTenants(tenantList);
        setBuildings(buildingList);
      } catch (error) {
        toast.error("Không thể tải dữ liệu phụ trợ");
      } finally {
        setIsLoadingDependencies(false);
      }
    };
    fetchDependencies();
  }, []);

  const fetchContracts = useCallback(async () => {
    setIsLoadingContracts(true);
    try {
      const response = await contractService.getAll(selectedStatusFilter !== "all" ? { status: selectedStatusFilter } : {});
      let list = Array.isArray(response) ? response : (response?.data?.contracts || response?.data || []);
      setContracts(list);
    } catch (error) {
      toast.error("Không thể tải danh sách hợp đồng");
    } finally {
      setIsLoadingContracts(false);
    }
  }, [selectedStatusFilter]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Group rooms for select dropdown
  const groupedRooms = useMemo(() => {
    const groups = {};
    rooms.forEach(room => {
      const bName = room.buildingId?.name || 'Không có tòa nhà';
      if (!groups[bName]) groups[bName] = [];
      groups[bName].push(room);
    });
    return groups;
  }, [rooms]);

  const handleAddClick = () => {
    setSelectedContract(null);
    setFormData({ 
      roomId: '', 
      tenantId: '', 
      startDate: new Date().toISOString().split('T')[0], 
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      deposit: '',
      monthlyPrice: '', 
      electricityPrice: '',
      waterPrice: '',
      status: 'active',
      services: []
    });
    setIsFormModalOpen(true);
  };

  const handleEditClick = (contract) => {
    setSelectedContract(contract);
    setFormData({ 
      roomId: contract.roomId?._id || contract.roomId || '', 
      tenantId: contract.tenantId?._id || contract.tenantId || '', 
      startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '', 
      endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : '',
      deposit: contract.deposit ?? '',
      monthlyPrice: contract.monthlyPrice ?? '', 
      electricityPrice: contract.electricityPrice ?? '',
      waterPrice: contract.waterPrice ?? '',
      status: contract.status || 'active',
      services: contract.services ? contract.services.map(s => ({...s})) : []
    });
    setIsFormModalOpen(true);
  };

  const handleViewClick = (contract) => {
    setSelectedContract(contract);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (contract) => {
    setSelectedContract(contract);
    setIsDeleteModalOpen(true);
  };

  const handleRoomChange = (e) => {
    const rId = e.target.value;
    const room = rooms.find(r => r._id === rId);
    
    if (room) {
      // Find building to get services
      const buildingId = room.buildingId?._id || room.buildingId;
      const building = buildings.find(b => b._id === buildingId);
      
      const defaultServices = building?.services ? building.services.map(s => ({
        name: s.name,
        price: s.price,
        unit: s.unit,
        quantity: 1
      })) : [];

      setFormData(prev => ({
        ...prev,
        roomId: rId,
        monthlyPrice: room.price || prev.monthlyPrice,
        services: defaultServices.length > 0 ? defaultServices : prev.services
      }));
    } else {
      setFormData(prev => ({ ...prev, roomId: rId }));
    }
  };

  const addServiceRow = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { name: '', price: 0, unit: 'người', quantity: 1 }]
    }));
  };

  const removeServiceRow = (index) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const updateServiceRow = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index][field] = value;
    setFormData({ ...formData, services: newServices });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roomId || !formData.tenantId || !formData.startDate || !formData.endDate) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }
    
    setIsSaving(true);
    const toastId = toast.loading(selectedContract ? "Đang cập nhật..." : "Đang tạo hợp đồng...");
    
    try {
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        deposit: Number(formData.deposit),
        monthlyPrice: Number(formData.monthlyPrice),
        electricityPrice: Number(formData.electricityPrice),
        waterPrice: Number(formData.waterPrice),
        services: formData.services.map(s => ({
          name: s.name,
          price: Number(s.price),
          unit: s.unit,
          quantity: Number(s.quantity)
        }))
      };

      if (selectedContract) {
        await contractService.update(selectedContract._id, payload);
        toast.success("Cập nhật thành công!", { id: toastId });
      } else {
        await contractService.create(payload);
        toast.success("Tạo hợp đồng thành công!", { id: toastId });
      }
      await fetchContracts();
      setIsFormModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lưu thất bại", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    setIsSaving(true);
    const toastId = toast.loading("Đang xóa...");
    try {
      await contractService.delete(selectedContract._id);
      await fetchContracts();
      setIsDeleteModalOpen(false);
      setIsViewModalOpen(false);
      toast.success("Đã xóa hợp đồng", { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.message || "Xóa thất bại", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const term = searchTerm.toLowerCase();
      const tenantName = (contract.tenantId?.fullName || '').toLowerCase();
      const contractCode = (contract.contractCode || '').toLowerCase();
      return tenantName.includes(term) || contractCode.includes(term);
    });
  }, [contracts, searchTerm]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Hợp đồng</h2>
          <p className="text-slate-500">Quản lý thời hạn, giá cả và dịch vụ phòng.</p>
        </div>
        <Button onClick={handleAddClick} className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none shadow-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> Tạo Hợp đồng
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl">
          <div className="relative w-full md:w-1/2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Mã HĐ, Tên khách..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative w-full md:w-1/2 flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
              <Filter className="h-4 w-4" />
            </div>
            <select
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hiệu lực</option>
              <option value="expired">Đã hết hạn</option>
              <option value="terminated">Đã chấm dứt</option>
            </select>
          </div>
        </div>
      </div>

      {isLoadingContracts ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <ContractTable 
          contracts={filteredContracts} 
          onEdit={handleEditClick} 
          onView={handleViewClick} 
          onDelete={handleDeleteClick} 
        />
      )}

      {/* FORM MODAL */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={selectedContract ? "Cập nhật Hợp đồng" : "Tạo Hợp đồng Mới"} maxWidth="max-w-4xl">
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {isLoadingDependencies ? (
            <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /> Đang tải dữ liệu phòng và khách...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {/* Thông tin cơ bản */}
              <div className="space-y-5">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide border-b border-slate-200 pb-2">Thông tin cơ bản</h4>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phòng *</label>
                  <select
                    value={formData.roomId}
                    onChange={handleRoomChange}
                    required
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary font-medium"
                  >
                    <option value="" disabled>-- Chọn phòng --</option>
                    {Object.entries(groupedRooms).map(([buildingName, buildingRooms]) => (
                      <optgroup key={buildingName} label={buildingName}>
                        {buildingRooms.map(r => (
                          <option key={r._id} value={r._id}>Phòng {r.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Khách thuê *</label>
                  <select
                    value={formData.tenantId}
                    onChange={e => setFormData({...formData, tenantId: e.target.value})}
                    required
                    disabled={!formData.roomId}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="" disabled>
                      {!formData.roomId ? "-- Vui lòng chọn phòng trước --" : "-- Chọn khách thuê --"}
                    </option>
                    {tenants
                      .filter(t => {
                        const tenantRoomId = t.roomId?._id || t.roomId;
                        return tenantRoomId === formData.roomId;
                      })
                      .map(t => (
                      <option key={t._id} value={t._id}>{t.fullName} ({t.phoneNumber})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu *</label>
                    <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày kết thúc *</label>
                    <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} required />
                  </div>
                </div>

                {selectedContract && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    >
                      <option value="active">Đang hiệu lực (Active)</option>
                      <option value="expired">Đã hết hạn (Expired)</option>
                      <option value="terminated">Đã chấm dứt (Terminated)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Thông tin Chi phí */}
              <div className="space-y-5">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide border-b border-slate-200 pb-2">Thông tin Chi phí</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tiền cọc (VNĐ) *</label>
                    <Input type="number" min="0" value={formData.deposit} onChange={e => setFormData({...formData, deposit: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Giá thuê/tháng (VNĐ) *</label>
                    <Input type="number" min="0" value={formData.monthlyPrice} onChange={e => setFormData({...formData, monthlyPrice: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Giá điện (VNĐ/kWh) *</label>
                    <Input type="number" min="0" value={formData.electricityPrice} onChange={e => setFormData({...formData, electricityPrice: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Giá nước (VNĐ) *</label>
                    <Input type="number" min="0" value={formData.waterPrice} onChange={e => setFormData({...formData, waterPrice: e.target.value})} required />
                  </div>
                </div>
              </div>

              {/* Dịch vụ đi kèm */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Dịch vụ đi kèm</h4>
                  <Button type="button" size="sm" variant="outline" onClick={addServiceRow} className="text-primary border-primary/30 hover:bg-primary/5">
                    <PlusCircle className="h-4 w-4 mr-1" /> Thêm dịch vụ
                  </Button>
                </div>
                
                {formData.services.length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Không có dịch vụ đi kèm nào được chọn.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {formData.services.map((service, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="w-full sm:w-1/3">
                          <label className="block text-xs text-slate-500 sm:hidden mb-1">Tên dịch vụ</label>
                          <Input placeholder="Tên dịch vụ..." value={service.name} onChange={e => updateServiceRow(index, 'name', e.target.value)} required />
                        </div>
                        <div className="w-full sm:w-1/4">
                          <label className="block text-xs text-slate-500 sm:hidden mb-1">Đơn giá (VNĐ)</label>
                          <Input type="number" min="0" placeholder="Giá" value={service.price} onChange={e => updateServiceRow(index, 'price', e.target.value)} required />
                        </div>
                        <div className="w-full sm:w-1/4">
                          <label className="block text-xs text-slate-500 sm:hidden mb-1">Đơn vị</label>
                          <Input placeholder="VD: người, phòng" value={service.unit} onChange={e => updateServiceRow(index, 'unit', e.target.value)} required />
                        </div>
                        <div className="w-full sm:w-[15%]">
                          <label className="block text-xs text-slate-500 sm:hidden mb-1">Số lượng</label>
                          <Input type="number" min="1" value={service.quantity} onChange={e => updateServiceRow(index, 'quantity', e.target.value)} required />
                        </div>
                        <button type="button" onClick={() => removeServiceRow(index)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg self-end sm:self-auto transition-colors">
                          <MinusCircle className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
          
          <div className="pt-5 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>Hủy bỏ</Button>
            <Button type="submit" disabled={isSaving || isLoadingDependencies} className="bg-primary hover:bg-primary-hover text-neutral-foreground">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {selectedContract ? "Cập nhật" : "Lưu hợp đồng"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Chi tiết Hợp đồng">
        {selectedContract && (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Mã hợp đồng</p>
                <h3 className="text-xl font-bold text-slate-900">{selectedContract.contractCode}</h3>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  selectedContract.status === 'active' ? 'bg-green-100 text-green-800' : 
                  selectedContract.status === 'expired' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedContract.status === 'active' ? 'Đang hiệu lực' : selectedContract.status === 'expired' ? 'Đã hết hạn' : 'Đã chấm dứt'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1"><User className="h-4 w-4"/> Khách thuê</div>
                <p className="font-bold text-slate-900">{selectedContract.tenantId?.fullName}</p>
                <p className="text-sm text-slate-600">{selectedContract.tenantId?.phoneNumber}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1"><DoorOpen className="h-4 w-4"/> Phòng</div>
                <p className="font-bold text-slate-900">Phòng {selectedContract.roomId?.name}</p>
                <p className="text-sm text-slate-600">Tòa: {selectedContract.roomId?.buildingId?.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <p className="text-xs text-slate-500">Tiền cọc</p>
                 <p className="font-bold">{formatMoney(selectedContract.deposit)}</p>
               </div>
               <div>
                 <p className="text-xs text-slate-500">Giá thuê/tháng</p>
                 <p className="font-bold text-tertiary">{formatMoney(selectedContract.monthlyPrice)}</p>
               </div>
               <div>
                 <p className="text-xs text-slate-500">Giá điện</p>
                 <p className="font-semibold text-amber-600">{formatMoney(selectedContract.electricityPrice)} / kWh</p>
               </div>
               <div>
                 <p className="text-xs text-slate-500">Giá nước</p>
                 <p className="font-semibold text-blue-600">{formatMoney(selectedContract.waterPrice)}</p>
               </div>
            </div>

            {selectedContract.services && selectedContract.services.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-bold text-slate-700 border-b pb-2 mb-3">Dịch vụ áp dụng</h4>
                <div className="space-y-2">
                  {selectedContract.services.map(s => (
                    <div key={s._id || s.name} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="font-medium">{s.name} <span className="text-slate-500 font-normal">(x{s.quantity} {s.unit})</span></span>
                      <span className="font-bold">{formatMoney(s.price * s.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="pt-4 flex justify-end">
               <Button onClick={() => setIsViewModalOpen(false)} variant="outline">Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Xác nhận xóa">
        <p className="text-slate-600 mb-6">Bạn có chắc chắn muốn xóa hợp đồng <strong>{selectedContract?.contractCode}</strong> không? Phòng sẽ được chuyển trạng thái về Trống.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Hủy</Button>
          <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Xóa hợp đồng</Button>
        </div>
      </Modal>

    </div>
  );
}
