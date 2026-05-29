import React from 'react';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children, title, subtitle }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {title && (
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-secondary-800">{title}</h1>
              {subtitle && (
                <p className="text-secondary-500 mt-1">{subtitle}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
