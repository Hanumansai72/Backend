const bcrypt = require('bcrypt');
const Vendor = require('../models/admin');
const TempVendor = require('../models/vendor-register');
const booking_service = require('../models/servicebooking');
const { sendEmail } = require('../services/emailService');

/**
 * Get all vendor registrations (temp vendors)
 */
exports.getAllVendorRegistrations = async (req, res) => {
    try {
        const registration_vendor = await TempVendor.find();
        res.json(registration_vendor);
    } catch (err) {
        console.error('Error fetching vendor registrations:', err);
        res.status(500).json({ error: 'Server error fetching registrations' });
    }
};

/**
 * Get all approved vendors
 */
exports.getAllVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find();
        res.status(200).json({
            success: true,
            data: vendors
        });
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error. Could not fetch vendors.'
        });
    }
};

/**
 * Get vendor count
 */
exports.getVendorCount = async (req, res) => {
    try {
        const productdata = require('../models/vendorproudctdetails');
        const count = await Vendor.countDocuments();
        const count1 = await productdata.countDocuments();

        res.json({ count, count1 });
    } catch (err) {
        console.log('error Fetching', err);
        res.status(500).json({ error: 'server error' });
    }
};

/**
 * Get count of pending vendor requests
 */
exports.getPendingRequestCount = async (req, res) => {
    try {
        const valueofrequest = await TempVendor.countDocuments();
        res.json({ valueofrequest });
    } catch (err) {
        console.log('error Fetching', err);
        res.status(500).json({ error: 'server error' });
    }
};

/**
 * Get vendor details by ID
 */
exports.getVendorDetails = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: 'Vendor ID is required' });
        }

        const vendor = await Vendor.findById(id);

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        const emptyFields = Object.keys(vendor._doc).filter(
            key =>
                vendor[key] === '' ||
                vendor[key] === null ||
                (Array.isArray(vendor[key]) && vendor[key].length === 0)
        );

        res.status(200).json({
            vendor,
            emptyFields,
        });
    } catch (err) {
        console.error('Error fetching vendor details:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Get vendor settings by ID
 */
exports.getVendorSettings = async (req, res) => {
    try {
        const vendorsid = req.params.id;

        // Verify vendor can only access their own settings
        if (req.user && req.user.id !== vendorsid && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. You can only view your own settings.' });
        }

        const datasettings = await Vendor.findById(vendorsid);
        if (!datasettings) {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        res.json({ datasettings });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Get professional/vendor details by ID
 */
exports.getProfessionalDetails = async (req, res) => {
    try {
        const ids = req.params.id;
        if (ids) {
            const find_details = await Vendor.findById(ids);
            res.json(find_details);
        } else {
            return res.status(400).json({ message: 'Vendor ID is required' });
        }
    } catch (err) {
        console.error('Error fetching professional details:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
exports.Getjobhistory = async (req, res) => {
    const id = req.params.id;

    // Verify vendor can only access their own job history
    if (req.user && req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. You can only view your own job history.' });
    }

    try {
        const databse1 = await booking_service.find({ Vendorid: id, status: "Completed" });
        res.json(databse1);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Get vendor category by ID
 */
exports.getVendorCategory = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id).select('Category');
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        res.json(vendor);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

/**
 * Get vendor total views and analytics
 */
exports.getVendorTotalViews = async (req, res) => {
    const { vendorId } = req.params;
    const mongoose = require('mongoose');
    const productdata = require('../models/vendorproudctdetails');
    const vieworder = require('../models/productorders');

    try {
        const products = await productdata.find({ Vendor: vendorId });
        const totalViews = products.reduce((sum, p) => sum + (p.productview || 0), 0);
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
        const totalOrders = await vieworder.countDocuments({
            vendorid: vendorId,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });
        const result = await vieworder.aggregate([
            {
                $match: {
                    vendorid: new mongoose.Types.ObjectId(vendorId),
                    orderedAt: { $gte: startOfMonth, $lte: endOfMonth },
                    paymentStatus: 'Paid'
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalPrice' }
                }
            }
        ]);

        const totalRevenue = result.length > 0 ? result[0].totalRevenue : 0;
        res.status(200).json({
            success: true,
            vendorId,
            totalViews,
            totalOrders: totalOrders,
            totalRevenue: totalRevenue
        });
    } catch (err) {
        console.error('Error calculating total views:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while calculating total views',
        });
    }
};

/**
 * Get vendor price
 */
exports.getVendorPrice = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const vendor = await Vendor.findById(vendorId);

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        res.status(200).json({ vendorPrice: vendor.Charge_Per_Hour_or_Day });
    } catch (err) {
        console.error('Error fetching vendor price:', err);
        res.status(500).json({ error: 'Failed to fetch vendor price' });
    }
};

/**
 * Get vendor analytics
 */
exports.getVendorAnalytics = async (req, res) => {
    const vendorId = req.params.id;

    try {
        const allJobs = await booking_service.find({ Vendorid: vendorId });
        const total = allJobs.length;
        const accepted = allJobs.filter(j => j.status !== 'Pending').length;
        const completed = allJobs.filter(j => j.status === 'Completed').length;

        const acceptanceRate = total ? (accepted / total) * 100 : 0;
        const completionRate = accepted ? (completed / accepted) * 100 : 0;

        const responseTimes = allJobs
            .filter(j => j.acceptedAt && j.createdAt)
            .map(j => new Date(j.acceptedAt) - new Date(j.createdAt));
        const avgResponseTime = responseTimes.length
            ? Math.round(responseTimes.reduce((a, b) => a + b) / responseTimes.length / 1000 / 60)
            : 0;

        const ratings = allJobs.filter(j => j.rating).map(j => j.rating);
        const avgRating = ratings.length
            ? (ratings.reduce((a, b) => a + b) / ratings.length).toFixed(1)
            : 0;

        const now = new Date();
        const thisMonth = now.getMonth();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const thisMonthEarnings = allJobs
            .filter(j => new Date(j.createdAt).getMonth() === thisMonth)
            .reduce((a, j) => a + (j.totalAmount || 0), 0);
        const lastMonthEarnings = allJobs
            .filter(j => new Date(j.createdAt).getMonth() === lastMonth)
            .reduce((a, j) => a + (j.totalAmount || 0), 0);

        const earningsGrowth =
            lastMonthEarnings === 0
                ? 100
                : ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100;

        res.json({
            acceptanceRate,
            completionRate,
            avgResponseTime,
            avgRating,
            earningsGrowth,
            totalJobs: total,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error calculating analytics' });
    }
};

/**
 * Register new vendor
 */
exports.registerVendor = async (req, res) => {
    try {
        const {
            Business_Name,
            Owner_name,
            Email_address,
            Phone_number,
            Business_address,
            Category,
            Sub_Category,
            Tax_ID,
            Password,
            Latitude,
            Longitude,
            ID_Type,
            Account_Number,
            IFSC_Code,
            Charge_Type,
            Charge_Per_Hour_or_Day,
            description,
            isGoogleSignup
        } = req.body;

        const [existingVendor, existingTempVendor] = await Promise.all([
            Vendor.findOne({ Email_address }),
            TempVendor.findOne({ Email_address }),
        ]);

        if (existingVendor || existingTempVendor) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        let hashedPassword = null;
        if (!isGoogleSignup && Password) {
            hashedPassword = await bcrypt.hash(Password, 10);
        }

        const ProductUrls =
            req.files['productImages']?.map((file) => file.path) || [];
        const Profile_Image = req.files['profileImage']?.[0]?.path || '';

        // SERVER-SIDE ROLE ASSIGNMENT (cannot be manipulated by frontend)
        // Determine vendor role based on Category/selectedTab
        let vendorRole = 'Technical'; // Default
        if (req.body.selectedTab === 'product' || Category === 'Non-Technical' || Category === 'Product') {
            vendorRole = 'product'; // Product vendor role
        }

        const vendor = new TempVendor({
            Business_Name,
            Owner_name,
            Email_address,
            Phone_number,
            Business_address,
            Category: vendorRole === 'product' ? 'Non-Technical' : Category, // Normalize category
            Sub_Category: Array.isArray(Sub_Category)
                ? Sub_Category
                : [Sub_Category],
            Tax_ID,
            Password: hashedPassword,
            Latitude,
            Longitude,
            ProductUrls,
            Profile_Image,
            ID_Type,
            Account_Number,
            IFSC_Code,
            Charge_Type,
            Charge_Per_Hour_or_Day,
            description,
            isGoogleSignup: isGoogleSignup || false,
            role: vendorRole, // NEW: Explicit role field
        });

        await vendor.save();

        try {
            const subject = 'Thanks For Register';
            const htmlContents = `<!DOCTYPE html>
<html>
  <head><meta charset="UTF-8"><title>Welcome to Apna Mestri</title></head>
  <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
      <h2 style="color: #333;">Welcome to Apna Mestri!</h2>
      <p style="font-size: 16px; color: #555;">
        Hello ${Owner_name},<br><br>
        Thank you for registering with <strong>Apna Mestri</strong>.  
        Your account has been successfully created.
      </p>
      <p style="font-size: 16px; color: #555;">
        You can now log in and start adding your services/products.
      </p>
      <div style="margin: 20px 0;">
        <a href="https://apna-mestri-vendor.vercel.app/login" 
           style="background-color: #007bff; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 5px;">
           Go to Vendor Login
        </a>
      </div>
      <p style="font-size: 14px; color: #777;">
        If you have any questions, feel free to reach out to our support team.<br><br>
        – The Apna Mestri Team
      </p>
    </div>
  </body>
</html>`;
            await sendEmail(Email_address, Owner_name, htmlContents, subject);
        } catch (mailErr) {
            console.error('Email sending failed:', mailErr);
        }

        res.json({ success: true, message: 'Registration successful' });
    } catch (err) {
        console.error('Error during registration:', err);

        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const validationErrors = {};
            const missingFields = [];

            for (const field in err.errors) {
                validationErrors[field] = err.errors[field].message;

                // Build user-friendly field names
                const fieldNames = {
                    'Email_address': 'Email Address',
                    'Phone_number': 'Phone Number',
                    'Owner_name': 'Owner Name',
                    'Business_Name': 'Business Name',
                    'Business_address': 'Business Address',
                    'Password': 'Password',
                    'Category': 'Category'
                };
                missingFields.push(fieldNames[field] || field);
            }

            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: `Please provide: ${missingFields.join(', ')}`,
                details: validationErrors
            });
        }

        // Handle duplicate key error
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            const fieldNames = {
                'Email_address': 'Email',
                'Phone_number': 'Phone number',
                'Business_Name': 'Business name'
            };
            return res.status(409).json({
                success: false,
                code: 'DUPLICATE_ENTRY',
                message: `${fieldNames[field] || field} is already registered`,
                details: { field }
            });
        }

        res.status(500).json({
            success: false,
            code: 'SERVER_ERROR',
            message: 'Registration failed. Please try again later.',
            details: {}
        });
    }
};

/**
 * Add vendor directly (admin function)
 */
exports.addVendor = async (req, res) => {
    try {
        const {
            Business_Name,
            Owner_name,
            Email_address,
            Phone_number,
            Business_address,
            Category,
            Sub_Category,
            Tax_ID,
            Password,
            Latitude,
            Longitude,
            ProductUrl,
        } = req.body;

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(Password, saltRounds);

        const vendors = {
            Business_Name,
            Owner_name,
            Email_address,
            Phone_number,
            Business_address,
            Category,
            Sub_Category,
            Tax_ID,
            Password: hashedPassword,
            Latitude,
            Longitude,
            ProductUrl,
        };

        const data = await Vendor.create(vendors);
        console.log('Vendor added:', data);
        res.status(200).json({ message: 'Vendor added successfully', data });
    } catch (err) {
        console.error('Error adding vendor:', err);
        res.status(500).json({ error: 'Failed to add vendor', details: err.message });
    }
};

/**
 * Approve vendor and move from temp to main collection
 */
exports.approveVendor = async (req, res) => {
    const id = req.params.id;

    try {
        const vendor = await TempVendor.findById(id);
        if (!vendor) {
            return res.status(404).json({ error: 'Vendor not found in temporary collection' });
        }

        const newVendorData = {
            Business_Name: vendor.Business_Name,
            Owner_name: vendor.Owner_name,
            Email_address: vendor.Email_address,
            Phone_number: vendor.Phone_number,
            Business_address: vendor.Business_address,
            Category: vendor.Category,
            Sub_Category: Array.isArray(vendor.Sub_Category)
                ? vendor.Sub_Category
                : vendor.Sub_Category
                    ? [vendor.Sub_Category]
                    : [],
            Tax_ID: vendor.Tax_ID,
            Password: vendor.Password,
            ID_Type: vendor.ID_Type,
            ProductUrls: Array.isArray(vendor.ProductUrls)
                ? vendor.ProductUrls
                : vendor.ProductUrls
                    ? [vendor.ProductUrls]
                    : [],
            Profile_Image: vendor.Profile_Image || '',
            Latitude: vendor.Latitude,
            Longitude: vendor.Longitude,
            registrationDate: vendor.registrationDate || new Date(),
            Account_Number: vendor.Account_Number || '',
            IFSC_Code: vendor.IFSC_Code || '',
            Charge_Per_Hour_or_Day: vendor.Charge_Per_Hour_or_Day || '',
            Charge_Type: vendor.Charge_Type || '',
            description: vendor.description,
            role: vendor.role || (vendor.Category === 'Non-Technical' ? 'product' : 'Technical') // Preserve or set role
        };

        const finalVendor = new Vendor(newVendorData);
        await finalVendor.save();

        await TempVendor.findByIdAndDelete(id);

        res.json({ message: 'Vendor approved and moved successfully', vendor: finalVendor });
    } catch (err) {
        console.error('Error posting vendor:', err);
        res.status(500).json({ error: 'Server error while posting vendor' });
    }
};

/**
 * Check if temp vendor exists
 */
exports.checkTempVendor = async (req, res) => {
    const { Email_address } = req.body;
    try {
        const found = await TempVendor.findOne({ Email_address });
        return res.json({ found: !!found });
    } catch (err) {
        console.error('TempVendor check error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Update vendor details
 */
exports.updateVendorDetails = async (req, res) => {
    try {
        const userid = req.params.id;

        // Verify vendor can only update their own details
        if (req.user && req.user.id !== userid && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
        }

        const cloudinary = require('../config/cloudinary');

        let {
            Business_Name,
            Owner_name,
            Email_address,
            Phone_number,
            Business_address,
            Category,
            Sub_Category,
            Tax_ID,
            Password,
            Latitude,
            Longitude,
            ID_Type,
            Account_Number,
            IFSC_Code,
            Charge_Type,
            Charge_Per_Hour_or_Day,
            description,
            isGoogleSignup
        } = req.body;

        let ProductUrls = [];
        let Profile_Image = '';

        if (req.files && req.files['productImages']) {
            for (const file of req.files['productImages']) {
                const result = await cloudinary.uploader.upload_stream(
                    { resource_type: 'image' },
                    (error, result) => {
                        if (result && result.secure_url) {
                            ProductUrls.push(result.secure_url);
                        }
                    }
                ).end(file.buffer);
            }
        }

        if (req.files && req.files['profileImage'] && req.files['profileImage'][0]) {
            const file = req.files['profileImage'][0];
            await cloudinary.uploader.upload_stream(
                { resource_type: 'image' },
                (error, result) => {
                    if (result && result.secure_url) {
                        Profile_Image = result.secure_url;
                    }
                }
            ).end(file.buffer);
        }

        let hashedPassword = undefined;
        if (Password) {
            const saltRounds = 10;
            hashedPassword = await bcrypt.hash(Password, saltRounds);
        }

        if (Sub_Category && typeof Sub_Category === 'string') {
            Sub_Category = Sub_Category.split(',').map(s => s.trim());
        }

        const updatedFields = {
            Business_Name,
            Owner_name,
            Email_address,
            Phone_number,
            Business_address,
            Category,
            Sub_Category,
            Tax_ID,
            Latitude,
            Longitude,
            ID_Type,
            Account_Number,
            IFSC_Code,
            Charge_Type,
            Charge_Per_Hour_or_Day,
            description,
            ProductUrls,
            Profile_Image,
            isGoogleSignup
        };
        if (hashedPassword) updatedFields.Password = hashedPassword;

        Object.keys(updatedFields).forEach(
            key => updatedFields[key] === undefined && delete updatedFields[key]
        );

        const updatedVendor = await Vendor.findByIdAndUpdate(
            userid,
            updatedFields,
            { new: true }
        );

        res.status(200).json({ message: 'User updated', data: updatedVendor });
    } catch (err) {
        console.error('Update failed:', err);
        res.status(500).json({ message: 'Update failed', error: err });
    }
};
