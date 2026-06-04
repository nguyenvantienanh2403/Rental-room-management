import { useState, useEffect } from "react";
import { Plus, Search, Loader2, Trash2, Filter, User } from "lucide-react";
import { tenantService } from "../services/tenant.service";
import { TenantTable } from "../features/tenant/TenantTable";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function TenantPage() {
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', phoneNumber: '', identityCard: '', roomId: '', status: 'active' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const response = await tenantService.getAll();
      // Auto extract array if wrapped in payload, data, tenants, etc.
      let list = [];
      if (Array.isArray(response)) list = response;
      else if (response && Array.isArray(response.data)) list = response.data;
      else if (response && Array.isArray(response.tenants)) list = response.tenants;
      else if (response && Array.isArray(response.payload)) list = response.payload;
      else if (response && Array.isArray(response.items)) list = response.items;
      else if (response && response.data && Array.isArray(response.data.data)) list = response.data.data;
      
      setTenants(list);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedTenant(null);
    setFormData({ fullName: '', phoneNumber: '', identityCard: '', roomId: '', status: 'active' });
    setIsFormModalOpen(true);
  };

  const handleEditClick = (tenant) => {
    setSelectedTenant(tenant);
    setFormData({ ...tenant });
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
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }
    
    setIsSaving(true);
    try {
      if (selectedTenant) {
        const tenantId = selectedTenant._id || selectedTenant.id;
        await tenantService.update(tenantId, formData);
      } else {
        await tenantService.create(formData);
      }
      await fetchTenants();
      setIsFormModalOpen(false);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    setIsSaving(true);
    try {
      const tenantId = selectedTenant._id || selectedTenant.id;
      await tenantService.delete(tenantId);
      await fetchTenants();
      setIsDeleteModalOpen(false);
      setIsViewModalOpen(false);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter Data
  const filteredTenants = tenants.filter(tenant => {
    return (tenant.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
           (tenant.identityCard || '').includes(searchTerm);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Khách thuê</h2>
          <p className="text-slate-500">Quản lý thông tin và hợp đồng khách thuê.</p>
        </div>
        <Button onClick={handleAddClick} className="bg-primary hover:bg-primary-hover text-neutral-foreground">
          <Plus className="h-5 w-5 mr-2" /> Thêm khách thuê
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-600" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc CCCD..."
            className="block w-full max-w-md pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
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
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên *</label>
            <Input 
              value={formData.fullName} 
              onChange={e => setFormData({...formData, fullName: e.target.value})} 
              placeholder="Nguyễn Văn A" 
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại *</label>
              <Input 
                value={formData.phoneNumber} 
                onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                placeholder="09..." 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CCCD/CMND *</label>
              <Input 
                value={formData.identityCard} 
                onChange={e => setFormData({...formData, identityCard: e.target.value})} 
                placeholder="Số thẻ căn cước" 
                required 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mã Phòng đang thuê *</label>
            <Input 
              value={formData.roomId} 
              onChange={e => setFormData({...formData, roomId: e.target.value})} 
              placeholder="VD: ID của phòng" 
              required 
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {selectedTenant ? "Cập nhật" : "Lưu"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL CHI TIẾT */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Chi tiết Khách thuê">
        {selectedTenant && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b pb-4">
              <div className="p-4 bg-primary/10 text-primary rounded-full">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{selectedTenant.fullName}</h3>
                <span className="inline-flex mt-1 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral text-neutral-foreground border border-slate-200">
                  Phòng: {selectedTenant.roomId?.name || selectedTenant.roomId || 'Không rõ'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 py-2">
              <div>
                <p className="text-sm text-slate-500 mb-1">Số điện thoại</p>
                <p className="font-medium text-slate-900">{selectedTenant.phoneNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Căn cước công dân</p>
                <p className="font-medium text-slate-900">{selectedTenant.identityCard}</p>
              </div>
            </div>
            <div className="pt-4 flex justify-between border-t border-slate-100 mt-2">
              <Button 
                variant="outline" 
                onClick={() => handleDeleteClick(selectedTenant)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 border-none"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Xóa
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Đóng</Button>
                <Button onClick={() => { setIsViewModalOpen(false); handleEditClick(selectedTenant); }} className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none">
                  Chỉnh sửa
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL XÁC NHẬN XÓA */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Xác nhận xóa">
        <div className="space-y-4">
          <p className="text-slate-600">Bạn có chắc chắn muốn xóa thông tin của khách <strong>{selectedTenant?.fullName}</strong> không? Hành động này không thể hoàn tác.</p>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Hủy</Button>
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
