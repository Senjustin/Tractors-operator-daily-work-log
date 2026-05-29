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
  Modal
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
  Check,
  X,
  ArrowRight,
  Activity,
  RefreshCw,
  Download
} from 'lucide-react';

const AdminDashboard = () => {
  const { loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalWorkLogs: 0,
    pendingWorkLogs: 0,
    approvedWorkLogs: 0,
    rejectedWorkLogs: 0,
    totalHoursWorked: 0,
    totalFuelUsed: 0
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
  const [approvalNotes, setApprovalNotes] = useState('');
  const [operatorPerformance, setOperatorPerformance] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

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
        approvalNotes
      });
      
      if (response.data.success) {
        setShowApprovalModal(false);
        setSelectedLog(null);
        setApprovalNotes('');
        fetchData();
      }
    } catch (error) {
      console.error('Error processing approval:', error);
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
      title="Admin Dashboard"
      subtitle="System overview and operator management"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
        <Card 
          className="flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/admin/users')}
        >
          <div className="p-3 bg-blue-50 rounded-xl">
            <Users className="text-blue-600" size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-secondary-500">Operators</p>
            <p className="text-2xl font-bold text-secondary-800">{userStats.operators}</p>
          </div>
          <ArrowRight className="text-blue-600" size={20} />
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl">
            <Activity className="text-purple-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-secondary-500">Active Users</p>
            <p className="text-2xl font-bold text-secondary-800">{userStats.activeUsers}</p>
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
              onClick={() => navigate('/admin/worklogs')}
            >
              <FileText size={24} />
              <span>All Work Logs</span>
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

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setApprovalNotes('');
        }}
        title={`${selectedLog?.status === 'pending' ? 'Approve/Reject' : ''} Work Log`}
        size="md"
      >
        <div className="space-y-4">
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

export default AdminDashboard;