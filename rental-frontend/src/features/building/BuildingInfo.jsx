import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building, MapPin, Key, Loader2, AlertCircle, Trash2, Edit, Eye, Plus, Phone } from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/Alert";
import { buildingService } from "../../services/building.service";
import toast from "react-hot-toast";

const TYPE_LABELS = {
  apartment: "Chung cư",
  boarding_house: "Nhà trọ",
  dormitory: "Ký túc xá",
  studio: "Studio",
  other: "Khác",
};

export function BuildingInfo() {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBuildings = async () => {
    try {
      setIsLoading(true);
      setError("");
      const result = await buildingService.getAll();
      setBuildings(result.data?.buildings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách tòa nhà.");
      toast.error("Lỗi khi tải danh sách tòa nhà!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tòa nhà này không?")) return;
    const toastId = toast.loading("Đang xóa tòa nhà...");
    try {
      await buildingService.delete(id);
      setBuildings(buildings.filter((b) => b._id !== id));
      toast.success("Xóa tòa nhà thành công!", { id: toastId });
    } catch (err) {
      toast.error("Xóa thất bại: " + (err.response?.data?.message || err.message), { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-slate-600">Đang tải danh sách tòa nhà...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={fetchBuildings} className="bg-primary hover:bg-primary-hover text-neutral-foreground">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Quản lý Tòa nhà</h2>
          <p className="text-slate-500">Xem và quản lý thông tin chi tiết của các tòa nhà.</p>
        </div>
        <Button 
          onClick={() => navigate("/buildings/new")}
          className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none transition-colors flex items-center gap-2 shadow-md"
        >
          <Plus className="h-4 w-4" /> Thêm Tòa nhà
        </Button>
      </div>

      {buildings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <Building className="h-12 w-12 text-slate-400" />
          <p className="text-lg font-medium text-slate-700">Chưa có tòa nhà nào trong hệ thống.</p>
          <p className="text-sm text-slate-500">Hãy thêm tòa nhà đầu tiên để bắt đầu quản lý.</p>
          <Button 
            onClick={() => navigate("/buildings/new")}
            className="mt-4 bg-tertiary hover:bg-tertiary/90 text-primary-foreground border-none transition-colors"
          >
            Thêm ngay
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {buildings.map((building) => {
            const fullAddress = [
              building.address?.street,
              building.address?.ward,
              building.address?.district,
              building.address?.city,
            ].filter(Boolean).join(", ");

            return (
              <Card key={building._id} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
                <CardContent className="p-0 flex flex-col h-full">
                  {/* Header part */}
                  <div className="p-5 border-b border-slate-100 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                          <Building className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-slate-900 line-clamp-1" title={building.name}>{building.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                              building.status === 'active' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {building.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1 line-clamp-1" title={fullAddress}>
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {fullAddress || "Chưa cập nhật địa chỉ"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {building.description && (
                      <p className="text-sm text-slate-600 mt-4 line-clamp-2" title={building.description}>
                        {building.description}
                      </p>
                    )}

                    {/* Amenities Tags */}
                    {building.amenities && building.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {building.amenities.slice(0, 4).map((amenity, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-md border border-slate-200">
                            {amenity}
                          </span>
                        ))}
                        {building.amenities.length > 4 && (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-md border border-slate-200">
                            +{building.amenities.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-5">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Key className="h-4 w-4 text-slate-400" />
                        <span>Tổng phòng: <strong className="text-slate-900">{building.totalRooms || 0}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span className="truncate">{building.contactPhone || "Chưa có"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700 col-span-2">
                        <span className="px-2 py-1 bg-tertiary/20 text-tertiary rounded-md text-xs font-semibold border border-tertiary/30">
                          {TYPE_LABELS[building.type] || building.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer part: Landlord and Actions */}
                  <div className="bg-slate-50 p-4 px-5 flex items-center justify-between border-t border-slate-100 mt-auto">
                    {/* Landlord Info */}
                    <div className="flex items-center gap-3">
                      {building.landlordId?.avatar ? (
                        <img src={building.landlordId.avatar} alt="Avatar" className="h-8 w-8 rounded-full object-cover border border-slate-300" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                          {building.landlordId?.username?.substring(0,2).toUpperCase() || "LL"}
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-slate-500">Chủ tòa nhà</p>
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">{building.landlordId?.username || "N/A"}</p>
                      </div>
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => navigate(`/buildings/${building._id}`)}
                        className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Xem chi tiết"
                        aria-label="Xem chi tiết tòa nhà"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => navigate(`/buildings/${building._id}/edit`)}
                        className="p-2 text-slate-500 hover:text-tertiary hover:bg-tertiary/10 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                        aria-label="Chỉnh sửa tòa nhà"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(building._id)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa tòa nhà"
                        aria-label="Xóa tòa nhà"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
