const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Vendor = require('../models/admin');
const UserMain = require('../models/main_userprofile');
const otpsender = require('../models/otpschema');
const { sendOTP } = require('../services/emailService');

// Admin Login Schema
const AdminLoginSchema = new mongoose.Schema({
    login: {
        id: String,
        email: String,
        password: String
    }
}, { collection: 'Admin-Login' });
const AdminLogin = mongoose.models.AdminLogin || mongoose.model('AdminLogin', AdminLoginSchema);

/**
 * Admin login
 */
exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;
    console.log('Received login:', email, password);

    try {
        const user = await AdminLogin.findOne({ 'login.email': email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Use bcrypt to compare passwords
        const passwordMatch = await bcrypt.compare(password, user.login.password);

        if (passwordMatch) {
            const { generateToken } = require('../middleware/auth');
            const token = generateToken({
                id: user._id,
                email: user.login.email,
                role: 'admin'
            });

            if (req.session) {
                req.session.user = {
                    id: user._id,
                    email: user.login.email,
                    role: 'admin'
                };
            }

            return res.json({
                message: 'Success',
                token,
                user: {
                    id: user._id,
                    email: user.login.email
                }
            });
        } else {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Vendor login with email and password
 */
exports.vendorLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        const vendor = await Vendor.findOne({ Email_address: username });

        if (!vendor) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, vendor.Password);

        if (passwordMatch) {
            const { generateToken } = require('../middleware/auth');
            const token = generateToken({
                id: vendor._id,
                email: vendor.Email_address,
                role: 'vendor'
            });

            if (req.session) {
                req.session.user = {
                    id: vendor._id,
                    email: vendor.Email_address,
                    role: 'vendor',
                    businessName: vendor.Business_Name
                };
            }

            return res.json({
                message: 'Success',
                token,
                vendorId: vendor._id,
                vendor: {
                    id: vendor._id,
                    businessName: vendor.Business_Name,
                    ownerName: vendor.Owner_name,
                    email: vendor.Email_address
                }
            });
        } else {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Login with OTP (vendor)
 */
exports.loginWithOtpVendor = async (req, res) => {
    const { email } = req.body;

    try {
        const vendor = await Vendor.findOne({ Email_address: email });
        if (!vendor) {
            return res.json({ message: 'User not found' });
        }

        return res.json({ message: 'Success', vendorId: vendor._id });
    } catch (err) {
        console.error('Login with OTP error:', err);
        return res.status(500).json({ message: 'Server error during login with OTP' });
    }
};

/**
 * Login with OTP (customer)
 */
exports.loginWithOtpCustomer = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await UserMain.findOne({ Emailaddress: email }).select('-Password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { generateToken } = require('../middleware/auth');
        const token = generateToken({
            id: user._id,
            email: user.Emailaddress,
            role: 'customer'
        });

        if (req.session) {
            req.session.user = {
                id: user._id,
                email: user.Emailaddress,
                role: 'customer',
                fullName: user.Full_Name
            };
        }

        return res.status(200).json({
            message: 'Success',
            token,
            userId: user._id,
            user: {
                id: user._id,
                fullName: user.Full_Name,
                email: user.Emailaddress
            }
        });
    } catch (err) {
        console.error('Error logging in with OTP:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Google login for vendor
 */
exports.googleLoginVendor = async (req, res) => {
    const { email, name } = req.body;

    try {
        const vendor = await Vendor.findOne({ Email_address: email });
        const TempVendor = require('../models/vendor-register');
        const tempVendor = await TempVendor.findOne({ Email_address: email });

        if (vendor) {
            if (vendor) {
                return res.json({ message: 'Success', vendorId: vendor._id });
            } else {
                return res.json({ message: 'User pending approval' });
            }
        } else if (tempVendor) {
            return res.json({ message: 'User pending approval' });
        } else {
            const newVendor = new TempVendor({
                Owner_name: name,
                Email_address: email,
                isGoogleSignup: true,
            });
            await newVendor.save();
            return res.json({ message: 'User pending approval' });
        }
    } catch (error) {
        console.error('Google login error:', error);
        return res.status(500).json({ message: 'Server error during Google login' });
    }
};

/**
 * Google login for customer
 */
exports.googleLoginCustomer = async (req, res) => {
    const { email, name } = req.body;

    try {
        if (!email || !name) {
            return res.status(400).json({ message: 'Missing required fields: Name or Email' });
        }

        let user = await UserMain.findOne({ Emailaddress: email });

        if (!user) {
            user = await UserMain.create({
                Full_Name: name,
                Emailaddress: email
            });
        }

        res.json({ message: 'Success', user });
    } catch (err) {
        console.error('Google login error:', err);
        res.status(500).json({
            message: 'Google login failed',
            error: err.message
        });
    }
};

/**
 * Send OTP to email
 */
exports.sendOtp = async (req, res) => {
    try {
        const { Email } = req.body;
        if (!Email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000);

        // Remove any old OTPs for the same email
        await otpsender.deleteMany({ Email });

        // Save OTP with expiration (10 minutes)
        const newOtp = new otpsender({
            Email,
            Otp: otpCode,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });
        await newOtp.save();

        // Send the OTP email
        await sendOTP(Email, otpCode);

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error in sendotp:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Verify OTP
 */
exports.verifyOtp = async (req, res) => {
    const { Email, otp } = req.body;

    try {
        const verifyOtp = await otpsender.findOne({
            Email: Email,
            Otp: otp,
            expiresAt: { $gt: new Date() } // Check if not expired
        });

        if (verifyOtp) {
            // Delete OTP after successful verification
            await otpsender.deleteOne({ _id: verifyOtp._id });
            res.status(200).json({ message: 'OTP verified' });
        } else {
            res.status(400).json({ message: 'Invalid or expired OTP' });
        }
    } catch (err) {
        console.error('OTP verification error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Forget password - reset user password
 */
exports.forgetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and new password are required' });
        }

        const user = await UserMain.findOne({ Emailaddress: email });

        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user.Password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error in forget password:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

/**
 * Get current authenticated user session
 */
exports.getMe = async (req, res) => {
    if (req.session && req.session.user) {
        return res.json({
            authenticated: true,
            user: req.session.user
        });
    }
    return res.status(401).json({ authenticated: false, message: 'Not authenticated' });
};

/**
 * Logout user and destroy session
 */
exports.logout = (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: 'Could not log out, please try again' });
            }
            res.clearCookie('sessionId');
            return res.json({ message: 'Logged out successfully' });
        });
    } else {
        return res.json({ message: 'No session to logout' });
    }
};
