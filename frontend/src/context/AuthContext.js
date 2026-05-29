import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token is still valid
          try {
            const response = await api.get('/auth/me');
            if (response.data.success) {
              setUser(response.data.user);
            } else {
              // Token invalid, clear storage
              clearAuth();
            }
          } catch (err) {
            console.error('Token verification failed:', err);
            clearAuth();
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

const clearAuth = useCallback(() => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  setToken(null);
  setUser(null);
  setError(null);
}, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
       const response = await api.post('/auth/login', { email, password });
       const { token: newToken, refreshToken: newRefreshToken, user: newUser } = response.data;

       localStorage.setItem('token', newToken);
       localStorage.setItem('refreshToken', newRefreshToken);
       localStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
      return { success: false, message };
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setError(null);
    try {
       const response = await api.post('/auth/register', { 
         name, 
         email, 
         password,
         role: 'operator'
       });
       const { token: newToken, refreshToken: newRefreshToken, user: newUser } = response.data;

       localStorage.setItem('token', newToken);
       localStorage.setItem('refreshToken', newRefreshToken);
       localStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    }
  }, []);

const logout = useCallback(() => {
  clearAuth();
  navigate('/login', { replace: true });
}, [clearAuth, navigate]);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  // Computed values
  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';
  const isOperator = user?.role === 'operator';

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isOperator,
    login,
    register,
    logout,
    updateUser,
    clearAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
