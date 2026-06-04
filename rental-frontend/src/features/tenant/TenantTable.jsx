import { Edit, Eye, Trash2, MapPin, Building, Phone } from "lucide-react";

export function TenantTable({ tenants, onEdit, onView, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Khách thuê</th>
              <th className="px-6 py-4 font-semibold">Thông tin cá nhân</th>
              <th className="px-6 py-4 font-semibold">Phòng thuê</th>
              <th className="px-6 py-4 font-semibold">Trạng thái</th>
              <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-lg font-medium text-slate-700">Không tìm thấy khách thuê nào.</p>
                    <p className="text-sm">Hãy thử thay đổi bộ lọc hoặc thêm khách mới.</p>
                  </div>
                </td>
              </tr>
            ) : (
              tenants.map(tenant => {
                const isActive = tenant.status === 'active';
                
                return (
                  <tr key={tenant._id || tenant.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* KHÁCH THUÊ */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                          {tenant.fullName?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{tenant.fullName}</p>
                          <p className="text-slate-500 flex items-center gap-1 text-xs mt-0.5">
                            <Phone className="h-3 w-3" /> {tenant.phoneNumber}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* THÔNG TIN CÁ NHÂN */}
                    <td className="px-6 py-4">
                      <p className="text-slate-900 font-medium">{tenant.identityCard}</p>
                      {tenant.homeTown && (
                        <p className="text-slate-500 flex items-center gap-1 text-xs mt-0.5 truncate max-w-[180px]" title={tenant.homeTown}>
                          <MapPin className="h-3 w-3 shrink-0" /> {tenant.homeTown}
                        </p>
                      )}
                      {tenant.email && (
                        <p className="text-slate-500 text-xs mt-0.5 truncate max-w-[180px]" title={tenant.email}>
                          {tenant.email}
                        </p>
                      )}
                    </td>

                    {/* PHÒNG THUÊ */}
                    <td className="px-6 py-4">
                      {tenant.roomId ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-tertiary/10 text-tertiary border border-tertiary/20">
                            P.{tenant.roomId.name || 'N/A'}
                          </span>
                          <p className="text-slate-500 flex items-center gap-1 text-xs mt-1.5">
                            <Building className="h-3 w-3" /> {tenant.roomId.buildingId?.name || 'Chưa gắn tòa nhà'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Không có dữ liệu</span>
                      )}
                    </td>

                    {/* TRẠNG THÁI */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                        isActive 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {isActive ? 'Đang thuê' : 'Đã rời đi'}
                      </span>
                    </td>

                    {/* THAO TÁC */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => onView(tenant)} 
                          className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer" 
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => onEdit(tenant)} 
                          className="p-2 text-slate-500 hover:text-tertiary hover:bg-tertiary/10 rounded-lg transition-colors cursor-pointer" 
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => onDelete(tenant)} 
                          className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" 
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
