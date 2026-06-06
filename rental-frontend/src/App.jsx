import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// Immediate layout/guard imports
import { MainLayout } from './layout/MainLayout';
import { TenantLayout } from './layout/TenantLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy loaded page components
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const BuildingPage = lazy(() => import('./pages/BuildingPage').then(m => ({ default: m.BuildingPage })));
const BuildingFormPage = lazy(() => import('./pages/BuildingFormPage').then(m => ({ default: m.BuildingFormPage })));
const BuildingDetailPage = lazy(() => import('./pages/BuildingDetailPage').then(m => ({ default: m.BuildingDetailPage })));
const RoomPage = lazy(() => import('./pages/RoomPage').then(m => ({ default: m.RoomPage })));
const TenantPage = lazy(() => import('./pages/TenantPage').then(m => ({ default: m.TenantPage })));
const ContractPage = lazy(() => import('./pages/ContractPage').then(m => ({ default: m.ContractPage })));
const MeterReadingPage = lazy(() => import('./pages/MeterReadingPage').then(m => ({ default: m.MeterReadingPage })));
const InvoicePage = lazy(() => import('./pages/InvoicePage').then(m => ({ default: m.InvoicePage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage').then(m => ({ default: m.ChangePasswordPage })));
const UserPage = lazy(() => import('./pages/UserPage').then(m => ({ default: m.UserPage })));
const TenantDashboard = lazy(() => import('./pages/tenant/TenantDashboard').then(m => ({ default: m.TenantDashboard })));
const TenantInvoicesPage = lazy(() => import('./pages/tenant/TenantInvoicesPage').then(m => ({ default: m.TenantInvoicesPage })));
const TenantContractsPage = lazy(() => import('./pages/tenant/TenantContractsPage').then(m => ({ default: m.TenantContractsPage })));

// Premium loading spinner fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <div className="p-8 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-slate-600 font-medium">Đang tải trang...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          
          {/* Tenant Portal Routes */}
          <Route element={<ProtectedRoute allowedRoles={['user']}><TenantLayout /></ProtectedRoute>}>
            <Route path="/t" element={<TenantDashboard />} />
            <Route path="/t/invoices" element={<TenantInvoicesPage />} />
            <Route path="/t/contracts" element={<TenantContractsPage />} />
            <Route path="/t/profile" element={<ProfilePage />} />
          </Route>

          {/* Admin/Landlord Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'landlord']}><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/buildings" element={<BuildingPage />} />
            <Route path="/buildings/new" element={<BuildingFormPage />} />
            <Route path="/buildings/:id" element={<BuildingDetailPage />} />
            <Route path="/buildings/:id/edit" element={<BuildingFormPage />} />
            <Route path="/rooms" element={<RoomPage />} />
            <Route path="/tenants" element={<TenantPage />} />
            <Route path="/contracts" element={<ContractPage />} />
            <Route path="/meter-readings" element={<MeterReadingPage />} />
            <Route path="/invoices" element={<InvoicePage />} />
            <Route path="/users" element={<UserPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
