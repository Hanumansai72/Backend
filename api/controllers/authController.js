const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Vendor = require('../models/admin');
const UserMain = require('../models/main_userprofile');
const otpsender = require('../models/otpschema');
const { sendOTP } = require('../services/emailService');
const { generateToken, setCookieToken, clearCookieToken } = require('../middleware/auth');

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
            const token = generateToken({
                id: user._id,
                email: user.login.email,
                role: 'admin'
            });

            // Set HTTP-only cookie
            setCookieToken(res, token);

            return res.json({
                message: 'Success',
                token, // Still return token for backward compatibility
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
            const token = generateToken({
                id: vendor._id,
                email: vendor.Email_address,
                role: vendor.Category == "Non-Technical" ? "Non-Technical" : "Technical"
            });

            // Set HTTP-only cookie
            setCookieToken(res, token);

            return res.json({
                message: 'Success',
                token, // Still return token for backward compatibility
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


exports.loginWithOtpVendor = async (req, res) => {
    const { email } = req.body;

    try {
        const vendor = await Vendor.findOne({ Email_address: email });
        if (!vendor) {
            return res.json({ message: 'User not found' });
        }

        const token = generateToken({
            id: vendor._id,
            email: vendor.Email_address,
            role: vendor.Category == "Non-Technical" ? "Non-Technical" : "Technical"

        });

        // Set HTTP-only cookie
        setCookieToken(res, token);

        return res.json({
            message: 'Success',
            token, // Still return token for backward compatibility
            vendorId: vendor._id,
            vendor: {
                id: vendor._id,
                businessName: vendor.Business_Name,
                ownerName: vendor.Owner_name,
                email: vendor.Email_address
            }
        });
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

        const token = generateToken({
            id: user._id,
            email: user.Emailaddress,
            role: 'customer'
        });

        // Set HTTP-only cookie
        setCookieToken(res, token);

        return res.status(200).json({
            message: 'Success',
            token, // Still return token for backward compatibility
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
            const token = generateToken({
                id: vendor._id,
                email: vendor.Email_address,
                role: vendor.Category == "Non-Technical" ? "Non-Technical" : "Technical"

            });

            // Set HTTP-only cookie
            setCookieToken(res, token);

            return res.json({
                message: 'Success',
                token, // Still return token for backward compatibility
                vendorId: vendor._id,
                vendor: {
                    id: vendor._id,
                    businessName: vendor.Business_Name,
                    ownerName: vendor.Owner_name,
                    email: vendor.Email_address
                }
            });
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

        const token = generateToken({
            id: user._id,
            email: user.Emailaddress,
            role: 'customer'
        });

        // Set HTTP-only cookie
        setCookieToken(res, token);

        res.json({
            message: 'Success',
            token, // Still return token for backward compatibility
            user: {
                id: user._id,
                email: user.Emailaddress,
                fullName: user.Full_Name
            }
        });
    } catch (err) {
        console.error('Google login error:', err);
        let message = 'Google login failed';

        // Handle MongoDB Duplicate Key Error (E11000)
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0];
            if (field === 'Phone_Number') {
                message = 'A user with this phone number already exists.';
            } else if (field === 'Emailaddress') {
                message = 'A user with this email already exists.';
            } else {
                message = `Duplicate account information found (${field})`;
            }
        }

        res.status(500).json({
            message,
            error: err.message
        });
    }
};

/**
 * Logout - Clear auth cookies
 */
exports.logout = async (req, res) => {
    try {
        clearCookieToken(res);
        return res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ message: 'Server error during logout' });
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
        console.log(`OTP ${otpCode} saved for ${Email}`);

        // Send the OTP email with detailed error logging
        try {
            console.log('Attempting to send OTP email to:', Email);
            console.log('SMTP Config:', {
                host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
                port: process.env.SMTP_PORT || 587,
                user: process.env.SMTP_USER ? 'SET' : 'NOT SET',
                pass: process.env.SMTP_PASS ? 'SET' : 'NOT SET'
            });

            const emailResult = await sendOTP(Email, otpCode);
            console.log('Email sent successfully:', emailResult);
        } catch (emailError) {
            console.error('SMTP Error Details:', {
                code: emailError.code,
                command: emailError.command,
                response: emailError.response,
                responseCode: emailError.responseCode,
                message: emailError.message
            });
            // OTP is saved, but email failed - still return success with warning
            return res.status(200).json({
                message: 'OTP generated but email delivery failed',
                otp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
                emailError: emailError.message
            });
        }

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
 * Get current user from token
 */
exports.getCurrentUser = async (req, res) => {
    try {
        // req.user is set by optionalAuth middleware
        if (!req.user) {
            return res.json({ authenticated: false, message: 'Not authenticated' });
        }

        const { id, email, role } = req.user;

        // Fetch full user data based on role
        if (role === 'vendor') {
            const vendor = await Vendor.findById(id).select('-Password');
            if (!vendor) {
                return res.status(404).json({ authenticated: false, message: 'Vendor not found' });
            }
            return res.json({
                authenticated: true,
                message: 'Success',
                user: {
                    id: vendor._id,
                    email: vendor.Email_address,
                    businessName: vendor.Business_Name,
                    ownerName: vendor.Owner_name,
                    role: 'vendor'
                }
            });
        } else if (role === 'customer') {
            const user = await UserMain.findById(id).select('-Password');
            if (!user) {
                return res.status(404).json({ authenticated: false, message: 'User not found' });
            }
            return res.json({
                authenticated: true,
                message: 'Success',
                user: {
                    id: user._id,
                    email: user.Emailaddress,
                    fullName: user.Full_Name,
                    role: 'customer'
                }
            });
        } else {
            // Admin or other roles
            return res.json({
                authenticated: true,
                message: 'Success',
                user: {
                    id,
                    email,
                    role
                }
            });
        }
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
