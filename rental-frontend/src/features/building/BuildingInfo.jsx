import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building, MapPin, Layers, Key, UserCheck, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/Alert";
import { buildingService } from "../../services/building.service";

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

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tòa nhà này không?")) return;
    try {
      await buildingService.delete(id);
      setBuildings(buildings.filter((b) => b._id !== id));
    } catch (err) {
      alert("Xóa thất bại: " + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setIsLoading(true);
        setError("");
        const result = await buildingService.getAll();
        setBuildings(result.data?.buildings || []);
      } catch (err) {
        setError(err.response?.data?.message || "Không thể tải danh sách tòa nhà.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuildings();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-slate-400">Đang tải danh sách tòa nhà...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <Alert variant="destructive" className="bg-red-950 border-red-900 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => window.location.reload()} className="bg-primary hover:bg-secondary">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Quản lý Tòa nhà</h2>
          <p className="text-slate-400">Xem và quản lý thông tin các tòa nhà thuộc hệ thống.</p>
        </div>
        <Button 
          onClick={() => navigate("/buildings/new")}
          className="bg-primary hover:bg-secondary text-white border-none transition-colors"
        >
          Thêm Tòa nhà
        </Button>
      </div>

      {buildings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
          <Building className="h-12 w-12 text-slate-500" />
          <p className="text-lg text-slate-400">Chưa có tòa nhà nào trong hệ thống.</p>
          <p className="text-sm text-slate-500">Hãy thêm tòa nhà đầu tiên để bắt đầu quản lý.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {buildings.map((building) => {
            const fullAddress = [
              building.address?.street,
              building.address?.ward,
              building.address?.district,
              building.address?.city,
            ].filter(Boolean).join(", ");

            return (
              <Card key={building._id} className="bg-white/5 border-white/10 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/20 rounded-lg text-primary">
                        <Building className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{building.name}</h3>
                        <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {fullAddress || "Chưa cập nhật địa chỉ"}
                        </p>
                      </div>
                    </div>
                    <div className="bg-tertiary/20 text-tertiary px-3 py-1 rounded-full text-xs font-semibold border border-tertiary/30">
                      {TYPE_LABELS[building.type] || building.type}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-300">Tổng phòng: <strong className="text-white">{building.totalRooms || 0}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-300">Chủ: <strong className="text-white">{building.landlordId?.username || "N/A"}</strong></span>
                    </div>
                    {building.contactPhone && (
                      <div className="flex items-center gap-2 col-span-2">
                        <span className="text-sm text-slate-300">SĐT: <strong className="text-white">{building.contactPhone}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex gap-2">
                    <Button 
                      onClick={() => navigate(`/buildings/${building._id}`)}
                      variant="outline" 
                      className="flex-1 border-white/20 text-slate-300 hover:bg-white/10 hover:text-white"
                    >
                      Chi tiết
                    </Button>
                    <Button 
                      onClick={() => navigate(`/buildings/${building._id}/edit`)}
                      className="flex-1 bg-primary/20 text-primary hover:bg-primary hover:text-white border-none transition-colors"
                    >
                      Chỉnh sửa
                    </Button>
                    <Button 
                      onClick={() => handleDelete(building._id)}
                      variant="destructive" 
                      className="bg-red-900/50 text-red-400 hover:bg-red-600 hover:text-white border-none transition-colors px-3"
                      title="Xóa tòa nhà"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
