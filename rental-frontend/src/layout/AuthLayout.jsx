import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow rounded-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Rental Management</h2>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
