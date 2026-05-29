const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const workLogController = require('../controllers/workLogController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const handleValidationErrors = require('../middleware/validationHandler');

// Record salary payment for an operator (Admin only) - must come BEFORE /:id
router.post(
  '/operator-payment/:operatorId',
  auth,
  authorize('admin'),
  workLogController.recordOperatorPayment
);

// Create Work Log (Operator)
router.post(
  '/',
  auth,
  authorize('operator', 'admin'),
  [
    body('date', 'Date is required').notEmpty(),
    body('tractorId', 'Tractor ID is required').trim().notEmpty(),
    body('startTime', 'Start time is required').notEmpty(),
    body('endTime', 'End time is required').notEmpty(),
    body('fieldLocation', 'Field location is required').trim().notEmpty(),
    body('workDescription', 'Work description is required').trim().notEmpty(),
    body('hoursWorked', 'Hours worked is required').isNumeric().notEmpty()
  ],
  handleValidationErrors,
  workLogController.createWorkLog
);

// Get Work Logs
router.get('/', auth, workLogController.getWorkLogs);

// Get Single Work Log
router.get('/:id', auth, workLogController.getWorkLogById);

// Update Work Log (Operator can update their own, Admin can update any)
router.put('/:id', auth, [
  body('date').optional(),
  body('tractorId').optional().trim(),
  body('startTime').optional(),
  body('endTime').optional(),
  body('fieldLocation').optional().trim(),
  body('workDescription').optional().trim(),
  body('hoursWorked').optional().isNumeric(),
  body('fuelUsed').optional().isNumeric()
], handleValidationErrors, workLogController.updateWorkLog);

// Approve Work Log (Admin only)
router.put('/:id/approve', auth, authorize('admin'), workLogController.approveWorkLog);

// Reject Work Log (Admin only)
router.put('/:id/reject', auth, authorize('admin'), workLogController.rejectWorkLog);

// Delete Work Log (Operator can delete their own pending logs, Admin can delete any)
router.delete('/:id', auth, workLogController.deleteWorkLog);

// Dashboard Stats (Admin)
router.get('/stats/dashboard', auth, authorize('admin'), (req, res, next) => {
  if (req.query.operatorId && req.user.role === 'admin') {
    return workLogController.getDashboardStats(req, res, next);
  }
  return workLogController.getDashboardStats(req, res, next);
});

module.exports = router;