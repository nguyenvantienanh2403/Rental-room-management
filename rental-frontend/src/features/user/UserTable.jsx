import { Trash2 } from "lucide-react";

export function UserTable({ users, onDelete }) {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (!users || users.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center shadow-sm">
        <p className="text-slate-500">Không tìm thấy người dùng nào.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">Tên đăng nhập</th>
              <th scope="col" className="px-6 py-4 font-semibold">Email</th>
              <th scope="col" className="px-6 py-4 font-semibold">Phân quyền</th>
              <th scope="col" className="px-6 py-4 font-semibold">Trạng thái</th>
              <th scope="col" className="px-6 py-4 font-semibold">Ngày tạo</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">
                  {user.username}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-neutral-foreground border border-primary/30">
                    {user.role?.name || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    user.status === 'active' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}>
                    {user.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onDelete(user)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors inline-flex items-center"
                    title="Xóa / Khóa tài khoản"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
