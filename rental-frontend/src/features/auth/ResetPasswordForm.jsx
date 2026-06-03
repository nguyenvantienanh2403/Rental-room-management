import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../components/ui/Card";
import { Alert, AlertDescription } from "../../components/ui/Alert";
import { Loader2 } from "lucide-react";

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const { token } = useParams();
  
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!formData.password || !formData.confirmPassword) {
      return setError("Vui lòng nhập đầy đủ thông tin.");
    }
    
    if (formData.password !== formData.confirmPassword) {
      return setError("Mật khẩu xác nhận không khớp.");
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token, formData.password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể cập nhật mật khẩu. Link có thể đã hết hạn.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white/5 backdrop-blur-md shadow-xl border-white/10 text-white">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-tertiary">Đặt Lại Mật Khẩu</CardTitle>
        <CardDescription className="text-center text-slate-400">Nhập mật khẩu mới cho tài khoản của bạn.</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription>
              Cập nhật mật khẩu thành công! Tự động chuyển hướng về trang đăng nhập...
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Input
                name="password"
                type="password"
                placeholder="Mật khẩu mới"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Xác nhận mật khẩu mới"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary-hover hover:text-white transition-colors" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Cập Nhật Mật Khẩu"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          <button onClick={() => navigate("/login")} className="text-primary hover:text-secondary hover:underline transition-colors">
            Quay lại Đăng nhập
          </button>
        </p>
      </CardFooter>
    </Card>
  );
}
