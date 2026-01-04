const UserMain = require('../models/main_userprofile');
const bcrypt = require('bcrypt');
const { sendEmail } = require('../services/emailService');

/**
 * Get user profile by ID
 */
exports.getUserProfile = async (req, res) => {
  try {
    const id = req.params.id;

    // Verify user can only access their own profile
    if (req.user && req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
    }

    const myprofileid = await UserMain.findById(id);
    if (!myprofileid) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(myprofileid);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
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
    res.status(201).json({ message: 'Profile saved successfully', data });
    try {
      const subject = 'Thanks For Register';
      const htmlContents = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Welcome Email</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8f8f8; padding: 20px;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" 
         style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td align="center" style="padding: 20px; background-color: #004aad;">
        <img src="https://res.cloudinary.com/dqxsgmf33/image/upload/v1755801310/Changed_logo_dfshkt.png" alt="Apna Mestri Logo" width="150" style="display:block;">
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <h2 style="color:#333;">Welcome to Apna Mestri!</h2>
        <p style="color:#555; font-size: 16px; line-height: 24px;">
          Thank you for registering as a customer. You can now explore our services and book professionals easily.
        </p>
        <p style="text-align: center; margin-top: 20px;">
          <a href="https://apnamestri.com/login" 
             style="background-color: #004aad; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Get Started
          </a>
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="background-color:#f0f0f0; padding: 15px; color:#777; font-size: 14px;">
        © 2025 Apna Mestri. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>

`;

      await sendEmail(Emailaddress, Full_Name, htmlContents, subject);
    } catch (err) {
      console.log('Failed to send email', err);
    }
  } catch (err) {
    console.error('Failed to save data:', err);
    res.status(500).json({ error: 'Failed to save profile data' });
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
      return res.status(404).json({ message: 'User not found' });
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
      return res.status(401).json({ message: 'Invalid password' });
    }
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
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
      return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
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
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', data: updatedUser });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
