import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buildingService } from "../services/building.service";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Loader2, ArrowLeft, Building, MapPin, Key, UserCheck, Phone, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const TYPE_LABELS = {
  apartment: "Chung cư",
  boarding_house: "Nhà trọ",
  dormitory: "Ký túc xá",
  studio: "Studio",
  other: "Khác",
};

export function BuildingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [building, setBuilding] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBuilding = async () => {
      try {
        const res = await buildingService.getById(id);
        setBuilding(res.data?.building || res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Không thể tải thông tin tòa nhà");
        navigate("/buildings");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBuilding();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-slate-600">Đang tải...</p>
      </div>
    );
  }

  if (!building) return null;

  const fullAddress = [
    building.address?.street,
    building.address?.ward,
    building.address?.district,
    building.address?.city,
  ].filter(Boolean).join(", ");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/buildings")} className="border-slate-300 text-slate-700 hover:bg-slate-100 bg-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Trở lại
        </Button>
        <h2 className="text-2xl font-bold text-slate-900">Chi tiết Tòa nhà</h2>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="h-40 bg-primary/10 flex items-center justify-center relative">
          <Building className="h-20 w-20 text-primary/30" />
          <div className="absolute bottom-4 right-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border shadow-sm ${
              building.status === 'active' 
                ? 'bg-green-100 text-green-700 border-green-200' 
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}>
              {building.status === 'active' ? 'Đang hoạt động' : 'Tạm ngưng'}
            </span>
          </div>
        </div>
        
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{building.name}</h1>
              <p className="text-slate-600 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                {fullAddress || "Chưa cập nhật địa chỉ"}
              </p>
            </div>
            <div className="bg-tertiary/10 text-tertiary px-4 py-2 rounded-full text-sm font-semibold border border-tertiary/20 whitespace-nowrap shadow-sm">
              {TYPE_LABELS[building.type] || building.type}
            </div>
          </div>

          {building.description && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Mô tả chung</h3>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                {building.description}
              </p>
            </div>
          )}

          {building.amenities && building.amenities.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Tiện ích</h3>
              <div className="flex flex-wrap gap-2">
                {building.amenities.map((amenity, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 text-sm rounded-lg border border-slate-200 shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          <h3 className="text-lg font-semibold text-slate-800 mb-4">Thông tin chi tiết</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100"><Key className="h-6 w-6 text-slate-500" /></div>
              <div>
                <p className="text-sm text-slate-500">Tổng số phòng</p>
                <p className="text-xl font-bold text-slate-900">{building.totalRooms || 0}</p>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100"><Phone className="h-6 w-6 text-slate-500" /></div>
              <div>
                <p className="text-sm text-slate-500">Số điện thoại liên hệ</p>
                <p className="text-xl font-bold text-slate-900">{building.contactPhone || "Chưa cập nhật"}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4 md:col-span-2 shadow-sm">
              {building.landlordId?.avatar ? (
                <img src={building.landlordId.avatar} alt="Avatar" className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-sm border-2 border-white">
                  {building.landlordId?.username?.substring(0,2).toUpperCase() || "LL"}
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500">Người quản lý (Chủ nhà)</p>
                <p className="text-lg font-bold text-slate-900">{building.landlordId?.username || "N/A"}</p>
                <p className="text-sm text-slate-500">{building.landlordId?.email || ""}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
            <Button onClick={() => navigate(`/buildings/${building._id}/edit`)} className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none px-6">
              Chỉnh sửa Tòa nhà
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
