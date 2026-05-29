import React, { useState, useEffect, useContext } from 'react';
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
  Edit,
  Trash2,
  Eye,
  Filter,
  Target,
  DollarSign
} from 'lucide-react';

const OperatorWorkLogs = () => {
  const { loading: authLoading } = useContext(AuthContext);
  
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

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
        setShowViewModal(false);
        setSelectedLog(null);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error updating work log:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/worklogs/${selectedLog._id}`);
      if (response.data.success) {
        setShowDeleteModal(false);
        setSelectedLog(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting work log:', error);
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

  const openEditModal = (log) => {
    let calculatedHours = log.hoursWorked;
    if (log.startTime && log.endTime) {
      const start = new Date(`2000-01-01T${log.startTime}`);
      const end = new Date(`2000-01-01T${log.endTime}`);
      if (end > start) {
        const diffMs = end - start;
        let diffHrs = diffMs / (1000 * 60 * 60);
        
        // Subtract 1 hour for break time if work spans 12pm-1pm
        const breakStart = new Date(`2000-01-01T12:00`);
        const breakEnd = new Date(`2000-01-01T13:00`);
        if (start < breakEnd && end > breakStart) {
          diffHrs = Math.max(0, diffHrs - 1);
        }
        
        calculatedHours = diffHrs.toFixed(1);
      }
    }
    setFormData({
      date: log.date.split('T')[0],
      tractorId: log.tractorId,
      startTime: log.startTime,
      endTime: log.endTime,
      fieldLocation: log.fieldLocation,
      workDescription: log.workDescription,
      hoursWorked: calculatedHours,
      fuelUsed: log.fuelUsed || '',
      maintenanceNotes: log.maintenanceNotes || ''
    });
    setShowViewModal(false);
    setShowModal(true);
  };

  const openDeleteConfirmation = (log) => {
    setSelectedLog(log);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const filteredAndSortedLogs = workLogs
    .filter(log => filter === 'all' || log.status === filter)
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(b.date) - new Date(a.date);
      } else if (sortBy === 'hoursWorked') {
        comparison = b.hoursWorked - a.hoursWorked;
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="My Work Logs"
      subtitle="View and manage your work entries"
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

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-secondary-800">Work Log Entries</h3>
          <p className="text-secondary-500 text-sm">View and manage your entries</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-secondary-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field py-2 w-36"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="input-field py-2 w-36"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="hoursWorked-desc">Most Hours</option>
            <option value="status-asc">Status</option>
          </select>
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
            <Plus size={18} />
            Add Work Log
          </Button>
        </div>
      </div>

      {/* Work Logs Table */}
      <Card padding={false}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
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
              {filteredAndSortedLogs.slice(0, 10).map((log) => (
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
                   <td>
                     <div className="flex items-center gap-2">
                       <DollarSign size={16} className="text-secondary-400" />
                       ₱{log.salary?.toFixed(2) || 0}
                     </div>
                   </td>
                  <td>{log.fuelUsed || 0}L</td>
                  <td>{getStatusBadge(log.status)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log);
                          setShowViewModal(true);
                        }}
                      >
                        <Eye size={16} />
                      </Button>
                      {log.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary-600 hover:bg-primary-50"
                            onClick={() => openEditModal(log)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => openDeleteConfirmation(log)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
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

      {/* View Work Log Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedLog(null);
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
                <p className="text-sm text-secondary-500">Status</p>
                {getStatusBadge(selectedLog.status)}
              </div>
              <div>
                <p className="text-sm text-secondary-500">Tractor ID</p>
                <p className="font-medium">{selectedLog.tractorId}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Hours Worked</p>
                <p className="font-medium">{selectedLog.hoursWorked}h</p>
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
                  variant="secondary"
                  onClick={() => openEditModal(selectedLog)}
                >
                  <Edit size={16} className="mr-2" />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => openDeleteConfirmation(selectedLog)}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedLog(null);
        }}
        title="Delete Work Log"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-secondary-700">
            Are you sure you want to delete this work log? This action cannot be undone.
          </p>
          {selectedLog && (
            <div className="p-4 bg-secondary-50 rounded-lg">
              <p className="font-medium">{new Date(selectedLog.date).toLocaleDateString()}</p>
              <p className="text-sm text-secondary-500">
                {selectedLog.tractorId} - {selectedLog.fieldLocation} ({selectedLog.hoursWorked}h)
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedLog(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Work Log
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default OperatorWorkLogs;