import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Home as HomeIcon, LogIn, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/Button";
import { roomService } from "../services/room.service";
import { tenantService } from "../services/tenant.service";
import { authService } from "../services/auth.service";
import { ImageCarousel } from "../components/ui/ImageCarousel";
import toast from "react-hot-toast";

export function HomePage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoading(true);
      try {
        // Fetch user status
        try {
          const userRes = await authService.getMe();
          const userData = userRes?.data || userRes;
          setUser(userData);
        } catch (err) {
          setUser(null); // Not logged in
        }

        // Fetch available rooms
        const res = await roomService.getPublic({ status: "available" });
        const roomData = Array.isArray(res) ? res : (res?.data?.rooms || res?.data || []);
        setRooms(roomData);
      } catch (err) {
        console.error("Failed to load marketplace", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const handleRentClick = async (roomId) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thuê phòng!");
      navigate("/login");
      return;
    }

    try {
      await tenantService.rent(roomId);
      toast.success("Thuê phòng thành công! Bạn có thể xem hợp đồng và hóa đơn tại Dashboard.");
      navigate("/t");
    } catch (err) {
      toast.error(err.response?.data?.message || "Thuê phòng thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center pb-24">
      {/* Header Bar */}
      <div className="w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center fixed top-0 z-50">
        <div className="flex items-center gap-2 text-primary font-bold text-xl cursor-pointer" onClick={() => navigate("/")}>
          <HomeIcon className="w-6 h-6" /> RentalMarket
        </div>
        <div>
          {user ? (
            <Button onClick={() => navigate(user?.role?.name === 'user' || user?.role === 'user' ? "/t" : "/dashboard")} className="rounded-full px-6">
              Vào Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/register")} className="rounded-full px-6 border-slate-200">Đăng ký</Button>
              <Button onClick={() => navigate("/login")} className="rounded-full px-6"><LogIn className="mr-2 w-4 h-4" /> Đăng nhập</Button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full bg-primary pt-32 pb-16 px-4 flex flex-col items-center text-center text-white mt-0">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Tìm Phòng Trọ Mơ Ước Của Bạn</h1>
        <p className="text-primary-foreground/80 mb-8 max-w-2xl text-lg">Hệ thống cho thuê phòng trọ uy tín, nhanh chóng và minh bạch nhất hiện nay.</p>
        <div className="bg-white p-2 rounded-2xl w-full max-w-2xl shadow-xl flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 text-slate-500">
            <Search className="w-5 h-5" />
            <input type="text" placeholder="Tìm kiếm khu vực..." className="w-full bg-transparent border-none focus:outline-none text-slate-800" />
          </div>
          <Button className="rounded-xl px-6">Tìm kiếm</Button>
        </div>
      </div>

      <div className="w-full max-w-6xl px-4 py-12 mt-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-2">
          <HomeIcon className="text-primary" /> Phòng trống nổi bật
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-500">Hiện tại chưa có phòng nào trống. Vui lòng quay lại sau!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
                <div className="h-48 bg-slate-200 relative overflow-hidden rounded-t-2xl">
                  <ImageCarousel images={room.images} altText={room.name} />
                  <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-20">Có sẵn</div>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold text-slate-800 mb-2 truncate" title={room.name}>{room.name}</h3>
                  <p className="text-slate-500 flex items-center gap-2 text-sm mb-4 line-clamp-1" title={room.buildingId?.name}>
                    <MapPin className="w-4 h-4 text-primary" /> {room.buildingId?.name || "Khu vực chưa cập nhật"}
                  </p>
                  <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-end">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Giá thuê</p>
                      <p className="text-primary font-bold text-xl">
                        {room.price.toLocaleString("vi-VN")}đ<span className="text-sm font-normal text-slate-500">/tháng</span>
                      </p>
                    </div>
                    <Button onClick={() => handleRentClick(room._id)} className="rounded-xl shadow-md">Thuê ngay</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
