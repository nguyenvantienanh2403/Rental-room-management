import { useState, useEffect } from "react";
import { Loader2, Key, Check } from "lucide-react";
import { authService } from "../services/auth.service";
import { userService } from "../services/user.service";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function ChangePasswordPage() {
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const data = await authService.getMe();
        setUser(data.data || data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchMe();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user._id) return;
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp!" });
      return;
    }
    
    setIsSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await userService.changePassword(user._id, {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      });
      setMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Đổi mật khẩu thất bại." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 mt-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/20 text-primary rounded-full">
          <Key className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Đổi mật khẩu</h2>
          <p className="text-slate-500">Cập nhật mật khẩu để bảo vệ tài khoản.</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu hiện tại *</label>
            <Input 
              type="password"
              name="oldPassword" 
              value={formData.oldPassword} 
              onChange={handleChange} 
              placeholder="Nhập mật khẩu cũ..." 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới *</label>
            <Input 
              type="password"
              name="newPassword" 
              value={formData.newPassword} 
              onChange={handleChange} 
              placeholder="Nhập mật khẩu mới..." 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu mới *</label>
            <Input 
              type="password"
              name="confirmPassword" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              placeholder="Nhập lại mật khẩu mới..." 
              required 
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button type="submit" disabled={isSaving || !user} className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
