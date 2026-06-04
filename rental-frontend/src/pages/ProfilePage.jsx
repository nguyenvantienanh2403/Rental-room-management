import { useState, useEffect, useRef } from "react";
import { Loader2, Camera, Check, User as UserIcon, Shield, Mail, Calendar, Activity, Lock, ArrowRight, X } from "lucide-react";
import { authService } from "../services/auth.service";
import { userService } from "../services/user.service";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import toast from "react-hot-toast";

export function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
  });

  // Modal Email Change States
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailStep, setEmailStep] = useState(1);
  const [isProcessingEmail, setIsProcessingEmail] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    currentPassword: "",
    newEmail: "",
    otp: ""
  });
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    fetchMe();
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const fetchMe = async () => {
    try {
      setIsLoading(true);
      const data = await authService.getMe();
      const userData = data.data || data;
      setUser(userData);
      setFormData({
        username: userData.username || "",
      });
    } catch (error) {
      toast.error("Không thể tải thông tin hồ sơ.");
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
    const toastId = toast.loading("Đang cập nhật hồ sơ...");
    
    try {
      await userService.updateProfile(user._id, formData);
      toast.success("Cập nhật hồ sơ thành công!", { id: toastId });
      await fetchMe();
    } catch (error) {
      toast.error(error.response?.data?.message || "Cập nhật thất bại.", { id: toastId });
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
    const toastId = toast.loading("Đang tải ảnh lên...");
    
    try {
      await userService.uploadAvatar(fileData);
      toast.success("Đổi ảnh đại diện thành công!", { id: toastId });
      await fetchMe(); 
      // Force reload to update avatar in Sidebar/Header
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi tải ảnh lên.", { id: toastId });
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  // -------------------------------------------------------------
  // OTP EMAIL CHANGE LOGIC
  // -------------------------------------------------------------
  const openEmailModal = () => {
    setEmailStep(1);
    setEmailFormData({ currentPassword: "", newEmail: "", otp: "" });
    setIsEmailModalOpen(true);
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setIsProcessingEmail(true);
    const toastId = toast.loading("Đang kiểm tra và gửi mã OTP...");
    
    try {
      await userService.requestEmailChange({
        currentPassword: emailFormData.currentPassword,
        newEmail: emailFormData.newEmail
      });
      toast.success("Mã OTP đã được gửi đến email mới của bạn!", { id: toastId });
      setEmailStep(2);
      setCountdown(600); // 10 minutes in seconds
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi gửi yêu cầu đổi email", { id: toastId });
    } finally {
      setIsProcessingEmail(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsProcessingEmail(true);
    const toastId = toast.loading("Đang xác thực OTP...");
    
    try {
      await userService.verifyEmailChange({ otp: emailFormData.otp });
      toast.success("Đổi Email thành công!", { id: toastId });
      setIsEmailModalOpen(false);
      await fetchMe();
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP không hợp lệ", { id: toastId });
    } finally {
      setIsProcessingEmail(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formattedDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      })
    : "Không xác định";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-primary/20 to-transparent p-6 rounded-2xl border border-primary/10">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Hồ sơ cá nhân</h2>
        <p className="text-slate-500 mt-1">Quản lý thông tin tài khoản và định danh của bạn trên hệ thống.</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-10 items-start">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4 md:w-1/3">
          <div 
            className="relative group cursor-pointer" 
            onClick={handleAvatarClick}
            title="Nhấn để đổi ảnh đại diện"
          >
            <div className="h-40 w-40 rounded-full overflow-hidden bg-slate-50 border-4 border-primary/10 shadow-lg flex items-center justify-center transition-transform group-hover:scale-105">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-20 w-20 text-slate-300" />
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <>
                    <Camera className="h-8 w-8 text-white mb-2" />
                    <span className="text-white text-xs font-medium">Thay đổi</span>
                  </>
                )}
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
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900">{user?.username}</h3>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border shadow-sm ${
                user?.role?.name?.toLowerCase() === 'admin'
                  ? 'bg-tertiary/10 text-tertiary border-tertiary/20'
                  : 'bg-primary/10 text-primary border-primary/20'
              }`}>
                <Shield className="h-3 w-3 mr-1" />
                {user?.role?.name || "Người dùng"}
              </span>
              
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border shadow-sm ${
                user?.status === 'active'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                <Activity className="h-3 w-3 mr-1" />
                {user?.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
              </span>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-5 bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Thông tin cơ bản</h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-slate-400" /> Tên hiển thị (Username)
                </label>
                <Input 
                  name="username" 
                  value={formData.username} 
                  onChange={handleChange} 
                  required 
                  className="bg-white border-slate-300 focus:ring-primary shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" /> Email liên kết
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    value={user?.email || ""} 
                    disabled 
                    className="bg-slate-100 text-slate-500 cursor-not-allowed flex-1 opacity-80 border-slate-200 shadow-inner"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={openEmailModal}
                    className="shrink-0 bg-white border-primary text-neutral-foreground hover:bg-primary/5 transition-colors"
                  >
                    Đổi Email
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">* Đổi email yêu cầu xác thực OTP bảo mật 2 lớp.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" /> Ngày tham gia hệ thống
                </label>
                <Input 
                  value={formattedDate} 
                  disabled 
                  className="bg-slate-100 text-slate-500 cursor-not-allowed opacity-70 border-slate-200"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button 
                type="submit" 
                disabled={isSaving} 
                className="bg-primary hover:bg-primary-hover text-neutral-foreground border-none px-8 py-2.5 h-auto text-base shadow-md hover:shadow-lg transition-all"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Check className="h-5 w-5 mr-2" />}
                Lưu hồ sơ
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL ĐỔI EMAIL OTP */}
      <Modal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        title={emailStep === 1 ? "Yêu cầu thay đổi Email" : "Xác thực mã OTP"}
      >
        {emailStep === 1 ? (
          <form onSubmit={handleRequestOTP} className="space-y-5">
            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-start gap-2 border border-blue-100">
              <Shield className="h-5 w-5 shrink-0 mt-0.5" />
              <p>Hệ thống cần xác thực mật khẩu hiện tại của bạn trước khi cho phép thay đổi định danh gốc.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu hiện tại *</label>
              <Input 
                type="password"
                required
                value={emailFormData.currentPassword}
                onChange={e => setEmailFormData({...emailFormData, currentPassword: e.target.value})}
                placeholder="Nhập mật khẩu đang dùng"
                className="bg-white border-slate-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ Email mới *</label>
              <Input 
                type="email"
                required
                value={emailFormData.newEmail}
                onChange={e => setEmailFormData({...emailFormData, newEmail: e.target.value})}
                placeholder="VD: nguyenvana@gmail.com"
                className="bg-white border-slate-300"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsEmailModalOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isProcessingEmail} className="bg-primary text-neutral-foreground border-none">
                {isProcessingEmail ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Gửi mã OTP <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div className="bg-green-50 text-green-800 p-4 rounded-xl text-sm text-center border border-green-100">
              <Mail className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p>Chúng tôi đã gửi một mã xác nhận gồm 6 chữ số đến email:</p>
              <p className="font-bold text-lg mt-1">{emailFormData.newEmail}</p>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 text-center">Mã OTP (6 số)</label>
              <Input 
                type="text"
                required
                maxLength="6"
                value={emailFormData.otp}
                onChange={e => setEmailFormData({...emailFormData, otp: e.target.value})}
                placeholder="Ví dụ: 123456"
                className="bg-white border-slate-300 text-center text-2xl font-bold tracking-[0.5em] py-3"
              />
              <div className="text-center mt-3 text-sm">
                <span className="text-slate-500">Mã có hiệu lực trong: </span>
                <span className={`font-bold ${countdown < 60 ? 'text-red-500' : 'text-primary'}`}>
                  {formatTime(countdown)}
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setEmailStep(1)}>Quay lại</Button>
              <Button type="submit" disabled={isProcessingEmail || countdown === 0} className="bg-primary text-neutral-foreground border-none px-6">
                {isProcessingEmail ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Xác thực & Đổi Email
              </Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
