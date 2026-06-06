import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBackToHome = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    const roleName = user?.role?.name || user?.role;
    if (roleName === 'user') {
      navigate("/t");
    } else {
      navigate("/dashboard");
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
            className="bg-primary hover:bg-secondary text-neutral-foreground border-none transition-all flex items-center justify-center"
            size="lg"
          >
            <Home className="mr-2 h-5 w-5" />
            Quay lại Trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
