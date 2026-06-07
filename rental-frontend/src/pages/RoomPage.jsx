import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Loader2, Trash2, DoorOpen, Building, CheckCircle2, Maximize, Users } from "lucide-react";
import { Pagination } from "../components/ui/Pagination";
import { roomService } from "../services/room.service";
import { buildingService } from "../services/building.service";
import { RoomCard } from "../features/room/RoomCard";
import { ImageCarousel } from "../components/ui/ImageCarousel";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import toast from "react-hot-toast";

export function RoomPage() {
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRoomsCount, setTotalRoomsCount] = useState(0);
  
  const fetchIdRef = useRef(0);
  const prevBuildingIdRef = useRef("");
  
  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    buildingId: '',
    area: '', 
    price: '', 
    maxCapacity: '',
    amenities: '',
    status: 'available' 
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load buildings first
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const result = await buildingService.getAll();
        const bList = result.data?.buildings || [];
        setBuildings(bList);
        if (bList.length > 0) {
          setSelectedBuildingId(bList[0]._id);
        }
      } catch (error) {
        toast.error("Không thể tải danh sách tòa nhà");
      } finally {
        setIsLoadingBuildings(false);
      }
    };
    fetchBuildings();
  }, []);

  const fetchRooms = useCallback(async (page = 1, buildingId = selectedBuildingId) => {
    if (!buildingId) return;
    const currentFetchId = ++fetchIdRef.current;
    setIsLoadingRooms(true);
    try {
      let response;
      const params = { page, limit: 8 };
      if (buildingId === "all") {
        response = await roomService.getAll(params);
      } else {
        response = await roomService.getByBuilding(buildingId, params);
      }
      
      if (currentFetchId !== fetchIdRef.current) return;

      let list = [];
      let totalP = 1;
      let currP = 1;
      let totalCount = 0;
      
      if (response && response.data) {
        list = response.data.rooms || [];
        currP = response.data.pagination?.page || 1;
        totalP = response.data.pagination?.totalPages || 1;
        totalCount = response.data.pagination?.totalCount || list.length;
      } else if (response && response.rooms) {
        list = response.rooms || [];
        currP = response.pagination?.page || 1;
        totalP = response.pagination?.totalPages || 1;
        totalCount = response.pagination?.totalCount || list.length;
      } else if (Array.isArray(response)) {
        list = response;
        totalCount = response.length;
      }
      
      setRooms(list);
      setCurrentPage(currP);
      setTotalPages(totalP);
      setTotalRoomsCount(totalCount);
    } catch (error) {
      toast.error("Không thể tải danh sách phòng");
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoadingRooms(false);
      }
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    if (isLoadingBuildings) return;
    
    // If building selection changed but currentPage has not reset to 1 yet,
    // wait for currentPage to become 1 to avoid fetching the wrong page index.
    if (prevBuildingIdRef.current !== selectedBuildingId && currentPage !== 1) {
      prevBuildingIdRef.current = selectedBuildingId;
      return;
    }
    prevBuildingIdRef.current = selectedBuildingId;

    fetchRooms(currentPage, selectedBuildingId);
  }, [isLoadingBuildings, selectedBuildingId, currentPage, fetchRooms]);

  const handleAddClick = () => {
    setSelectedRoom(null);
    setFormData({ 
      name: '', 
      buildingId: selectedBuildingId !== "all" ? selectedBuildingId : (buildings.length > 0 ? buildings[0]._id : ''),
      area: '', 
      price: '', 
      maxCapacity: '',
      amenities: '',
      status: 'available' 
    });
    setImageFiles([]);
    setExistingImages([]);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (room) => {
    setSelectedRoom(room);
    setFormData({ 
      name: room.name || '',
      buildingId: room.buildingId?._id || room.buildingId || '',
      area: room.area || '',
      price: room.price || '',
      maxCapacity: room.maxCapacity || '',
      amenities: Array.isArray(room.amenities) ? room.amenities.join(", ") : "",
      status: room.status || 'available'
    });
    setImageFiles([]);
    setExistingImages(room.images || []);
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
    if (!formData.name || !formData.price || !formData.buildingId) {
      toast.error("Vui lòng điền đủ thông tin bắt buộc!");
      return;
    }
    
    setIsSaving(true);
    const toastId = toast.loading(selectedRoom ? "Đang cập nhật phòng..." : "Đang thêm phòng...");
    
    try {
      const amenitiesArray = formData.amenities
        ? formData.amenities.split(",").map(item => item.trim()).filter(Boolean)
        : [];

      let uploadedImageUrls = [];
      if (imageFiles.length > 0) {
        toast.loading("Đang tải ảnh lên...", { id: toastId });
        const uploadData = new FormData();
        imageFiles.forEach(file => uploadData.append("images", file));
        const uploadRes = await roomService.uploadImages(uploadData);
        
        // uploadRes could be { data: [...] } or just [...]
        let extractedUrls = uploadRes;
        if (uploadRes && uploadRes.data) {
          extractedUrls = uploadRes.data;
        }
        
        if (Array.isArray(extractedUrls)) {
          uploadedImageUrls = extractedUrls;
        } else if (typeof extractedUrls === 'string') {
          uploadedImageUrls = [extractedUrls];
        }
      }

      const submitData = {
        ...formData,
        price: Number(formData.price),
        area: Number(formData.area),
        maxCapacity: Number(formData.maxCapacity),
        amenities: amenitiesArray,
        images: [...existingImages, ...uploadedImageUrls]
      };

      if (selectedRoom) {
        const roomId = selectedRoom._id || selectedRoom.id;
        await roomService.update(roomId, submitData);
        toast.success("Cập nhật phòng thành công!", { id: toastId });
        await fetchRooms(currentPage);
      } else {
        await roomService.create(submitData);
        toast.success("Thêm phòng mới thành công!", { id: toastId });
        await fetchRooms(1);
      }
      setIsFormModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lưu thất bại", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    setIsSaving(true);
    const toastId = toast.loading("Đang xóa phòng...");
    try {
      const roomId = selectedRoom._id || selectedRoom.id;
      await roomService.delete(roomId);
      
      // Calculate target page: if last room on the page was deleted and currentPage > 1, go to previous page
      const isLastRoomOnPage = rooms.length === 1;
      const targetPage = (isLastRoomOnPage && currentPage > 1) ? currentPage - 1 : currentPage;
      
      await fetchRooms(targetPage);
      setIsDeleteModalOpen(false);
      setIsViewModalOpen(false);
      toast.success("Xóa phòng thành công!", { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.message || "Xóa thất bại", { id: toastId });
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
        <Button onClick={handleAddClick} className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none shadow-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm phòng mới
        </Button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full max-w-md">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Building className="h-5 w-5" />
          </div>
          <select
            className="block w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm bg-white text-slate-900 font-medium transition-colors"
            value={selectedBuildingId}
            onChange={(e) => {
              setSelectedBuildingId(e.target.value);
              setCurrentPage(1);
            }}
            disabled={isLoadingBuildings}
          >
            {isLoadingBuildings && <option value="">Đang tải tòa nhà...</option>}
            {buildings.length === 0 && !isLoadingBuildings && <option value="">Chưa có tòa nhà nào</option>}
            {buildings.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
            {buildings.length > 0 && <option value="all">-- Tất cả tòa nhà --</option>}
          </select>
        </div>
        <div className="text-sm text-slate-500 font-medium bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
          Tổng số phòng: <strong className="text-slate-900 text-base">{totalRoomsCount}</strong>
        </div>
      </div>

      {isLoadingRooms || isLoadingBuildings ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <DoorOpen className="h-12 w-12 text-slate-400" />
          <p className="text-lg font-medium text-slate-700">Chưa có phòng nào.</p>
          <p className="text-sm text-slate-500">Hãy chuyển tòa nhà khác hoặc tạo phòng mới.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {rooms.map(room => (
            <RoomCard 
              key={room._id || room.id} 
              room={room} 
              onEdit={handleEditClick} 
              onView={handleViewClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {rooms.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      {/* MODAL FORM (THÊM/SỬA) */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={selectedRoom ? "Chỉnh sửa Phòng" : "Thêm Phòng Mới"}>
        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tòa nhà *</label>
              <select 
                value={formData.buildingId} 
                onChange={e => setFormData({...formData, buildingId: e.target.value})}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="" disabled>Chọn tòa nhà</option>
                {buildings.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên/Số phòng *</label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="VD: P101" 
                required 
                className="bg-white border-slate-300 focus:ring-primary"
              />
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Diện tích (m²)</label>
              <Input 
                type="number"
                value={formData.area} 
                onChange={e => setFormData({...formData, area: e.target.value})}
                placeholder="VD: 30" 
                className="bg-white border-slate-300 focus:ring-primary"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Sức chứa (Người)</label>
              <Input 
                type="number"
                value={formData.maxCapacity} 
                onChange={e => setFormData({...formData, maxCapacity: e.target.value})}
                placeholder="VD: 3" 
                className="bg-white border-slate-300 focus:ring-primary"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Giá thuê (VNĐ) *</label>
              <Input 
                type="number" 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: e.target.value})} 
                placeholder="VD: 3500000" 
                required 
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
                <option value="available">Trống (Available)</option>
                <option value="rented">Đang thuê (Rented)</option>
                <option value="maintenance">Bảo trì (Maintenance)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tiện ích trong phòng</label>
              <Input 
                value={formData.amenities} 
                onChange={e => setFormData({...formData, amenities: e.target.value})} 
                placeholder="VD: Điều hòa, Máy nước nóng, Giường..." 
                className="bg-white border-slate-300 focus:ring-primary"
              />
              <p className="text-xs text-slate-500 mt-1">Ngăn cách các tiện ích bằng dấu phẩy (,)</p>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Hình ảnh phòng</label>
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={(e) => setImageFiles(Array.from(e.target.files))}
                className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none"
              />
              {existingImages.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {existingImages.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded overflow-hidden border">
                      <img src={img} alt="room" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setExistingImages(existingImages.filter((_, i) => i !== idx))}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-bl px-1 text-xs"
                      >X</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)} className="bg-white">Hủy bỏ</Button>
            <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {selectedRoom ? "Cập nhật Phòng" : "Lưu Phòng Mới"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL CHI TIẾT */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Chi tiết Phòng">
        {selectedRoom && (
          <div className="space-y-6">
            {selectedRoom.images && selectedRoom.images.length > 0 && (
              <div className="h-64 w-full rounded-xl overflow-hidden shadow-sm border border-slate-100">
                <ImageCarousel images={selectedRoom.images} altText={selectedRoom.name} />
              </div>
            )}
            
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className={`p-4 rounded-xl shadow-sm ${selectedRoom.status === 'rented' ? 'bg-primary/10 text-primary' : 'bg-green-50 text-green-600'}`}>
                <DoorOpen className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900">P.{selectedRoom.name}</h3>
                <p className="text-slate-500 flex items-center gap-1 mt-1">
                  <Building className="h-4 w-4" /> 
                  {selectedRoom.buildingId?.name || "N/A"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3 items-center">
                <Maximize className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Diện tích</p>
                  <p className="font-bold text-slate-900">{selectedRoom.area || 0} m²</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3 items-center">
                <Users className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Sức chứa</p>
                  <p className="font-bold text-slate-900">{selectedRoom.tenants?.length || 0} / {selectedRoom.maxCapacity || 0} Người</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 col-span-2 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500">Giá thuê</p>
                  <p className="text-xl font-bold text-primary">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedRoom.price)}
                  </p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm ${
                  selectedRoom.status === 'rented' 
                    ? 'bg-primary text-neutral-foreground border-primary/50' 
                    : 'bg-green-100 text-green-700 border-green-200'
                }`}>
                  {selectedRoom.status === 'rented' ? 'Đang thuê' : 'Trống'}
                </div>
              </div>
            </div>

            {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Tiện ích trong phòng</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRoom.amenities.map((amenity, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 text-sm rounded-lg border border-slate-200">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* DANH SÁCH KHÁCH THUÊ */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Khách đang thuê ({selectedRoom.tenants?.length || 0})</h4>
              {selectedRoom.tenants && selectedRoom.tenants.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {selectedRoom.tenants.map(tenant => (
                    <div key={tenant._id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center font-bold">
                        {tenant.fullName?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{tenant.fullName}</p>
                        <p className="text-xs text-slate-500">{tenant.phoneNumber} • {tenant.identityCard}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-lg text-center border border-slate-100">
                  Phòng hiện chưa có khách thuê.
                </p>
              )}
            </div>

            <div className="pt-5 flex justify-between border-t border-slate-100 mt-4">
              <Button 
                variant="outline" 
                onClick={() => handleDeleteClick(selectedRoom)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 border-none px-4"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Xóa phòng
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="bg-white">Đóng</Button>
                <Button onClick={() => { setIsViewModalOpen(false); handleEditClick(selectedRoom); }} className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none px-6">
                  Chỉnh sửa
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL XÁC NHẬN XÓA */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Xác nhận xóa phòng">
        <div className="space-y-4">
          <p className="text-slate-600">
            Bạn có chắc chắn muốn xóa phòng <strong className="text-slate-900">{selectedRoom?.name}</strong> không? Hành động này không thể hoàn tác.
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
