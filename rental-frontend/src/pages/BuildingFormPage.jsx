import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buildingService } from "../services/building.service";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export function BuildingFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    type: "apartment",
    description: "",
    totalRooms: 0,
    contactPhone: "",
    status: "active",
    amenities: "",
    address: { street: "", ward: "", district: "", city: "" }
  });
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const fetchBuilding = async () => {
        try {
          const res = await buildingService.getById(id);
          const data = res.data?.building || res.data;
          setFormData({
            name: data.name || "",
            type: data.type || "apartment",
            description: data.description || "",
            totalRooms: data.totalRooms || 0,
            contactPhone: data.contactPhone || "",
            status: data.status || "active",
            amenities: Array.isArray(data.amenities) ? data.amenities.join(", ") : "",
            address: data.address || { street: "", ward: "", district: "", city: "" }
          });
        } catch (err) {
          toast.error(err.response?.data?.message || "Không thể tải thông tin tòa nhà");
          navigate("/buildings");
        } finally {
          setIsLoading(false);
        }
      };
      fetchBuilding();
    }
  }, [id, isEditing, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Process amenities from string "Wifi, Thang máy" to Array ["Wifi", "Thang máy"]
    const amenitiesArray = formData.amenities
      ? formData.amenities.split(",").map(item => item.trim()).filter(Boolean)
      : [];

    const submitData = {
      ...formData,
      amenities: amenitiesArray
    };

    const toastId = toast.loading(isEditing ? "Đang cập nhật..." : "Đang lưu...");

    try {
      if (isEditing) {
        await buildingService.update(id, submitData);
        toast.success("Cập nhật tòa nhà thành công!", { id: toastId });
      } else {
        await buildingService.create(submitData);
        toast.success("Thêm tòa nhà mới thành công!", { id: toastId });
      }
      navigate("/buildings");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lưu thất bại", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-slate-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/buildings")} className="border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors bg-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Trở lại
        </Button>
        <h2 className="text-2xl font-bold text-slate-900">
          {isEditing ? "Chỉnh sửa Tòa nhà" : "Thêm Tòa nhà mới"}
        </h2>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên Tòa nhà *</label>
                <Input name="name" value={formData.name} onChange={handleChange} required className="bg-white border-slate-300 text-slate-900 focus:border-primary focus:ring-primary" />
              </div>
              
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Loại hình</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleChange} 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                >
                  <option value="apartment">Chung cư</option>
                  <option value="boarding_house">Nhà trọ</option>
                  <option value="dormitory">Ký túc xá</option>
                  <option value="studio">Studio</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows={3}
                  className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-y"
                  placeholder="Mô tả chi tiết về tòa nhà..."
                ></textarea>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Tổng số phòng</label>
                <Input name="totalRooms" type="number" min="0" value={formData.totalRooms} onChange={handleChange} className="bg-white border-slate-300 text-slate-900 focus:border-primary" />
              </div>
              
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Điện thoại liên hệ</label>
                <Input name="contactPhone" value={formData.contactPhone} onChange={handleChange} className="bg-white border-slate-300 text-slate-900 focus:border-primary" placeholder="09..." />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiện ích chung</label>
                <Input name="amenities" value={formData.amenities} onChange={handleChange} className="bg-white border-slate-300 text-slate-900 focus:border-primary" placeholder="VD: WiFi, Thang máy, Bãi xe..." />
                <p className="text-xs text-slate-500 mt-1">Ngăn cách các tiện ích bằng dấu phẩy (,)</p>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange} 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm ngưng (Inactive)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Địa chỉ Tòa nhà</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số nhà, Tên đường</label>
                  <Input name="address.street" value={formData.address.street} onChange={handleChange} className="bg-white border-slate-300 text-slate-900 focus:border-primary" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phường/Xã</label>
                  <Input name="address.ward" value={formData.address.ward} onChange={handleChange} className="bg-white border-slate-300 text-slate-900 focus:border-primary" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quận/Huyện</label>
                  <Input name="address.district" value={formData.address.district} onChange={handleChange} className="bg-white border-slate-300 text-slate-900 focus:border-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tỉnh/Thành phố</label>
                  <Input name="address.city" value={formData.address.city} onChange={handleChange} className="bg-white border-slate-300 text-slate-900 focus:border-primary" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => navigate("/buildings")} className="border-slate-300 text-slate-700 hover:bg-slate-100 bg-white">
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isEditing ? "Cập nhật Tòa nhà" : "Thêm Tòa nhà"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
