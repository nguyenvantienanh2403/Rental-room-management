import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buildingService } from "../services/building.service";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Loader2, ArrowLeft, Building, MapPin, Key, UserCheck, Phone } from "lucide-react";

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
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBuilding = async () => {
      try {
        const res = await buildingService.getById(id);
        setBuilding(res.data?.building || res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Không thể tải thông tin tòa nhà");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBuilding();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-slate-400">Đang tải...</p>
      </div>
    );
  }

  if (error || !building) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-400 mb-4">{error || "Tòa nhà không tồn tại."}</p>
        <Button onClick={() => navigate("/buildings")} className="bg-primary hover:bg-secondary text-white border-none">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const fullAddress = [
    building.address?.street,
    building.address?.ward,
    building.address?.district,
    building.address?.city,
  ].filter(Boolean).join(", ");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/buildings")} className="border-white/20 text-slate-300 hover:bg-white/10 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Trở lại
        </Button>
        <h2 className="text-2xl font-bold text-white">Chi tiết Tòa nhà</h2>
      </div>

      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <div className="h-32 bg-primary/20 flex items-center justify-center">
          <Building className="h-16 w-16 text-primary/50" />
        </div>
        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{building.name}</h1>
              <p className="text-slate-400 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                {fullAddress || "Chưa cập nhật địa chỉ"}
              </p>
            </div>
            <div className="bg-tertiary/20 text-tertiary px-4 py-2 rounded-full text-sm font-semibold border border-tertiary/30">
              {TYPE_LABELS[building.type] || building.type}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-neutral/50 p-4 rounded-lg border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-full"><Key className="h-6 w-6 text-slate-300" /></div>
              <div>
                <p className="text-sm text-slate-400">Tổng số phòng</p>
                <p className="text-xl font-semibold text-white">{building.totalRooms || 0}</p>
              </div>
            </div>
            <div className="bg-neutral/50 p-4 rounded-lg border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-full"><Phone className="h-6 w-6 text-slate-300" /></div>
              <div>
                <p className="text-sm text-slate-400">Số điện thoại</p>
                <p className="text-xl font-semibold text-white">{building.contactPhone || "Chưa có"}</p>
              </div>
            </div>
            <div className="bg-neutral/50 p-4 rounded-lg border border-white/5 flex items-center gap-4 md:col-span-2">
              <div className="p-3 bg-white/5 rounded-full"><UserCheck className="h-6 w-6 text-slate-300" /></div>
              <div>
                <p className="text-sm text-slate-400">Chủ sở hữu (ID)</p>
                <p className="text-base font-semibold text-white">{building.landlordId?.username || building.landlordId || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex justify-end gap-3">
            <Button onClick={() => navigate(`/buildings/${building._id}/edit`)} className="bg-primary hover:bg-secondary text-white border-none">
              Chỉnh sửa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
