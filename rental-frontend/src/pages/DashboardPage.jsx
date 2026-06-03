import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardService } from "../services/dashboard.service";
import { StatCards } from "../features/dashboard/StatCards";
import { RevenueChart } from "../features/dashboard/RevenueChart";
import { OverdueInvoices } from "../features/dashboard/OverdueInvoices";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/Alert";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/Button";

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await dashboardService.getOverview();
        setData(response.data); // Assuming response wraps data in { data: ... }
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
        } else {
          setError(err.response?.data?.message || "Không thể tải dữ liệu dashboard.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
             <Button onClick={() => window.location.reload()}>Thử lại</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Tổng quan</h2>
        <p className="text-muted-foreground">Theo dõi hoạt động kinh doanh nhà trọ của bạn.</p>
      </div>

      <StatCards data={data} />
      
      <div className="grid gap-4 md:grid-cols-4">
        <RevenueChart data={data?.revenueChart} />
        <OverdueInvoices data={data?.overdueInvoices} />
      </div>
    </div>
  );
}
