import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Placeholder */}
      <aside className="w-64 bg-white border-r">
        <div className="p-4 text-xl font-bold border-b">Rental System</div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li><a href="/dashboard" className="text-blue-600 hover:underline">Dashboard</a></li>
            <li><a href="/rooms" className="text-blue-600 hover:underline">Rooms</a></li>
          </ul>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Header Placeholder */}
        <header className="h-16 bg-white border-b flex items-center px-6">
          <h1 className="text-lg font-semibold">Header</h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
