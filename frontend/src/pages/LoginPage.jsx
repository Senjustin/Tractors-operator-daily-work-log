import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Tractor, Mail, Lock, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        navigate(result.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl">
              <Tractor className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">TractorLog</h1>
              <p className="text-primary-200 text-sm">Work Log Management</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Efficiently manage your tractor operations and work logs
          </h2>
          <p className="text-primary-100 text-lg">
            Track work hours, manage operators, and streamline your agricultural operations.
          </p>
        </div>

        <div className="flex items-center gap-4 text-primary-200 text-sm">
          <span>Trusted by 100+ farms</span>
          <span className="w-1 h-1 bg-primary-300 rounded-full" />
          <span>500+ operators</span>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="p-3 bg-primary-600 rounded-xl">
              <Tractor className="text-white" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-secondary-800">TractorLog</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-secondary-800">Welcome back</h2>
              <p className="text-secondary-500 mt-1">Enter your credentials to access your account</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="text-secondary-400" size={20} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="text-secondary-400" size={20} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-secondary-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-secondary-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                  Register here
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-secondary-400 text-sm mt-8">
            © 2026 TractorLog. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
