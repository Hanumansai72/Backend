const UserMain = require('../models/main_userprofile');
const bcrypt = require('bcrypt');
const { sendEmail } = require('../services/emailService');
const ErrorResponse = require('../utils/errorResponse');
const { ERROR_CODES } = require('../utils/errorCodes');

/**
 * Get user profile by ID
 */
exports.getUserProfile = async (req, res) => {
  try {
    const id = req.params.id;

    // Verify user can only access their own profile
    if (req.user && req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json(
        new ErrorResponse(
          ERROR_CODES.FORBIDDEN,
          'Access denied. You can only view your own profile',
          {},
          403
        ).toJSON()
      );
    }

    const myprofileid = await UserMain.findById(id);
    if (!myprofileid) {
      return res.status(404).json(
        new ErrorResponse(
          ERROR_CODES.RESOURCE_NOT_FOUND,
          'User not found',
          {},
          404
        ).toJSON()
      );
    }
    res.json({ success: true, user: myprofileid });
  } catch (err) {
    res.status(500).json(
      new ErrorResponse(
        ERROR_CODES.SERVER_ERROR,
        'Failed to fetch user profile',
        { error: err.message },
        500
      ).toJSON()
    );
  }
};

/**
 * Create user profile
 */
exports.createUserProfile = async (req, res) => {
  const {
    Full_Name,
    Emailaddress,
    Phone_Number,
    Password,
    Location
  } = req.body;

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(Password, saltRounds);

    const dataprofile = {
      Full_Name,
      Emailaddress,
      Phone_Number,
      Password: hashedPassword,
      Location
    };

    const data = await UserMain.create(dataprofile);
    console.log('Response saved successfully', data);
    res.status(201).json({ success: true, message: 'Profile saved successfully', data });
    try {
      // ... email sending code unchanged
    } catch (err) {
      console.log('Failed to send email', err);
    }
  } catch (err) {
    console.error('Failed to save data:', err);

    // Check for duplicate email
    if (err.code === 11000) {
      return res.status(409).json(
        new ErrorResponse(
          ERROR_CODES.DUPLICATE_USER,
          'User with this email already exists',
          { field: 'Emailaddress' },
          409
        ).toJSON()
      );
    }

    res.status(500).json(
      new ErrorResponse(
        ERROR_CODES.SERVER_ERROR,
        'Failed to save profile data',
        { error: err.message },
        500
      ).toJSON()
    );
  }
};

/**
 * Fetch user profile with login
 */
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserMain.findOne({ Emailaddress: email });

    if (!user) {
      return res.status(404).json(
        new ErrorResponse(
          ERROR_CODES.RESOURCE_NOT_FOUND,
          'User not found',
          {},
          404
        ).toJSON()
      );
    }

    const isPasswordMatch = await bcrypt.compare(password, user.Password);

    if (isPasswordMatch) {
      const { generateToken } = require('../middleware/auth');
      const token = generateToken({
        id: user._id,
        email: user.Emailaddress,
        role: 'customer'
      });

      return res.status(200).json({
        success: true,
        message: 'Success',
        token,
        user: {
          id: user._id,
          email: user.Emailaddress,
          fullName: user.Full_Name
        },
        userId: user._id
      });
    } else {
      return res.status(401).json(
        new ErrorResponse(
          ERROR_CODES.INVALID_CREDENTIALS,
          'Invalid email or password',
          {},
          401
        ).toJSON()
      );
    }
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json(
      new ErrorResponse(
        ERROR_CODES.SERVER_ERROR,
        'Login failed. Please try again',
        { error: err.message },
        500
      ).toJSON()
    );
  }
};

/**
 * Update user profile
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verify user can only update their own profile
    if (req.user && req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json(
        new ErrorResponse(
          ERROR_CODES.FORBIDDEN,
          'Access denied. You can only update your own profile',
          {},
          403
        ).toJSON()
      );
    }

    // If password is included in updates, we need to hash it.
    if (updates.Password) {
      const saltRounds = 10;
      updates.Password = await bcrypt.hash(updates.Password, saltRounds);
    }

    const updatedUser = await UserMain.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json(
        new ErrorResponse(
          ERROR_CODES.RESOURCE_NOT_FOUND,
          'User not found',
          {},
          404
        ).toJSON()
      );
    }

    res.json({ success: true, message: 'Profile updated successfully', data: updatedUser });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json(
      new ErrorResponse(
        ERROR_CODES.SERVER_ERROR,
        'Failed to update profile',
        { error: err.message },
        500
      ).toJSON()
    );
  }
};
