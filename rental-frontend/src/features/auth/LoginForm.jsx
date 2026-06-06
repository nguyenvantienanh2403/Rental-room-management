import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../components/ui/Card";
import { Alert, AlertDescription } from "../../components/ui/Alert";
import { Loader2 } from "lucide-react";

export function LoginForm({ isAdminRoute = false }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!formData.email || !formData.password) {
      return setError("Vui lòng nhập đầy đủ email và mật khẩu.");
    }

    setIsLoading(true);
    try {
      await authService.login(formData);
      
      // Lấy thông tin user để biết Role
      const userRes = await authService.getMe();
      const user = userRes?.data || userRes;
      const roleName = user?.role?.name || user?.role;
      
      // Kiểm tra bảo mật cho Admin
      if (isAdminRoute && roleName !== 'admin') {
        authService.logout();
        throw new Error("Tài khoản của bạn không phải Admin, vui lòng ra trang chủ để đăng nhập.");
      }

      // Redirect logic
      if (roleName === 'user') {
        navigate("/");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-slate-100 backdrop-blur-md shadow-xl border-white/10 text-neutral-foreground">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-tertiary">Đăng Nhập</CardTitle>
        <CardDescription className="text-center text-slate-600">Chào mừng trở lại! Vui lòng đăng nhập vào tài khoản của bạn.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Input
              name="password"
              type="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary-hover" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Đăng Nhập"}
          </Button>
          {!isAdminRoute && (
            <div className="text-right">
              <button 
                type="button"
                onClick={() => navigate("/forgot-password")} 
                className="text-sm text-neutral-foreground hover:underline transition-colors"
              >
                Quên mật khẩu?
              </button>
            </div>
          )}
        </form>
      </CardContent>
      
      {!isAdminRoute && (
        <CardFooter className="flex justify-center border-t border-slate-200/20 pt-4">
          <p className="text-sm text-slate-600">
            Bạn chưa có tài khoản?{" "}
            <button 
              onClick={() => navigate("/register")} 
              className="text-neutral-foreground hover:underline font-medium"
            >
              Đăng ký ngay
            </button>
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
