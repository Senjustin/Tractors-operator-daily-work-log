const WorkLog = require('../models/WorkLog');
const User = require('../models/User');

// Constants
const DEFAULT_PAGE_SIZE = 20;

// Helper function for error responses
const errorResponse = (res, status, message) => {
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? message : undefined
  });
};

// Helper function for success responses
const successResponse = (res, status, data) => {
  return res.status(status).json({
    success: true,
    ...data
  });
};

// Create Work Log (Operator)
exports.createWorkLog = async (req, res) => {
  try {
    const errors = req.validationErrors || [];
    if (errors.length > 0) {
      return errorResponse(res, 400, 'Validation failed');
    }

    const workLogData = {
      ...req.body,
      operator: req.user.id
    };

    const workLog = await WorkLog.create(workLogData);
    await workLog.populate('operator', 'name email');

    successResponse(res, 201, {
      message: 'Work log created successfully',
      workLog
    });
  } catch (error) {
    console.error('Create work log error:', error);
    errorResponse(res, 500, 'Failed to create work log');
  }
};

// Get Work Logs (Operator - own logs, Admin - all logs)
exports.getWorkLogs = async (req, res) => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, status, startDate, endDate, operatorId } = req.query;
    
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'operator') {
      filter.operator = req.user.id;
    } else if (operatorId) {
      filter.operator = operatorId;
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    const workLogs = await WorkLog.find(filter)
      .populate('operator', 'name email role')
      .populate('approvedBy', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await WorkLog.countDocuments(filter);

    successResponse(res, 200, {
      workLogs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalLogs: count
    });
  } catch (error) {
    console.error('Get work logs error:', error);
    errorResponse(res, 500, 'Failed to fetch work logs');
  }
};

// Get Single Work Log
exports.getWorkLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const workLog = await WorkLog.findById(id)
      .populate('operator', 'name email role')
      .populate('approvedBy', 'name email');

    if (!workLog) {
      return errorResponse(res, 404, 'Work log not found');
    }

    // Authorization check - operator can only view their own logs
    if (req.user.role === 'operator' && workLog.operator._id.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Not authorized to view this work log');
    }

    successResponse(res, 200, { workLog });
  } catch (error) {
    console.error('Get work log by id error:', error);
    errorResponse(res, 500, 'Failed to fetch work log');
  }
};

// Update Work Log (Operator - pending only, Admin - all)
exports.updateWorkLog = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };

    let workLog = await WorkLog.findById(id);
    if (!workLog) {
      return errorResponse(res, 404, 'Work log not found');
    }

    // Authorization check
    if (req.user.role === 'operator' && workLog.operator.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Not authorized to update this work log');
    }

    // Operators can only update pending logs
    if (req.user.role === 'operator' && workLog.status !== 'pending') {
      return errorResponse(res, 403, 'Can only update pending work logs');
    }

    workLog = await WorkLog.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    })
      .populate('operator', 'name email role')
      .populate('approvedBy', 'name email');

    successResponse(res, 200, {
      message: 'Work log updated successfully',
      workLog
    });
  } catch (error) {
    console.error('Update work log error:', error);
    errorResponse(res, 500, 'Failed to update work log');
  }
};

// Helper function for approval/rejection
const processApproval = async (req, res, status) => {
  try {
    const { id } = req.params;
    const { approvalNotes, salary } = req.body;

    const updateData = {
      status,
      approvedBy: req.user.id,
      approvalDate: new Date(),
      updatedAt: new Date()
    };

    if (approvalNotes) {
      updateData.approvalNotes = approvalNotes;
    }
    
    if (salary !== undefined) {
      updateData.salary = salary;
    }

    const workLog = await WorkLog.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    })
      .populate('operator', 'name email role')
      .populate('approvedBy', 'name email');

    if (!workLog) {
      return errorResponse(res, 404, 'Work log not found');
    }

    successResponse(res, 200, {
      message: `Work log ${status} successfully`,
      workLog
    });
  } catch (error) {
    console.error('Process approval error:', error);
    errorResponse(res, 500, `Failed to ${status} work log`);
  }
};

// Approve Work Log (Admin only)
exports.approveWorkLog = async (req, res) => {
  await processApproval(req, res, 'approved');
};

// Reject Work Log (Admin only)
exports.rejectWorkLog = async (req, res) => {
  await processApproval(req, res, 'rejected');
};

// Delete Work Log (Operator - pending only, Admin - any)
exports.deleteWorkLog = async (req, res) => {
  try {
    const { id } = req.params;

    const workLog = await WorkLog.findById(id);
    if (!workLog) {
      return errorResponse(res, 404, 'Work log not found');
    }

    // Authorization check
    if (req.user.role === 'operator' && workLog.operator.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Not authorized to delete this work log');
    }

    // Operators can only delete pending logs
    if (req.user.role === 'operator' && workLog.status !== 'pending') {
      return errorResponse(res, 403, 'Can only delete pending work logs');
    }

    await WorkLog.findByIdAndDelete(id);

    successResponse(res, 200, {
      message: 'Work log deleted successfully'
    });
  } catch (error) {
    console.error('Delete work log error:', error);
    errorResponse(res, 500, 'Failed to delete work log');
  }
};

// Get Dashboard Stats (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate, operatorId } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const baseFilter = { ...(operatorId && { operator: operatorId }), ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}) };

    const [
      totalWorkLogs,
      pendingWorkLogs,
      approvedWorkLogs,
      rejectedWorkLogs
    ] = await Promise.all([
      WorkLog.countDocuments(baseFilter),
      WorkLog.countDocuments({ ...baseFilter, status: 'pending' }),
      WorkLog.countDocuments({ ...baseFilter, status: 'approved' }),
      WorkLog.countDocuments({ ...baseFilter, status: 'rejected' })
    ]);

    // Get aggregation for hours, fuel, and salary
    const aggregation = await WorkLog.aggregate([
      { $match: { ...baseFilter, status: 'approved' } },
      {
        $group: {
          _id: null,
          totalHours: { $sum: '$hoursWorked' },
          totalFuel: { $sum: '$fuelUsed' },
          totalSalary: { $sum: '$salary' }
        }
      }
    ]);

    const stats = {
      totalWorkLogs,
      pendingWorkLogs,
      approvedWorkLogs,
      rejectedWorkLogs,
      totalHoursWorked: aggregation[0]?.totalHours || 0,
      totalFuelUsed: aggregation[0]?.totalFuel || 0,
      totalSalary: aggregation[0]?.totalSalary || 0
    };

    successResponse(res, 200, { stats });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    errorResponse(res, 500, 'Failed to fetch dashboard stats');
  }
};

// Record salary payment for an operator (Admin only) - creates a work log with the payment
exports.recordOperatorPayment = async (req, res) => {
  try {
    const { operatorId } = req.params;
    const { amount, notes } = req.body;

    const amountValue = parseFloat(amount);
    if (!amountValue || amountValue <= 0) {
      return errorResponse(res, 400, 'Valid amount is required');
    }

    // Validate that the operator exists
    const operator = await User.findById(operatorId);
    if (!operator) {
      return errorResponse(res, 404, 'Operator not found');
    }

    if (operator.role !== 'operator') {
      return errorResponse(res, 400, 'Selected user is not an operator');
    }

    // Create a work log entry for the salary payment
    const workLog = await WorkLog.create({
      operator: operatorId,
      date: new Date(),
      tractorId: 'SALARY',
      startTime: '00:00',
      endTime: '00:00',
      fieldLocation: 'Salary Payment',
      workDescription: notes || 'Salary payment',
      hoursWorked: 0,
      fuelUsed: 0,
      salary: amountValue,
      status: 'approved',
      approvedBy: req.user.id,
      approvalDate: new Date()
    });

    await workLog.populate('operator', 'name email');
    await workLog.populate('approvedBy', 'name email');

    successResponse(res, 201, {
      message: 'Salary payment recorded successfully',
      workLog
    });
  } catch (error) {
    console.error('Record operator payment error:', error);
    errorResponse(res, 500, 'Failed to record salary payment');
  }
};
