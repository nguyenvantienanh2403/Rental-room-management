import { Edit, Eye, Trash2 } from "lucide-react";

export function TenantTable({ tenants, onEdit, onView, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Họ và tên</th>
              <th className="px-6 py-4 font-semibold">Liên hệ</th>
              <th className="px-6 py-4 font-semibold">CCCD</th>
              <th className="px-6 py-4 font-semibold">Phòng</th>
              <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                  Không tìm thấy khách thuê nào.
                </td>
              </tr>
            ) : (
              tenants.map(tenant => (
                <tr key={tenant._id || tenant.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{tenant.fullName}</td>
                  <td className="px-6 py-4 text-slate-600">{tenant.phoneNumber}</td>
                  <td className="px-6 py-4 text-slate-600">{tenant.identityCard}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral text-neutral-foreground border border-slate-200">
                      {tenant.roomId?.name || tenant.roomId || 'Không rõ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onView(tenant)} className="p-1.5 text-slate-600 hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Chi tiết">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => onEdit(tenant)} className="p-1.5 text-slate-600 hover:text-secondary hover:bg-secondary/10 rounded transition-colors" title="Sửa">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => onDelete(tenant)} className="p-1.5 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Xóa">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
