import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Home, Loader2 } from "lucide-react";
import { authService } from "../services/auth.service";
import { useState } from "react";

export function NotFoundPage() {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleBackToHome = async () => {
    setIsRedirecting(true);
    try {
      const userRes = await authService.getMe();
      const user = userRes?.data || userRes;
      const roleName = user?.role?.name || user?.role;
      
      if (roleName === 'user') {
        navigate("/t");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      // Nếu chưa đăng nhập hoặc token lỗi
      navigate("/login");
    } finally {
      setIsRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral text-neutral-foreground flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-9xl font-bold text-primary opacity-80">404</h1>
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-foreground">Trang không tồn tại</h2>
        <p className="text-slate-600">
          Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.
        </p>
        <div className="pt-4 flex justify-center">
          <Button 
            onClick={handleBackToHome}
            disabled={isRedirecting}
            className="bg-primary hover:bg-secondary text-neutral-foreground border-none transition-all flex items-center justify-center"
            size="lg"
          >
            {isRedirecting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Home className="mr-2 h-5 w-5" />}
            Quay lại Trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
