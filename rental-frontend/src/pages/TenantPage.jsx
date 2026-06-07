import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Search, Loader2, Trash2, Filter, User, MapPin, Building, Phone, DoorOpen } from "lucide-react";
import { tenantService } from "../services/tenant.service";
import { roomService } from "../services/room.service";
import { TenantTable } from "../features/tenant/TenantTable";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import toast from "react-hot-toast";

export function TenantPage() {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoomFilter, setSelectedRoomFilter] = useState("all");

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [formData, setFormData] = useState({ 
    fullName: '', 
    phoneNumber: '', 
    identityCard: '', 
    email: '',
    homeTown: '',
    roomId: '', 
    status: 'active' 
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load Rooms for Dropdown filter
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await roomService.getAll();
        let list = [];
        if (Array.isArray(response)) list = response;
        else if (response && Array.isArray(response.data)) list = response.data;
        else if (response && Array.isArray(response.rooms)) list = response.rooms;
        else if (response && response.data && Array.isArray(response.data.rooms)) list = response.data.rooms;
        setRooms(list);
      } catch (error) {
        toast.error("Không thể tải danh sách phòng");
      } finally {
        setIsLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  const fetchTenants = useCallback(async () => {
    setIsLoadingTenants(true);
    try {
      let response;
      if (selectedRoomFilter === "all") {
        response = await tenantService.getAll();
      } else {
        response = await tenantService.getByRoom(selectedRoomFilter);
      }
      
      let list = [];
      if (Array.isArray(response)) list = response;
      else if (response && Array.isArray(response.data)) list = response.data;
      else if (response && Array.isArray(response.tenants)) list = response.tenants;
      else if (response && response.data && Array.isArray(response.data.tenants)) list = response.data.tenants;
      
      setTenants(list);
    } catch (error) {
      toast.error("Không thể tải danh sách khách thuê");
    } finally {
      setIsLoadingTenants(false);
    }
  }, [selectedRoomFilter]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Group rooms by building for Select dropdowns
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
    setSelectedTenant(null);
    setFormData({ 
      fullName: '', 
      phoneNumber: '', 
      identityCard: '', 
      email: '',
      homeTown: '',
      roomId: selectedRoomFilter !== "all" ? selectedRoomFilter : '', 
      status: 'active' 
    });
    setIsFormModalOpen(true);
  };

  const handleEditClick = (tenant) => {
    setSelectedTenant(tenant);
    setFormData({ 
      fullName: tenant.fullName || '', 
      phoneNumber: tenant.phoneNumber || '', 
      identityCard: tenant.identityCard || '', 
      email: tenant.email || '',
      homeTown: tenant.homeTown || '',
      roomId: tenant.roomId?._id || tenant.roomId || '', 
      status: tenant.status || 'active' 
    });
    setIsFormModalOpen(true);
  };

  const handleViewClick = (tenant) => {
    setSelectedTenant(tenant);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (tenant) => {
    setSelectedTenant(tenant);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phoneNumber || !formData.identityCard || !formData.roomId) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }
    
    setIsSaving(true);
    const toastId = toast.loading(selectedTenant ? "Đang cập nhật..." : "Đang thêm khách mới...");
    
    try {
      if (selectedTenant) {
        const tenantId = selectedTenant._id || selectedTenant.id;
        await tenantService.update(tenantId, formData);
        toast.success("Cập nhật thành công!", { id: toastId });
      } else {
        await tenantService.create(formData);
        toast.success("Thêm khách thuê thành công!", { id: toastId });
      }
      await fetchTenants();
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
      const tenantId = selectedTenant._id || selectedTenant.id;
      await tenantService.delete(tenantId);
      await fetchTenants();
      setIsDeleteModalOpen(false);
      setIsViewModalOpen(false);
      toast.success("Đã xóa khách thuê", { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.message || "Xóa thất bại", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Filter Data locally by Search term
  const filteredTenants = useMemo(() => {
    return tenants.filter(tenant => {
      const term = searchTerm.toLowerCase();
      return (tenant.fullName || '').toLowerCase().includes(term) || 
             (tenant.identityCard || '').includes(searchTerm) ||
             (tenant.phoneNumber || '').includes(searchTerm);
    });
  }, [tenants, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Khách thuê</h2>
          <p className="text-slate-500">Quản lý thông tin và hợp đồng khách thuê.</p>
        </div>
        <Button onClick={handleAddClick} className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none shadow-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm khách thuê
        </Button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl">
          {/* Lọc theo tên/sđt/cccd */}
          <div className="relative w-full md:w-1/2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Tên, SĐT, CCCD..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lọc theo phòng */}
          <div className="relative w-full md:w-1/2 flex items-center gap-2">
            <div className="p-2 bg-tertiary/10 rounded-lg text-tertiary shrink-0">
              <Filter className="h-4 w-4" />
            </div>
            <select
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-medium text-slate-700 transition-colors"
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              disabled={isLoadingRooms}
            >
              <option value="all">-- Tất cả Phòng --</option>
              {Object.entries(groupedRooms).map(([buildingName, buildingRooms]) => (
                <optgroup key={buildingName} label={buildingName}>
                  {buildingRooms.map(r => (
                    <option key={r._id} value={r._id}>Phòng {r.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div className="text-sm text-slate-500 font-medium bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 whitespace-nowrap">
          Tổng số: <strong className="text-slate-900 text-base">{filteredTenants.length}</strong> khách
        </div>
      </div>

      {isLoadingTenants ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <TenantTable 
          tenants={filteredTenants} 
          onEdit={handleEditClick} 
          onView={handleViewClick} 
          onDelete={handleDeleteClick} 
        />
      )}

      {/* MODAL FORM (THÊM/SỬA) */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={selectedTenant ? "Cập nhật Khách thuê" : "Thêm Khách thuê Mới"}>
        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên *</label>
              <Input 
                value={formData.fullName} 
                onChange={e => setFormData({...formData, fullName: e.target.value})} 
                placeholder="VD: Nguyễn Văn A" 
                required 
                className="bg-white border-slate-300 focus:ring-primary"
              />
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại *</label>
              <Input 
                value={formData.phoneNumber} 
                onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                placeholder="VD: 09..." 
                required 
                className="bg-white border-slate-300 focus:ring-primary"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">CCCD/CMND *</label>
              <Input 
                value={formData.identityCard} 
                onChange={e => setFormData({...formData, identityCard: e.target.value})} 
                placeholder="Số CCCD" 
                required 
                className="bg-white border-slate-300 focus:ring-primary"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="nguyenvana@gmail.com" 
                className="bg-white border-slate-300 focus:ring-primary"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
              <select 
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="active">Đang thuê (Active)</option>
                <option value="moved_out">Đã rời đi (Moved out)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Quê quán / Nơi sinh</label>
              <Input 
                value={formData.homeTown} 
                onChange={e => setFormData({...formData, homeTown: e.target.value})} 
                placeholder="VD: Hải Phòng..." 
                className="bg-white border-slate-300 focus:ring-primary"
              />
            </div>

            <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Chọn Phòng cho thuê *</label>
              <select
                value={formData.roomId}
                onChange={e => setFormData({...formData, roomId: e.target.value})}
                required
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-slate-900"
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
          </div>
          
          <div className="pt-5 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)} className="bg-white">Hủy bỏ</Button>
            <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {selectedTenant ? "Cập nhật Khách" : "Thêm Khách Mới"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL CHI TIẾT CÁ NHÂN */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Hồ sơ Khách thuê">
        {selectedTenant && (
          <div className="space-y-6">
            <div className="flex items-center gap-5 border-b border-slate-100 pb-6">
              <div className="h-20 w-20 bg-primary/10 text-primary rounded-full flex items-center justify-center border-4 border-primary/5 shadow-sm">
                <span className="text-3xl font-bold">{selectedTenant.fullName?.substring(0, 2).toUpperCase()}</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{selectedTenant.fullName}</h3>
                <span className={`inline-flex mt-2 items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm ${
                  selectedTenant.status === 'active' 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {selectedTenant.status === 'active' ? 'Đang thuê' : 'Đã rời đi'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3 items-center">
                <Phone className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Số điện thoại</p>
                  <p className="font-bold text-slate-900">{selectedTenant.phoneNumber}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3 items-center">
                <User className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">CCCD/CMND</p>
                  <p className="font-bold text-slate-900">{selectedTenant.identityCard}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3 items-start md:col-span-2">
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Quê quán</p>
                  <p className="font-semibold text-slate-900">{selectedTenant.homeTown || "Chưa cập nhật"}</p>
                </div>
              </div>

              {selectedTenant.email && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3 items-center md:col-span-2">
                  <div className="text-slate-400">@</div>
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-semibold text-slate-900">{selectedTenant.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thông tin phòng đang thuê */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Phòng đang thuê</h4>
              {selectedTenant.roomId ? (
                <div className="bg-tertiary/5 border border-tertiary/20 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-tertiary/10 text-tertiary rounded-lg">
                      <DoorOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-slate-900">Phòng {selectedTenant.roomId.name}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Building className="h-3.5 w-3.5" /> 
                        {selectedTenant.roomId.buildingId?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Giá phòng</p>
                    <p className="font-bold text-tertiary">
                      {selectedTenant.roomId.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedTenant.roomId.price) : "N/A"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                  Khách thuê chưa được gắn vào phòng nào.
                </p>
              )}
            </div>

            <div className="pt-5 flex justify-between border-t border-slate-100 mt-6">
              <Button 
                variant="outline" 
                onClick={() => handleDeleteClick(selectedTenant)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 border-none px-4"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Xóa hồ sơ
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="bg-white">Đóng</Button>
                <Button onClick={() => { setIsViewModalOpen(false); handleEditClick(selectedTenant); }} className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none px-6">
                  Chỉnh sửa
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL XÁC NHẬN XÓA */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Xác nhận xóa hồ sơ">
        <div className="space-y-4">
          <p className="text-slate-600">
            Bạn có chắc chắn muốn xóa hồ sơ của khách <strong className="text-slate-900">{selectedTenant?.fullName}</strong> không? Hành động này không thể hoàn tác.
          </p>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="bg-white">Hủy</Button>
            <Button onClick={confirmDelete} disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-neutral-foreground border-none">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
