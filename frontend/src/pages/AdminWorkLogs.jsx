import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { 
  DashboardLayout, 
  Card, 
  Button, 
  Badge, 
  StatCard,
  Modal,
  Input
} from '../components';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  Fuel,
  TrendingUp,
  Search,
  Filter,
  Check,
  X,
  Eye,
  ArrowRight,
  Activity,
  RefreshCw,
  Download,
  Truck,
  DollarSign,
  Trash2
} from 'lucide-react';

const AdminWorkLogs = () => {
  const { loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalWorkLogs: 0,
    pendingWorkLogs: 0,
    approvedWorkLogs: 0,
    rejectedWorkLogs: 0,
    totalHoursWorked: 0,
    totalFuelUsed: 0,
    totalSalary: 0
  });
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    operators: 0
  });
  const [workLogs, setWorkLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalSalary, setApprovalSalary] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [operatorPerformance, setOperatorPerformance] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [editFormData, setEditFormData] = useState({ salary: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/worklogs');
      if (response.data.success) {
        setWorkLogs(response.data.workLogs);
        calculateOperatorPerformance(response.data.workLogs);
      }

      const statsResponse = await api.get('/worklogs/stats/dashboard');
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }

      // Fetch user stats
      try {
        const usersResponse = await api.get('/auth/users', {
          params: { limit: 100 }
        });
        if (usersResponse.data.success) {
          const users = usersResponse.data.users;
          setUserStats({
            totalUsers: usersResponse.data.totalUsers || users.length,
            activeUsers: users.filter(u => u.isActive).length,
            inactiveUsers: users.filter(u => !u.isActive).length,
            operators: users.filter(u => u.role === 'operator').length
          });
        }
      } catch (userErr) {
        console.error('Error fetching user stats:', userErr);
      }

      // Fetch recent activity
      setRecentActivity(response.data.workLogs.slice(0, 5).map(log => ({
        id: log._id,
        type: log.status === 'pending' ? 'submission' : log.status,
        message: `${log.operator?.name || 'Unknown'} submitted a work log`,
        time: new Date(log.date).toLocaleDateString(),
        tractor: log.tractorId
      })));

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const calculateOperatorPerformance = (logs) => {
    const performance = {};
    logs.forEach(log => {
      const operatorId = log.operator?._id || 'unknown';
      if (!performance[operatorId]) {
        performance[operatorId] = {
          name: log.operator?.name || 'Unknown',
          totalLogs: 0,
          approvedLogs: 0,
          rejectedLogs: 0,
          totalHours: 0,
          totalFuel: 0
        };
      }
      performance[operatorId].totalLogs++;
      performance[operatorId].totalHours += log.hoursWorked || 0;
      performance[operatorId].totalFuel += log.fuelUsed || 0;
      if (log.status === 'approved') performance[operatorId].approvedLogs++;
      if (log.status === 'rejected') performance[operatorId].rejectedLogs++;
    });
    setOperatorPerformance(Object.values(performance).slice(0, 5));
  };

  const handleApproval = async (status) => {
    try {
      const endpoint = status === 'approved' ? 'approve' : 'reject';
      const response = await api.put(`/worklogs/${selectedLog._id}/${endpoint}`, {
        approvalNotes,
        salary: parseFloat(approvalSalary) || 0
      });
      
      if (response.data.success) {
        setShowApprovalModal(false);
        setSelectedLog(null);
        setApprovalNotes('');
        setApprovalSalary('');
        fetchData();
      }
    } catch (error) {
      console.error('Error processing approval:', error);
    }
  };

  const handleEditSalary = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/worklogs/${selectedLog._id}`, {
        salary: parseFloat(editFormData.salary) || 0
      });
      
      if (response.data.success) {
        setShowEditModal(false);
        setSelectedLog(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating salary:', error);
    }
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this work log? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await api.delete(`/worklogs/${logId}`);
      if (response.data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting work log:', error);
      alert(error.response?.data?.message || 'Failed to delete work log');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const filteredLogs = workLogs.filter(log => {
    const matchesFilter = filter === 'all' || log.status === filter;
    const matchesSearch = log.operator?.name?.toLowerCase().includes(search.toLowerCase()) ||
                         log.tractorId?.toLowerCase().includes(search.toLowerCase()) ||
                         log.fieldLocation?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const approvalRate = stats.totalWorkLogs > 0 
    ? ((stats.approvedWorkLogs / stats.totalWorkLogs) * 100).toFixed(1) 
    : 0;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Work Logs Management"
      subtitle="Review and approve operator entries"
    >
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Work Logs"
          value={stats.totalWorkLogs}
          icon={FileText}
          color="primary"
        />
        <StatCard
          title="Pending Approval"
          value={stats.pendingWorkLogs}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Approved"
          value={stats.approvedWorkLogs}
          icon={CheckCircle}
          color="success"
        />
        <StatCard
          title="Total Hours"
          value={`${stats.totalHoursWorked}h`}
          icon={Calendar}
          color="info"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl">
            <XCircle className="text-red-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-secondary-500">Rejected</p>
            <p className="text-2xl font-bold text-secondary-800">{stats.rejectedWorkLogs}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-yellow-50 rounded-xl">
            <Fuel className="text-yellow-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-secondary-500">Fuel Used</p>
            <p className="text-2xl font-bold text-secondary-800">{stats.totalFuelUsed}L</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-xl">
            <TrendingUp className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-secondary-500">Approval Rate</p>
            <p className="text-2xl font-bold text-secondary-800">{approvalRate}%</p>
          </div>
        </Card>
         <Card className="flex items-center gap-4">
           <div className="p-3 bg-blue-50 rounded-xl">
             <DollarSign className="text-blue-600" size={24} />
           </div>
           <div>
             <p className="text-sm text-secondary-500">Total Salary</p>
             <p className="text-2xl font-bold text-secondary-800">₱{(stats.totalSalary || 0).toFixed(2)}</p>
           </div>
         </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pending Approvals Section */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-800">Pending Approvals</h3>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
              {stats.pendingWorkLogs} pending
            </span>
          </div>
          <div className="space-y-3">
            {workLogs
              .filter(log => log.status === 'pending')
              .slice(0, 5)
              .map(log => (
                <div 
                  key={log._id}
                  className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-medium">
                        {log.operator?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-secondary-800">{log.operator?.name || 'Unknown'}</p>
                      <p className="text-sm text-secondary-500">
                        {new Date(log.date).toLocaleDateString()} - {log.tractorId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{log.hoursWorked}h</p>
                      <p className="text-sm text-secondary-500">{log.fieldLocation}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:bg-green-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                        setShowApprovalModal(true);
                      }}
                    >
                      <Check size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                        setShowApprovalModal(true);
                      }}
                    >
                      <X size={18} />
                    </Button>
                  </div>
                </div>
              ))}
            {stats.pendingWorkLogs === 0 && (
              <div className="text-center py-8 text-secondary-500">
                <CheckCircle className="mx-auto mb-2 text-green-600" size={48} />
                <p>All work logs have been reviewed!</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  activity.type === 'approved' ? 'bg-green-100' :
                  activity.type === 'rejected' ? 'bg-red-100' :
                  'bg-yellow-100'
                }`}>
                  {activity.type === 'approved' ? (
                    <CheckCircle className="text-green-600" size={14} />
                  ) : activity.type === 'rejected' ? (
                    <XCircle className="text-red-600" size={14} />
                  ) : (
                    <Clock className="text-yellow-600" size={14} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-secondary-700 truncate">{activity.message}</p>
                  <p className="text-xs text-secondary-500">{activity.time} - {activity.tractor}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Operator Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-800">Operator Performance</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>
              View All <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Operator</th>
                  <th>Logs</th>
                  <th>Hours</th>
                  <th>Approved</th>
                </tr>
              </thead>
              <tbody>
                {operatorPerformance.map((op, index) => (
                  <tr key={index}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 text-sm font-medium">
                            {op.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium">{op.name}</span>
                      </div>
                    </td>
                    <td>{op.totalLogs}</td>
                    <td>{op.totalHours}h</td>
                    <td>
                      <span className="text-green-600 font-medium">{op.approvedLogs}</span>
                      <span className="text-secondary-400">/ {op.totalLogs}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="secondary" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/admin/users')}
            >
              <Users size={24} />
              <span>Manage Users</span>
            </Button>
            <Button 
              variant="secondary" 
              className="h-auto py-4 flex-col gap-2"
              onClick={fetchData}
            >
              <RefreshCw size={24} />
              <span>Refresh Data</span>
            </Button>
            <Button 
              variant="secondary" 
              className="h-auto py-4 flex-col gap-2"
            >
              <Download size={24} />
              <span>Export Report</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-secondary-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field py-2 w-40"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={18} />
            <input
              type="text"
              placeholder="Search by operator, tractor, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Work Logs Table */}
      <Card padding={false}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Operator</th>
                <th>Tractor ID</th>
                <th>Location</th>
                <th>Hours</th>
                <th>Salary</th>
                <th>Fuel</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.slice(0, 10).map((log) => (
                <tr key={log._id}>
                  <td>{new Date(log.date).toLocaleDateString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 text-sm font-medium">
                          {log.operator?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <span>{log.operator?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-secondary-400" />
                      {log.tractorId}
                    </div>
                  </td>
                  <td>{log.fieldLocation}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-secondary-400" />
                      {log.hoursWorked}h
                    </div>
                  </td>
                   <td>
                     <div className="flex items-center gap-2">
                       <DollarSign size={16} className="text-secondary-400" />
                       ₱{log.salary?.toFixed(2) || 0}
                     </div>
                   </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Fuel size={16} className="text-secondary-400" />
                      {log.fuelUsed || 0}L
                    </div>
                  </td>
                  <td>{getStatusBadge(log.status)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye size={16} />
                      </Button>
                      {log.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:bg-green-50"
                            onClick={() => {
                              setSelectedLog(log);
                              setShowApprovalModal(true);
                            }}
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setSelectedLog(log);
                              setShowApprovalModal(true);
                            }}
                          >
<X size={16} />
                           </Button>
                         </>
                       )}
                       <Button
                         variant="ghost"
                         size="sm"
                         className="text-red-600 hover:text-red-700"
                         onClick={() => handleDelete(log._id)}
                         title="Delete Work Log"
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
      </Card>

      {/* View/Approve Modal */}
      <Modal
        isOpen={!!selectedLog && !showApprovalModal}
        onClose={() => {
          setSelectedLog(null);
          setApprovalNotes('');
        }}
        title="Work Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Date</p>
                <p className="font-medium">{new Date(selectedLog.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Operator</p>
                <p className="font-medium">{selectedLog.operator?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Tractor ID</p>
                <p className="font-medium">{selectedLog.tractorId}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Status</p>
                {getStatusBadge(selectedLog.status)}
              </div>
              <div>
                <p className="text-sm text-secondary-500">Start Time</p>
                <p className="font-medium">{selectedLog.startTime}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">End Time</p>
                <p className="font-medium">{selectedLog.endTime}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Hours Worked</p>
                <p className="font-medium">{selectedLog.hoursWorked}h</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Fuel Used</p>
                <p className="font-medium">{selectedLog.fuelUsed || 0}L</p>
              </div>
               <div>
                 <p className="text-sm text-secondary-500">Salary</p>
                 <p className="font-medium">₱{selectedLog.salary?.toFixed(2) || 0}</p>
               </div>
            </div>
            <div>
              <p className="text-sm text-secondary-500">Field Location</p>
              <p className="font-medium">{selectedLog.fieldLocation}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-500">Work Description</p>
              <p className="text-secondary-700">{selectedLog.workDescription}</p>
            </div>
{selectedLog.maintenanceNotes && (
              <div>
                <p className="text-sm text-secondary-500">Maintenance Notes</p>
                <p className="text-secondary-700">{selectedLog.maintenanceNotes}</p>
              </div>
            )}
            
            {selectedLog.status === 'pending' && (
              <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditFormData({ salary: selectedLog.salary || '' });
                    setShowEditModal(true);
                  }}
                >
                  Edit Salary
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowApprovalModal(true)}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => setShowApprovalModal(true)}
                >
                  Approve
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

       {/* Edit Salary Modal */}
       <Modal
         isOpen={showEditModal}
         onClose={() => {
           setShowEditModal(false);
           setEditFormData({ salary: '' });
         }}
         title="Edit Salary"
         size="sm"
       >
         <form onSubmit={handleEditSalary} className="space-y-4">
            <Input
              label="Salary (₱)"
              type="number"
              name="salary"
              value={editFormData.salary}
              onChange={(e) => setEditFormData({ salary: e.target.value })}
              placeholder="Enter salary amount"
              min="0"
              step="1"
              required
            />
           <div className="flex justify-end gap-3">
             <Button
               type="button"
               variant="secondary"
               onClick={() => {
                 setShowEditModal(false);
                 setEditFormData({ salary: '' });
               }}
             >
               Cancel
             </Button>
             <Button type="submit">Save Salary</Button>
           </div>
         </form>
       </Modal>

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setApprovalNotes('');
          setApprovalSalary('');
        }}
        title={`${selectedLog?.status === 'pending' ? 'Approve/Reject' : ''} Work Log`}
        size="md"
      >
        <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-secondary-700 mb-1.5">
               Salary Amount (₱) (for approval)
             </label>
             <Input
               type="number"
               value={approvalSalary}
               onChange={(e) => setApprovalSalary(e.target.value)}
               placeholder="Enter salary to pay operator"
               min="0"
               step="1"
             />
           </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
              Approval Notes (optional)
            </label>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              className="input-field"
              rows="3"
              placeholder="Add any notes..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowApprovalModal(false);
                setApprovalNotes('');
                setApprovalSalary('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => handleApproval('rejected')}
            >
              Reject
            </Button>
            <Button
              onClick={() => handleApproval('approved')}
            >
              Approve
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminWorkLogs;