import { Edit, Eye, DoorOpen, Trash2, Users, Maximize, Building } from "lucide-react";

export function RoomCard({ room, onEdit, onView, onDelete }) {
  const isRented = room.status === 'rented';
  const tenantCount = Array.isArray(room.tenants) ? room.tenants.length : 0;
  
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col h-full ${isRented ? 'border-primary/20' : 'border-tertiary/30'}`}>
      <div className="p-5 flex-1 border-b border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isRented ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'}`}>
              <DoorOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 line-clamp-1" title={room.name}>P.{room.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                  isRented 
                    ? 'bg-primary/10 text-primary border-primary/20' 
                    : 'bg-green-50 text-green-600 border-green-200'
                }`}>
                  {isRented ? 'Đang thuê' : 'Trống'}
                </span>
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1 line-clamp-1">
                <Building className="h-3.5 w-3.5 shrink-0" />
                {room.buildingId?.name || "Chưa gắn tòa nhà"}
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-5 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Maximize className="h-4 w-4 text-slate-400 shrink-0" />
            <span>DT: <strong className="text-slate-900">{room.area || 0} m²</strong></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Users className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="truncate">Người: <strong className="text-slate-900">{tenantCount}/{room.maxCapacity || 0}</strong></span>
          </div>
        </div>

        {room.amenities && room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
            {room.amenities.slice(0, 3).map((amenity, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-md border border-slate-200 truncate max-w-[80px]" title={amenity}>
                {amenity}
              </span>
            ))}
            {room.amenities.length > 3 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-md border border-slate-200">
                +{room.amenities.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-4 flex items-center justify-between mt-auto">
        <div>
          <p className="text-xs text-slate-500">Giá thuê/tháng</p>
          <p className="text-lg font-bold text-slate-900">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.price || 0)}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => onView(room)}
            className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button 
            onClick={() => onEdit(room)}
            className="p-2 text-slate-500 hover:text-tertiary hover:bg-tertiary/10 rounded-lg transition-colors"
            title="Chỉnh sửa"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            onClick={() => onDelete(room)}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa phòng"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
