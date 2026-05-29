import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import {
  DashboardLayout,
  Card,
  Button,
  Badge,
  Modal,
  Input
} from '../components';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Search,
  Filter,
  Eye,
  EyeOff,
  Check,
  X,
  RefreshCw,
  Mail,
  Calendar,
  Clock,
  DollarSign
} from 'lucide-react';

const UserManagement = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({ totalSalary: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [salaryData, setSalaryData] = useState({ amount: '', notes: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator',
    isActive: true
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users', {
        params: {
          page: pagination.currentPage,
          limit: 20,
          active: filter === 'all' ? undefined : filter
        }
      });
      if (response.data.success) {
        setUsers(response.data.users);
        setPagination({
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          totalUsers: response.data.totalUsers
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const filteredUsers = users.filter(user =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    );
    setUsers(filteredUsers);
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        isActive: user.isActive
      });
    } else {
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'operator',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'operator',
      isActive: true
    });
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    if (user.role === 'operator') {
      try {
        const response = await api.get(`/worklogs/stats/dashboard?operatorId=${user._id}`);
        if (response.data.success) {
          setUserStats({ totalSalary: response.data.stats.totalSalary || 0 });
        }
      } catch (error) {
        console.error('Error fetching user salary stats:', error);
      }
    }
    setShowViewModal(true);
  };

  const handlePaySalary = (user) => {
    setSelectedUser(user);
    setSalaryData({ amount: '', notes: '' });
    setShowSalaryModal(true);
  };

  const submitSalaryPayment = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/worklogs/operator-payment/${selectedUser._id}`, {
        amount: parseFloat(salaryData.amount),
        notes: salaryData.notes
      });
      if (response.data.success) {
        setShowSalaryModal(false);
        alert('Salary payment recorded successfully');
      }
    } catch (error) {
      console.error('Error recording salary payment:', error);
      alert(error.response?.data?.message || 'Failed to record salary payment');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        // Update existing user
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive
        };
        if (formData.password) {
          updateData.password = formData.password;
        }

        const response = await api.put(`/auth/users/${selectedUser._id}`, updateData);
        if (response.data.success) {
          fetchUsers();
          handleCloseModal();
        }
      } else {
        // Create new user
        const response = await api.post('/auth/register', formData);
        if (response.data.success) {
          fetchUsers();
          handleCloseModal();
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const response = await api.put(`/auth/users/${user._id}`, {
        isActive: !user.isActive
      });
      if (response.data.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/auth/users/${userId}`);
      if (response.data.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'danger',
      operator: 'primary'
    };
    return <Badge variant={variants[role]}>{role}</Badge>;
  };

  const getStatusBadge = (isActive) => {
    return isActive
      ? <Badge variant="success">Active</Badge>
      : <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <DashboardLayout
      title="User Management"
      subtitle="Manage operators and administrators"
    >
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && handleSearch(e)}
              className="input-field pl-10 pr-4 py-2 w-full md:w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-secondary-400" />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
              className="input-field py-2"
            >
              <option value="all">All Users</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchUsers}>
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            <UserPlus size={18} className="mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Users className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-secondary-500">Total Users</p>
            <p className="text-2xl font-bold text-secondary-800">{pagination.totalUsers}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-xl">
            <Shield className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-secondary-500">Administrators</p>
            <p className="text-2xl font-bold text-secondary-800">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-yellow-50 rounded-xl">
            <Users className="text-yellow-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-secondary-500">Operators</p>
            <p className="text-2xl font-bold text-secondary-800">
              {users.filter(u => u.role === 'operator').length}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl">
            <EyeOff className="text-red-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-secondary-500">Inactive</p>
            <p className="text-2xl font-bold text-secondary-800">
              {users.filter(u => !u.isActive).length}
            </p>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto text-secondary-300 mb-4" size={48} />
            <p className="text-secondary-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-4 font-semibold text-secondary-600">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary-600">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary-600">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary-600">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary-600">Created</th>
                  <th className="text-right py-3 px-4 font-semibold text-secondary-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className="border-b border-secondary-100 hover:bg-secondary-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-secondary-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-secondary-600">{user.email}</td>
                    <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                    <td className="py-3 px-4">{getStatusBadge(user.isActive)}</td>
                    <td className="py-3 px-4 text-secondary-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(user)}>
                          <Edit size={16} />
                        </Button>
                        {user.role === 'operator' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePaySalary(user)}
                            className="text-green-600 hover:text-green-700"
                            title="Record Salary Payment"
                          >
                            <DollarSign size={16} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(user)}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-secondary-200">
            <p className="text-sm text-secondary-600">
              Showing page {pagination.currentPage} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.currentPage === 1}
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={selectedUser ? 'Edit User' : 'Add New User'}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <Input
              label={selectedUser ? 'New Password (leave blank to keep current)' : 'Password'}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required={!selectedUser}
              minLength={6}
            />
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="input-field"
                required
              >
                <option value="operator">Operator</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm text-secondary-700">
                User is active
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {selectedUser ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View User Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="User Details"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 text-2xl font-bold">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-secondary-800">{selectedUser.name}</h3>
                <p className="text-secondary-600">{selectedUser.email}</p>
                <div className="flex gap-2 mt-2">
                  {getRoleBadge(selectedUser.role)}
                  {getStatusBadge(selectedUser.isActive)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
                <Mail className="text-secondary-400" size={20} />
                <div>
                  <p className="text-xs text-secondary-500">Email</p>
                  <p className="font-medium text-secondary-700">{selectedUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
                <Shield className="text-secondary-400" size={20} />
                <div>
                  <p className="text-xs text-secondary-500">Role</p>
                  <p className="font-medium text-secondary-700 capitalize">{selectedUser.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
                <Calendar className="text-secondary-400" size={20} />
                <div>
                  <p className="text-xs text-secondary-500">Created</p>
                  <p className="font-medium text-secondary-700">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
                <Clock className="text-secondary-400" size={20} />
                <div>
                  <p className="text-xs text-secondary-500">Last Updated</p>
                  <p className="font-medium text-secondary-700">
                    {new Date(selectedUser.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
{selectedUser.role === 'operator' && (
                <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
                  <DollarSign className="text-secondary-400" size={20} />
                 <div>
                   <p className="text-xs text-secondary-500">Total Salary Earned</p>
                   <p className="font-medium text-secondary-700">
                     ₱{(userStats.totalSalary || 0).toFixed(2)}
                   </p>
                 </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Salary Payment Modal */}
      <Modal
        isOpen={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        title="Record Salary Payment"
        size="sm"
      >
        <form onSubmit={submitSalaryPayment} className="space-y-4">
          <div>
            <p className="text-sm text-secondary-500 mb-1">Operator</p>
            <p className="font-medium text-secondary-800">{selectedUser?.name}</p>
          </div>
           <Input
             label="Payment Amount (₱)"
             type="number"
             value={salaryData.amount}
             onChange={(e) => setSalaryData(prev => ({ ...prev, amount: e.target.value }))}
             placeholder="Enter amount"
             min="0"
             step="1"
             required
           />
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
              Notes
            </label>
            <textarea
              value={salaryData.notes}
              onChange={(e) => setSalaryData(prev => ({ ...prev, notes: e.target.value }))}
              className="input-field"
              rows="3"
              placeholder="Payment notes (optional)..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowSalaryModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default UserManagement;
