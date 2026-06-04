import { useState, useEffect, useRef } from "react";
import { Loader2, Camera, Check, User as UserIcon } from "lucide-react";
import { authService } from "../services/auth.service";
import { userService } from "../services/user.service";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    phoneNumber: "",
    address: "",
  });

  useEffect(() => {
    fetchMe();
  }, []);

  const fetchMe = async () => {
    try {
      setIsLoading(true);
      const data = await authService.getMe();
      const userData = data.data || data;
      setUser(userData);
      setFormData({
        username: userData.username || "",
        fullName: userData.fullName || "",
        phoneNumber: userData.phoneNumber || "",
        address: userData.address || "",
      });
    } catch (error) {
      setMessage({ type: "error", text: "Không thể tải thông tin hồ sơ." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user._id) return;
    
    setIsSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await userService.updateProfile(user._id, formData);
      setMessage({ type: "success", text: "Cập nhật hồ sơ thành công!" });
      await fetchMe();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Cập nhật thất bại." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileData = new FormData();
    fileData.append("avatar", file);

    setIsUploading(true);
    setMessage({ type: "", text: "" });
    try {
      await userService.uploadAvatar(fileData);
      setMessage({ type: "success", text: "Đổi ảnh đại diện thành công!" });
      await fetchMe(); // reload user to get new avatar
      // Dispatch event to force MainLayout to update avatar if needed
      window.location.reload(); 
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Lỗi tải ảnh lên." });
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Hồ sơ của tôi</h2>
        <p className="text-slate-500">Quản lý thông tin cá nhân và cài đặt bảo mật.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <div className="h-32 w-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-16 w-16 text-slate-300" />
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Camera className="h-8 w-8 text-white" />}
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/jpg" 
              onChange={handleFileChange}
            />
          </div>
          <p className="text-sm font-medium text-slate-600 hover:text-primary cursor-pointer" onClick={handleAvatarClick}>
            {isUploading ? "Đang tải lên..." : "Đổi ảnh đại diện"}
          </p>
        </div>

        {/* Info Section */}
        <div className="flex-1 w-full">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên đăng nhập (Username)</label>
                <Input 
                  name="username" 
                  value={formData.username} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <Input 
                  value={user?.email || ""} 
                  disabled 
                  className="bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Email không thể thay đổi</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
              <Input 
                name="fullName" 
                value={formData.fullName} 
                onChange={handleChange} 
                placeholder="Nhập họ và tên đầy đủ..." 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                <Input 
                  name="phoneNumber" 
                  value={formData.phoneNumber} 
                  onChange={handleChange} 
                  placeholder="09..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                <Input 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  placeholder="Quận/Huyện, Tỉnh/TP..." 
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
