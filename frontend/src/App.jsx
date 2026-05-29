import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './context/PrivateRoute';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import OperatorDashboard from './pages/OperatorDashboard.jsx';
import OperatorWorkLogs from './pages/OperatorWorkLogs.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminWorkLogs from './pages/AdminWorkLogs.jsx';
import UserManagement from './pages/UserManagement.jsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <OperatorDashboard />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/dashboard/worklogs"
            element={
              <PrivateRoute>
                <OperatorWorkLogs />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute requiredRole="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/admin/worklogs"
            element={
              <PrivateRoute requiredRole="admin">
                <AdminWorkLogs />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/admin/users"
            element={
              <PrivateRoute requiredRole="admin">
                <UserManagement />
              </PrivateRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
