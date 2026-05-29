import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings,
  LogOut,
  Tractor
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const isActive = (path) => location.pathname === path;

  const adminLinks = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/worklogs', icon: FileText, label: 'Work Logs' },
    { path: '/admin/users', icon: Users, label: 'Users' },
  ];

  const operatorLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dashboard/worklogs', icon: FileText, label: 'My Work Logs' },
  ];

  const links = isAdmin ? adminLinks : operatorLinks;

  return (
    <aside className="w-64 bg-white border-r border-secondary-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-secondary-100">
        <Link to="/" className="flex items-center gap-3">
          <div className="p-2 bg-primary-600 rounded-lg">
            <Tractor className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-secondary-800">TractorLog</h1>
            <p className="text-xs text-secondary-500">Work Log System</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={isActive(link.path) ? 'sidebar-link-active' : 'sidebar-link'}
          >
            <link.icon size={20} />
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-secondary-100">
        <div className="flex items-center gap-3 p-3 mb-3 bg-secondary-50 rounded-lg">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-medium">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary-800 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-secondary-500 truncate">
              {isAdmin ? 'Administrator' : 'Operator'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
