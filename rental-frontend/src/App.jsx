import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import AuthLayout from './layout/AuthLayout';

// Placeholder Pages
const Dashboard = () => <div className="p-4">Dashboard Page</div>;
const Login = () => <div className="p-4">Login Page</div>;
const Rooms = () => <div className="p-4">Rooms Page</div>;

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/rooms" element={<Rooms />} />
      </Route>
    </Routes>
  );
}

export default App;
