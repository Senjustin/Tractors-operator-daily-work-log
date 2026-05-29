import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Tractor, Mail, Lock, User, ArrowRight } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await register(name, email, password);
      
      if (result.success) {
        navigate('/login');
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
            Join our platform and start managing your work logs today
          </h2>
          <p className="text-primary-100 text-lg">
            Create an account to track your tractor operations and collaborate with your team.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <User className="text-white" size={20} />
            </div>
            <span className="text-white">Easy account creation</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <Tractor className="text-white" size={20} />
            </div>
            <span className="text-white">Track all your operations</span>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
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
              <h2 className="text-2xl font-bold text-secondary-800">Create an account</h2>
              <p className="text-secondary-500 mt-1">Enter your details to get started</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="text-secondary-400" size={20} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

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
                    placeholder="Create a password"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="text-secondary-400" size={20} />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 mt-0.5 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                  required
                />
                <span className="text-sm text-secondary-600">
                  I agree to the{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Creating account...'
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-secondary-500">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Sign in
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

export default RegisterPage;
