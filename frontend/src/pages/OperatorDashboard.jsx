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
  Plus, 
  Clock, 
  Calendar, 
  MapPin,
  Tractor,
  FileText,
  CheckCircle,
  XCircle,
  Fuel,
  ChevronRight,
  Target,
  DollarSign
} from 'lucide-react';

const OperatorDashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalLogs: 0,
    pendingLogs: 0,
    approvedLogs: 0,
    rejectedLogs: 0,
    totalHours: 0,
    avgHoursPerDay: 0,
    totalFuelUsed: 0,
    totalSalary: 0
  });
  const [workLogs, setWorkLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    tractorId: '',
    startTime: '',
    endTime: '',
    fieldLocation: '',
    workDescription: '',
    hoursWorked: '',
    fuelUsed: '',
    maintenanceNotes: ''
  });
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/worklogs');
      if (response.data.success) {
        const logs = response.data.workLogs;
        setWorkLogs(logs);
        calculateStats(logs);
        calculateWeeklyData(logs);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const calculateStats = (logs) => {
    const totalHours = logs.reduce((sum, l) => sum + (l.hoursWorked || 0), 0);
    const uniqueDays = new Set(logs.map(l => l.date)).size;
    
    setStats({
      totalLogs: logs.length,
      pendingLogs: logs.filter(l => l.status === 'pending').length,
      approvedLogs: logs.filter(l => l.status === 'approved').length,
      rejectedLogs: logs.filter(l => l.status === 'rejected').length,
      totalHours,
      avgHoursPerDay: uniqueDays > 0 ? (totalHours / uniqueDays).toFixed(1) : 0,
      totalFuelUsed: logs.reduce((sum, l) => sum + (l.fuelUsed || 0), 0),
      totalSalary: logs.reduce((sum, l) => sum + (l.salary || 0), 0)
    });
  };

  const calculateWeeklyData = (logs) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekly = days.map((day, index) => {
      const dayLogs = logs.filter(l => {
        const logDate = new Date(l.date);
        return logDate.getDay() === index;
      });
      return {
        day,
        hours: dayLogs.reduce((sum, l) => sum + (l.hoursWorked || 0), 0),
        logs: dayLogs.length
      };
    });
    setWeeklyData(weekly);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'startTime' || name === 'endTime') {
        if (updated.startTime && updated.endTime) {
          const start = new Date(`2000-01-01T${updated.startTime}`);
          const end = new Date(`2000-01-01T${updated.endTime}`);
          if (end > start) {
            const diffMs = end - start;
            let diffHrs = diffMs / (1000 * 60 * 60);
            
            // Subtract 1 hour for break time if work spans 12pm-1pm
            const breakStart = new Date(`2000-01-01T12:00`);
            const breakEnd = new Date(`2000-01-01T13:00`);
            if (start < breakEnd && end > breakStart) {
              diffHrs = Math.max(0, diffHrs - 1);
            }
            
            updated.hoursWorked = diffHrs.toFixed(1);
          }
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/worklogs', formData);
      if (response.data.success) {
        setShowModal(false);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error creating work log:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/worklogs/${selectedLog._id}`, formData);
      if (response.data.success) {
        setShowModal(false);
        setSelectedLog(null);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error updating work log:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      tractorId: '',
      startTime: '',
      endTime: '',
      fieldLocation: '',
      workDescription: '',
      hoursWorked: '',
      fuelUsed: '',
      maintenanceNotes: ''
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const maxWeeklyHours = Math.max(...weeklyData.map(d => d.hours), 1);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.name || 'Operator'}`}
      subtitle="Track and manage your daily work activities"
    >
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Work Logs"
          value={stats.totalLogs}
          icon={FileText}
          color="primary"
        />
        <StatCard
          title="Total Hours"
          value={`${stats.totalHours}h`}
          icon={Clock}
          color="info"
        />
         <StatCard
           title="Total Salary"
           value={`₱${(stats.totalSalary || 0).toFixed(2)}`}
           icon={DollarSign}
           color="success"
         />
        <StatCard
          title="Pending Approval"
          value={stats.pendingLogs}
          icon={Calendar}
          color="warning"
        />
      </div>

      {/* Weekly Overview Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-800">Weekly Overview</h3>
            <span className="text-sm text-secondary-500">Hours worked this week</span>
          </div>
          <div className="flex items-end justify-between h-48 gap-2">
            {weeklyData.map((day, index) => (
              <div key={day.day} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center gap-1">
                  <span className="text-xs text-secondary-500">{day.hours}h</span>
                  <div 
                    className="w-full bg-primary-100 rounded-t-lg transition-all duration-300"
                    style={{ 
                      height: `${Math.max((day.hours / maxWeeklyHours) * 120, 8)}px`,
                      backgroundColor: day.hours > 0 ? 'var(--color-primary-500)' : 'var(--color-secondary-200)'
                    }}
                  ></div>
                </div>
                <span className="text-xs text-secondary-500 mt-2">{day.day}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
                <span className="text-secondary-700">Approved</span>
              </div>
              <span className="font-bold text-secondary-800">{stats.approvedLogs}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="text-red-600" size={20} />
                </div>
                <span className="text-secondary-700">Rejected</span>
              </div>
              <span className="font-bold text-secondary-800">{stats.rejectedLogs}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Fuel className="text-yellow-600" size={20} />
                </div>
                <span className="text-secondary-700">Fuel Used</span>
              </div>
              <span className="font-bold text-secondary-800">{stats.totalFuelUsed}L</span>
            </div>
             <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-100 rounded-lg">
                   <DollarSign className="text-blue-600" size={20} />
                 </div>
                 <span className="text-secondary-700">Total Salary</span>
               </div>
               <span className="font-bold text-secondary-800">₱{(stats.totalSalary || 0).toFixed(2)}</span>
             </div>
          </div>
        </Card>
      </div>

      {/* Recent Work Logs Preview */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-secondary-800">Recent Work Logs</h3>
          <p className="text-secondary-500 text-sm">Your latest entries</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={() => navigate('/dashboard/worklogs')}
            className="flex items-center gap-2"
          >
            View All Work Logs
            <ChevronRight size={16} />
          </Button>
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
            <Plus size={18} />
            Add Work Log
          </Button>
        </div>
      </div>

      {/* Work Logs Table Preview */}
      <Card padding={false}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Tractor ID</th>
                <th>Location</th>
                <th>Hours</th>
                <th>Fuel</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {workLogs.slice(0, 5).map((log) => (
                <tr key={log._id}>
                  <td>{new Date(log.date).toLocaleDateString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Tractor size={16} className="text-secondary-400" />
                      {log.tractorId}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-secondary-400" />
                      {log.fieldLocation}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-secondary-400" />
                      {log.hoursWorked}h
                    </div>
                  </td>
                  <td>{log.fuelUsed || 0}L</td>
                  <td>{getStatusBadge(log.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Work Log Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={selectedLog ? 'Edit Work Log' : 'Add New Work Log'}
        size="lg"
      >
        <form onSubmit={selectedLog ? handleUpdate : handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Tractor ID"
              name="tractorId"
              value={formData.tractorId}
              onChange={handleInputChange}
              placeholder="e.g., TR-001"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              required
            />
            <Input
              label="End Time"
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              required
            />
          </div>

          <Input
            label="Field Location"
            name="fieldLocation"
            value={formData.fieldLocation}
            onChange={handleInputChange}
            placeholder="e.g., North Field"
            required
          />

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
              Work Description
            </label>
            <textarea
              name="workDescription"
              value={formData.workDescription}
              onChange={handleInputChange}
              className="input-field"
              rows="3"
              placeholder="Describe the work done..."
              required
            />
          </div>

<div className="grid grid-cols-2 gap-4">
             <Input
               label="Hours Worked"
               type="number"
               name="hoursWorked"
               value={formData.hoursWorked}
               onChange={handleInputChange}
               placeholder="Auto-calculated"
               min="0"
               step="0.5"
               required
               readOnly
             />
           </div>

           <div className="grid grid-cols-2 gap-4">
             <Input
               label="Fuel Used (L)"
               type="number"
               name="fuelUsed"
               value={formData.fuelUsed}
               onChange={handleInputChange}
               placeholder="e.g., 25"
               min="0"
               step="0.1"
             />
           </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
              Maintenance Notes
            </label>
            <textarea
              name="maintenanceNotes"
              value={formData.maintenanceNotes}
              onChange={handleInputChange}
              className="input-field"
              rows="2"
              placeholder="Any maintenance notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => {
              setShowModal(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button type="submit">
              {selectedLog ? 'Update' : 'Submit'} Work Log
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default OperatorDashboard;