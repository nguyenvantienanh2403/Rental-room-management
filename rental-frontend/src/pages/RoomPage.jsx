import { useState, useEffect } from "react";
import { Plus, Loader2, Trash2, DoorOpen } from "lucide-react";
import { roomService } from "../services/room.service";
import { RoomCard } from "../features/room/RoomCard";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function RoomPage() {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({ name: '', area: '', price: '', status: 'available' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const response = await roomService.getAll();
      // Auto extract array if wrapped in payload, data, rooms, etc.
      let list = [];
      if (Array.isArray(response)) list = response;
      else if (response && Array.isArray(response.data)) list = response.data;
      else if (response && Array.isArray(response.rooms)) list = response.rooms;
      else if (response && response.data && Array.isArray(response.data.rooms)) list = response.data.rooms;
      else if (response && Array.isArray(response.payload)) list = response.payload;
      else if (response && Array.isArray(response.items)) list = response.items;
      else if (response && response.data && Array.isArray(response.data.data)) list = response.data.data;
      
      setRooms(list);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedRoom(null);
    setFormData({ name: '', area: '', price: '', status: 'available' });
    setIsFormModalOpen(true);
  };

  const handleEditClick = (room) => {
    setSelectedRoom(room);
    setFormData({ ...room });
    setIsFormModalOpen(true);
  };

  const handleViewClick = (room) => {
    setSelectedRoom(room);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (room) => {
    setSelectedRoom(room);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert("Vui lòng điền đủ thông tin bắt buộc!");
      return;
    }
    
    setIsSaving(true);
    try {
      if (selectedRoom) {
        const roomId = selectedRoom._id || selectedRoom.id;
        await roomService.update(roomId, formData);
      } else {
        await roomService.create(formData);
      }
      await fetchRooms();
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
      const roomId = selectedRoom._id || selectedRoom.id;
      await roomService.delete(roomId);
      await fetchRooms();
      setIsDeleteModalOpen(false);
      setIsViewModalOpen(false);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Quản lý Phòng</h2>
          <p className="text-slate-500">Xem và quản lý tất cả các phòng trong hệ thống.</p>
        </div>
        <Button onClick={handleAddClick} className="bg-primary hover:bg-primary-hover text-neutral-foreground">
          <Plus className="h-5 w-5 mr-2" /> Thêm phòng mới
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {rooms.map(room => (
            <RoomCard 
              key={room._id || room.id} 
              room={room} 
              onEdit={handleEditClick} 
              onView={handleViewClick} 
            />
          ))}
        </div>
      )}

      {/* MODAL FORM (THÊM/SỬA) */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={selectedRoom ? "Chỉnh sửa Phòng" : "Thêm Phòng Mới"}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên/Số phòng *</label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="VD: 101" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Diện tích (m2)</label>
            <Input 
              type="number"
              value={formData.area} 
              onChange={e => setFormData({...formData, area: Number(e.target.value)})}
              placeholder="VD: 30" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Giá thuê (VNĐ) *</label>
            <Input 
              type="number" 
              value={formData.price} 
              onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
              placeholder="VD: 3500000" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
            <select 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value})}
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="available">Trống</option>
              <option value="rented">Đang thuê</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {selectedRoom ? "Cập nhật" : "Lưu"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL CHI TIẾT */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Chi tiết Phòng">
        {selectedRoom && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b pb-4">
              <div className={`p-4 rounded-full ${selectedRoom.status === 'rented' ? 'bg-primary/20 text-primary' : 'bg-tertiary/20 text-tertiary'}`}>
                <DoorOpen className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Phòng {selectedRoom.name}</h3>
                <p className="text-slate-500">Diện tích: {selectedRoom.area} m²</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div>
                <p className="text-sm text-slate-500">Giá thuê</p>
                <p className="font-semibold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedRoom.price)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Trạng thái</p>
                <div className={`inline-flex px-2.5 py-1 mt-1 rounded-full text-xs font-semibold ${selectedRoom.status === 'rented' ? 'bg-primary text-neutral-foreground' : 'bg-tertiary text-neutral'}`}>
                  {selectedRoom.status === 'rented' ? 'Đang thuê' : 'Trống'}
                </div>
              </div>
            </div>
            <div className="pt-4 flex justify-between border-t mt-2">
              <Button 
                variant="outline" 
                onClick={() => handleDeleteClick(selectedRoom)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 border-none"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Xóa
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Đóng</Button>
                <Button onClick={() => { setIsViewModalOpen(false); handleEditClick(selectedRoom); }} className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none">
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
          <p className="text-slate-600">Bạn có chắc chắn muốn xóa phòng <strong>{selectedRoom?.name}</strong> không? Hành động này không thể hoàn tác.</p>
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
