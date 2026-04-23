import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "./BrandLogo";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [user, setUser] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
      return null;
    }
  });

  useEffect(() => {
    // Subscribe to storage changes (for multi-tab updates)
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch (error) {
          console.error('Failed to parse user from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: "📊" },
    { label: "Patients", path: "/patients", icon: "👥" },
    { label: "Doctors", path: "/doctors", icon: "👨‍⚕️" },
    { label: "Appointments", path: "/appointments", icon: "📅" },
    { label: "Billing", path: "/billing", icon: "💳" },
  ];

  const adminItems = [
    { label: "Doctor Approvals", path: "/pending-doctors", icon: "✓" },
    { label: "Audit Logs", path: "/audit-logs", icon: "📋" },
    { label: "Settings", path: "/settings", icon: "⚙️" },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 transition-colors"
      >
        ☰
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative w-64 h-screen bg-linear-to-b from-teal-700 to-teal-800 text-white z-40 transform transition-transform duration-300 ${
          !isOpen ? "-translate-x-full md:translate-x-0" : ""
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-teal-600">
          <BrandLogo tone="dark" />
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-teal-600">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-lg font-bold">
              {user?.name?.[0]?.toUpperCase() || '👤'}
            </div>
            <div>
              <p className="font-semibold text-sm">{user?.name || 'User'}</p>
              <p className="text-xs text-teal-100 mt-1">{user?.email || 'email@hospital.com'}</p>
              <span className="text-xs bg-teal-600 px-2 py-1 rounded mt-1 inline-block">{user?.role || 'USER'}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                  isActive(item.path)
                    ? "bg-teal-600 shadow-lg"
                    : "hover:bg-teal-600/50"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}

            {/* Admin Only Section */}
            {user?.role === 'ADMIN' && (
              <>
                <div className="my-4 h-px bg-teal-600"></div>
                <p className="px-4 py-2 text-xs font-bold text-teal-200 uppercase tracking-wider">Admin</p>
                {adminItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                      isActive(item.path)
                        ? "bg-red-600 shadow-lg"
                        : "hover:bg-red-600/50"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-teal-600 bg-teal-800/50">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
