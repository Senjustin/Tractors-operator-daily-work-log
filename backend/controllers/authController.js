const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Constants
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRE }
  );
};

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

// Register User
exports.register = async (req, res) => {
  try {
    const errors = req.validationErrors || [];
    if (errors.length > 0) {
      return errorResponse(res, 400, 'Validation failed');
    }

    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return errorResponse(res, 400, 'User with this email already exists');
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'operator'
    });

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    successResponse(res, 201, {
      message: 'User registered successfully',
      token,
      refreshToken,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    errorResponse(res, 500, 'Registration failed. Please try again.');
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const errors = req.validationErrors || [];
    if (errors.length > 0) {
      return errorResponse(res, 400, 'Validation failed');
    }

    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      return errorResponse(res, 403, 'Account is deactivated. Please contact administrator.');
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    successResponse(res, 200, {
      message: 'Login successful',
      token,
      refreshToken,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, 500, 'Login failed. Please try again.');
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    successResponse(res, 200, { user });
  } catch (error) {
    console.error('Get current user error:', error);
    errorResponse(res, 500, 'Failed to fetch user');
  }
};

// Get All Users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, active } = req.query;
    
    const filter = {};
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    const users = await User.find(filter)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(filter);

    successResponse(res, 200, {
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count
    });
  } catch (error) {
    console.error('Get all users error:', error);
    errorResponse(res, 500, 'Failed to fetch users');
  }
};

// Update User (Admin)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { name, email, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    successResponse(res, 200, {
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    errorResponse(res, 500, 'Failed to update user');
  }
};

// Delete User (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    successResponse(res, 200, {
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    errorResponse(res, 500, 'Failed to delete user');
  }
};

};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const isPasswordMatch = await user.matchPassword(oldPassword);
    if (!isPasswordMatch) {
      return errorResponse(res, 401, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    successResponse(res, 200, {
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    errorResponse(res, 500, 'Failed to change password');
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 401, 'Refresh token is required');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    // Find user by id
    const user = await User.findById(decoded.id);
    if (!user) {
      return errorResponse(res, 401, 'Invalid refresh token');
    }

    // Check if refresh token matches
    if (user.refreshToken !== refreshToken) {
      return errorResponse(res, 401, 'Invalid refresh token');
    }

    // Generate new access token
    const token = generateToken(user);

    successResponse(res, 200, {
      message: 'Token refreshed successfully',
      token
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Invalid or expired refresh token');
    }
    
    errorResponse(res, 500, 'Token refresh failed. Please try again.');
  }
};
