import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="p-8 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-slate-600 font-medium">Đang xác thực thông tin...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleName = user?.role?.name?.toLowerCase() || user?.role?.toLowerCase();

  if (allowedRoles && !allowedRoles.includes(roleName)) {
    // If not allowed, redirect to their default home page based on role
    if (roleName === 'user') {
      return <Navigate to="/t" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children ? children : <Outlet />;
}
