import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Home as HomeIcon, LogIn, ArrowRight, BedDouble, Maximize, ShieldCheck, Zap, Clock, Star } from "lucide-react";
import { Button } from "../components/ui/Button";
import { roomService } from "../services/room.service";
import { tenantService } from "../services/tenant.service";
import { useAuth } from "../context/AuthContext";
import { ImageCarousel } from "../components/ui/ImageCarousel";
import toast from "react-hot-toast";

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoading(true);
      try {
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

  const displayedRooms = [...rooms]
    .filter(room => {
      if (!searchKeyword) return true;
      const term = searchKeyword.toLowerCase();
      const matchName = room.name?.toLowerCase().includes(term);
      const matchBuilding = room.buildingId?.name?.toLowerCase().includes(term);
      return matchName || matchBuilding;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") {
        return a.price - b.price;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const handleSearch = () => {
    setSearchKeyword(searchInput);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      
      {/* 1. Transparent to Solid Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-gray-900/90 backdrop-blur-xl shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className={`flex items-center gap-2 font-black text-2xl cursor-pointer tracking-tight transition-colors ${scrolled ? 'text-primary' : 'text-white'}`} onClick={() => navigate("/")}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors ${scrolled ? 'bg-primary text-white shadow-primary/30' : 'bg-white text-primary shadow-black/10'}`}>
              <HomeIcon className="w-6 h-6" />
            </div>
            RentalMarket
          </div>
          <div>
            {user ? (
              <Button onClick={() => navigate(user?.role?.name === 'user' || user?.role === 'user' ? "/t" : "/dashboard")} className={`rounded-full px-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all ${scrolled ? '' : 'bg-white text-primary hover:bg-slate-50'}`}>
                Vào Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <div className="flex gap-3 items-center">
                <button onClick={() => navigate("/register")} className={`font-bold px-4 py-2 rounded-full transition-colors ${scrolled ? 'text-slate-600 hover:text-neutral-foreground hover:bg-slate-100' : 'text-white hover:text-white/80'}`}>
                  Đăng ký
                </button>
                <Button onClick={() => navigate("/login")} className={`rounded-full px-6 shadow-lg hover:-translate-y-0.5 transition-all ${scrolled ? 'shadow-primary/30' : 'bg-white text-primary hover:bg-slate-50'}`}>
                  <LogIn className="mr-2 w-4 h-4" /> Đăng nhập
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Modern Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 flex flex-col items-center justify-center min-h-[60vh] md:min-h-[70vh]">
        {/* Background Image / Gradient */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/40 z-10 mix-blend-multiply"></div>
          <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" alt="Hero background" className="w-full h-full object-cover filter brightness-75" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center text-white w-full max-w-4xl mx-auto mt-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-sm font-semibold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Star className="w-4 h-4 text-yellow-300" fill="currentColor" /> Nền tảng thuê phòng #1
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700">
            Tìm không gian sống <br className="hidden md:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400">hoàn hảo của bạn</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Khám phá hàng ngàn phòng trọ, căn hộ chất lượng cao với giá cả minh bạch và quy trình thuê siêu tốc.
          </p>

          {/* Floating Search Bar */}
          <div className="w-full max-w-3xl bg-white/10 backdrop-blur-xl p-2 md:p-3 rounded-full border border-white/20 shadow-2xl flex flex-col md:flex-row items-center gap-2 animate-in fade-in zoom-in-95 duration-700 delay-200">
            <div className="flex-1 w-full bg-white rounded-full flex items-center px-4 md:px-6 py-3 md:py-4">
              <Search className="w-5 h-5 text-primary shrink-0" />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo khu vực, tòa nhà..." 
                className="w-full bg-transparent border-none focus:outline-none text-slate-800 ml-3 font-medium placeholder:text-slate-400" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="w-full md:w-auto rounded-full px-8 py-4 md:py-6 text-base font-bold shadow-lg shadow-primary/30">
              Tìm kiếm
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Trust Indicators */}
      <section className="relative z-20 -mt-10 md:-mt-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-start gap-4 transform hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg mb-1">Xác thực 100%</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Mọi phòng trọ đều được kiểm duyệt kỹ lưỡng về chất lượng và an ninh.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-start gap-4 transform hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg mb-1">Thuê nhanh chóng</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Quy trình ký hợp đồng và thanh toán 100% online, tiện lợi và tức thì.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-start gap-4 transform hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg mb-1">Hỗ trợ 24/7</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Đội ngũ kỹ thuật và chủ nhà luôn sẵn sàng hỗ trợ bạn khi có sự cố.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Room Grid Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-2">Phòng trống nổi bật</h2>
            <p className="text-slate-500 text-lg">Khám phá những căn phòng tuyệt vời nhất đang chờ đón bạn.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setSortBy('newest')}
              className={`px-4 py-2 rounded-full border font-semibold transition-colors ${sortBy === 'newest' ? 'bg-primary border-primary text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary'}`}
            >
              Mới nhất
            </button>
            <button 
              onClick={() => setSortBy('price_asc')}
              className={`px-4 py-2 rounded-full border font-semibold transition-colors ${sortBy === 'price_asc' ? 'bg-primary border-primary text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary'}`}
            >
              Giá tốt
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : displayedRooms.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa tìm thấy phòng trống</h3>
            <p className="text-slate-500">Không có phòng nào phù hợp với tìm kiếm của bạn. Vui lòng thử lại!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {displayedRooms.map((room) => (
              <div key={room._id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-300 group flex flex-col overflow-hidden">
                
                {/* Image Section */}
                <div className="h-64 sm:h-72 bg-slate-100 relative overflow-hidden">
                  <ImageCarousel images={room.images} altText={room.name} />
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2 z-20">
                    <span className="bg-white/90 backdrop-blur-md text-emerald-600 text-xs font-black px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      TRỐNG
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="text-xl font-black text-slate-800 line-clamp-1 group-hover:text-primary transition-colors" title={room.name}>{room.name}</h3>
                  </div>
                  
                  <p className="text-slate-500 flex items-center gap-1.5 text-sm mb-4 font-medium" title={room.buildingId?.name}>
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" /> 
                    <span className="truncate">{room.buildingId?.name || "Khu vực chưa cập nhật"}</span>
                  </p>

                  {/* Room Features */}
                  <div className="flex gap-4 mb-6">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                        <Maximize className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold">{room.area ? `${room.area}m²` : '--'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                        <BedDouble className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold">Tối đa {room.maxCapacity || 2}</span>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-0.5">Giá thuê</p>
                      <p className="text-primary font-black text-xl lg:text-2xl flex items-baseline gap-1 truncate" title={`${room.price.toLocaleString("vi-VN")}đ/tháng`}>
                        {room.price.toLocaleString("vi-VN")}đ
                        <span className="text-xs font-bold text-slate-400">/tháng</span>
                      </p>
                    </div>
                    <Button onClick={() => handleRentClick(room._id)} className="shrink-0 rounded-2xl px-4 py-2 shadow-md hover:shadow-lg font-bold text-sm">
                      Thuê ngay
                    </Button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-primary font-black text-xl">
            <HomeIcon className="w-6 h-6" /> RentalMarket
          </div>
          <p className="text-slate-500 font-medium">© {new Date().getFullYear()} RentalMarket. Nền tảng quản lý phòng trọ cao cấp.</p>
        </div>
      </footer>
    </div>
  );
}
