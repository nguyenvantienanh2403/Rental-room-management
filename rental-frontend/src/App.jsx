import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './pages/LoginPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { BuildingPage } from './pages/BuildingPage';
import { BuildingFormPage } from './pages/BuildingFormPage';
import { BuildingDetailPage } from './pages/BuildingDetailPage';
import { RoomPage } from './pages/RoomPage';
import { TenantPage } from './pages/TenantPage';
import { ContractPage } from './pages/ContractPage';
import { MeterReadingPage } from './pages/MeterReadingPage';
import { InvoicePage } from './pages/InvoicePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfilePage } from './pages/ProfilePage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { UserPage } from './pages/UserPage';
import { MainLayout } from './layout/MainLayout';
import { TenantLayout } from './layout/TenantLayout';
import { TenantDashboard } from './pages/tenant/TenantDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

import { HomePage } from './pages/HomePage';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      
      {/* Tenant Portal Routes */}
      <Route path="/t" element={<TenantLayout />}>
        <Route index element={<TenantDashboard />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin/Landlord Routes */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
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
    </>
  );
}

export default App;
