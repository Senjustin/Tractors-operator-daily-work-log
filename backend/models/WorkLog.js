const mongoose = require('mongoose');

const workLogSchema = new mongoose.Schema({
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Work log must be associated with an operator'],
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Work date is required'],
    index: true
  },
  tractorId: {
    type: String,
    required: [true, 'Tractor ID is required'],
    trim: true,
    maxlength: [50, 'Tractor ID cannot exceed 50 characters']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  fieldLocation: {
    type: String,
    required: [true, 'Field location is required'],
    trim: true,
    maxlength: [100, 'Field location cannot exceed 100 characters']
  },
  workDescription: {
    type: String,
    required: [true, 'Work description is required'],
    trim: true,
    maxlength: [500, 'Work description cannot exceed 500 characters']
  },
  hoursWorked: {
    type: Number,
    required: [true, 'Hours worked is required'],
    min: [0, 'Hours worked cannot be negative'],
    max: [24, 'Hours worked cannot exceed 24 hours']
  },
  fuelUsed: {
    type: Number,
    default: 0,
    min: [0, 'Fuel used cannot be negative']
  },
  salary: {
    type: Number,
    default: 0,
    min: [0, 'Salary cannot be negative']
  },
  maintenanceNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Maintenance notes cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: 'Status must be pending, approved, or rejected'
    },
    default: 'pending',
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvalDate: {
    type: Date,
    default: null
  },
  approvalNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Approval notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
workLogSchema.index({ operator: 1, date: -1 });
workLogSchema.index({ status: 1, date: -1 });
workLogSchema.index({ approvedBy: 1 });

// Virtual for calculating duration from start/end times
workLogSchema.virtual('duration').get(function() {
  if (this.startTime && this.endTime) {
    return `${this.startTime} - ${this.endTime}`;
  }
  return null;
});

// Ensure virtuals are included in JSON output
workLogSchema.set('toJSON', { virtuals: true });
workLogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('WorkLog', workLogSchema);
