import { LoginForm } from "../features/auth/LoginForm";
import { ShieldAlert } from "lucide-react";

export function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50">
          <ShieldAlert className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">System Admin</h1>
        <p className="text-slate-400 mt-2">Khu vực dành riêng cho Quản trị viên cấp cao</p>
      </div>
      
      {/* Reusing LoginForm but it will look distinct on this dark background */}
      <div className="w-full max-w-md">
        <LoginForm isAdminRoute={true} />
      </div>
    </div>
  );
}
