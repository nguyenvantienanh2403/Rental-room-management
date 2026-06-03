import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buildingService } from "../services/building.service";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Loader2, ArrowLeft } from "lucide-react";

export function BuildingFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    type: "apartment",
    totalRooms: 0,
    contactPhone: "",
    address: { street: "", ward: "", district: "", city: "" }
  });
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditing) {
      const fetchBuilding = async () => {
        try {
          const res = await buildingService.getById(id);
          const data = res.data?.building || res.data;
          setFormData({
            name: data.name || "",
            type: data.type || "apartment",
            totalRooms: data.totalRooms || 0,
            contactPhone: data.contactPhone || "",
            address: data.address || { street: "", ward: "", district: "", city: "" }
          });
        } catch (err) {
          setError(err.response?.data?.message || "Không thể tải thông tin tòa nhà");
        } finally {
          setIsLoading(false);
        }
      };
      fetchBuilding();
    }
  }, [id, isEditing]);

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
    setError("");
    try {
      if (isEditing) {
        await buildingService.update(id, formData);
      } else {
        await buildingService.create(formData);
      }
      navigate("/buildings");
    } catch (err) {
      setError(err.response?.data?.message || "Lưu thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-slate-400">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/buildings")} className="border-white/20 text-slate-300 hover:bg-white/10 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Trở lại
        </Button>
        <h2 className="text-2xl font-bold text-white">
          {isEditing ? "Chỉnh sửa Tòa nhà" : "Thêm Tòa nhà mới"}
        </h2>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-300 mb-1">Tên Tòa nhà *</label>
                <Input name="name" value={formData.name} onChange={handleChange} required className="bg-neutral border-white/20 text-white" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-300 mb-1">Loại hình</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleChange} 
                  className="flex h-10 w-full rounded-md border border-white/20 bg-neutral px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="apartment">Chung cư</option>
                  <option value="boarding_house">Nhà trọ</option>
                  <option value="dormitory">Ký túc xá</option>
                  <option value="studio">Studio</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-300 mb-1">Tổng phòng</label>
                <Input name="totalRooms" type="number" min="0" value={formData.totalRooms} onChange={handleChange} className="bg-neutral border-white/20 text-white" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-300 mb-1">Điện thoại liên hệ</label>
                <Input name="contactPhone" value={formData.contactPhone} onChange={handleChange} className="bg-neutral border-white/20 text-white" />
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-lg font-medium text-white mb-4">Địa chỉ</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Số nhà, Đường</label>
                  <Input name="address.street" value={formData.address.street} onChange={handleChange} className="bg-neutral border-white/20 text-white" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phường/Xã</label>
                  <Input name="address.ward" value={formData.address.ward} onChange={handleChange} className="bg-neutral border-white/20 text-white" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Quận/Huyện</label>
                  <Input name="address.district" value={formData.address.district} onChange={handleChange} className="bg-neutral border-white/20 text-white" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tỉnh/Thành phố</label>
                  <Input name="address.city" value={formData.address.city} onChange={handleChange} className="bg-neutral border-white/20 text-white" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button type="button" variant="outline" onClick={() => navigate("/buildings")} className="border-white/20 text-slate-300 hover:bg-white/10 hover:text-white">
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-secondary text-white border-none">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isEditing ? "Cập nhật" : "Lưu Tòa nhà"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
