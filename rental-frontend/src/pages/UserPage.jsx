import { useState, useEffect } from "react";
import { Search, Loader2, Trash2 } from "lucide-react";
import { userService } from "../services/user.service";
import { UserTable } from "../features/user/UserTable";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";

export function UserPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await userService.getAll();
      let list = [];
      if (Array.isArray(response)) list = response;
      else if (response && Array.isArray(response.data)) list = response.data;
      else if (response && Array.isArray(response.users)) list = response.users;
      else if (response && response.data && Array.isArray(response.data.users)) list = response.data.users;
      
      setUsers(list);
    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || "Không thể tải danh sách người dùng. Bạn cần quyền Admin.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const userId = selectedUser._id || selectedUser.id;
      await userService.delete(userId);
      await fetchUsers();
      setIsDeleteModalOpen(false);
    } catch (error) {
      alert(error.response?.data?.message || "Xóa thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = (user.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Quản lý người dùng</h2>
          <p className="text-slate-500">Xem và quản lý các tài khoản trong hệ thống (Chỉ dành cho Admin).</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo Username hoặc Email..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-sm text-slate-600 whitespace-nowrap">Trạng thái:</span>
          <select
            className="block w-full md:w-40 pl-3 pr-10 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã khóa</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <UserTable users={filteredUsers} onDelete={handleDeleteClick} />
      )}

      {/* MODAL XÁC NHẬN XÓA */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Xác nhận vô hiệu hóa">
        <div className="space-y-4">
          <p className="text-slate-600">
            Bạn có chắc chắn muốn vô hiệu hóa tài khoản <strong>{selectedUser?.username}</strong> ({selectedUser?.email}) không? 
            Tài khoản này sẽ không thể đăng nhập vào hệ thống nữa.
          </p>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Hủy</Button>
            <Button onClick={confirmDelete} disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-neutral-foreground border-none">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Vô hiệu hóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
