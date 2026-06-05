import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../components/ui/Card";
import { Alert, AlertDescription } from "../../components/ui/Alert";
import { Loader2 } from "lucide-react";

export function RegisterForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    username: "",
    fullName: "",
    email: "", 
    phoneNumber: "",
    identityCard: "",
    homeTown: "",
    password: "", 
    confirmPassword: "" 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    const { username, fullName, email, phoneNumber, identityCard, homeTown, password, confirmPassword } = formData;
    
    if (!username || !fullName || !email || !phoneNumber || !identityCard || !homeTown || !password || !confirmPassword) {
      return setError("Vui lòng điền đầy đủ thông tin bắt buộc.");
    }
    
    if (password !== confirmPassword) {
      return setError("Mật khẩu xác nhận không khớp.");
    }

    setIsLoading(true);
    try {
      const { confirmPassword: _, ...registerData } = formData;
      await authService.register(registerData);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Đăng ký thất bại. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-slate-100 backdrop-blur-md shadow-xl border-white/10 text-neutral-foreground max-h-[90vh] overflow-y-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-center text-tertiary">Đăng Ký Tài Khoản</CardTitle>
        <CardDescription className="text-center text-slate-600">Đăng ký để trở thành khách thuê trên hệ thống.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase">Tên đăng nhập *</label>
              <Input name="username" placeholder="nguyenvana" value={formData.username} onChange={handleChange} disabled={isLoading} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase">Họ và tên *</label>
              <Input name="fullName" placeholder="Nguyễn Văn A" value={formData.fullName} onChange={handleChange} disabled={isLoading} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Email *</label>
            <Input name="email" type="email" placeholder="example@gmail.com" value={formData.email} onChange={handleChange} disabled={isLoading} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase">Số điện thoại *</label>
              <Input name="phoneNumber" placeholder="0987654321" value={formData.phoneNumber} onChange={handleChange} disabled={isLoading} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase">Số CMND/CCCD *</label>
              <Input name="identityCard" placeholder="001092..." value={formData.identityCard} onChange={handleChange} disabled={isLoading} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Quê quán *</label>
            <Input name="homeTown" placeholder="Hà Nội, Việt Nam" value={formData.homeTown} onChange={handleChange} disabled={isLoading} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase">Mật khẩu *</label>
              <Input name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} disabled={isLoading} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase">Nhập lại *</label>
              <Input name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} disabled={isLoading} />
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full bg-primary hover:bg-primary-hover" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Đăng Ký"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-slate-200/20 pt-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <button onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">
            Đăng nhập ngay
          </button>
        </p>
      </CardFooter>
    </Card>
  );
}
