import { Edit, Eye, DoorOpen } from "lucide-react";

export function RoomCard({ room, onEdit, onView }) {
  const isRented = room.status === 'rented';
  
  return (
    <div className={`relative overflow-hidden rounded-xl border ${isRented ? 'bg-primary/5 border-primary/20' : 'bg-tertiary/5 border-tertiary/20'} p-5 transition-all hover:shadow-md hover:-translate-y-1`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${isRented ? 'bg-primary/20 text-primary' : 'bg-tertiary/20 text-tertiary'}`}>
            <DoorOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">P.{room.name}</h3>
            <p className="text-sm text-slate-500">DT: {room.area} m²</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isRented ? 'bg-primary text-neutral-foreground' : 'bg-tertiary text-slate-900'}`}>
          {isRented ? 'Đang thuê' : 'Trống'}
        </div>
      </div>
      
      <div className="mb-6">
        <p className="text-sm text-slate-500">Giá thuê</p>
        <p className="text-lg font-bold text-slate-900">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.price)}
        </p>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => onView(room)}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors text-sm font-medium"
        >
          <Eye className="h-4 w-4" /> Chi tiết
        </button>
        <button 
          onClick={() => onEdit(room)}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors text-sm font-medium"
        >
          <Edit className="h-4 w-4" /> Sửa
        </button>
      </div>
    </div>
  );
}
