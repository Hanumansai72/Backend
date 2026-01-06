const Vendor = require('../models/admin');
const TempVendor = require('../models/vendor-register');
const UserProfile = require('../models/main_userprofile');
const Order = require('../models/productorders');
const Booking = require('../models/servicebooking');
const Review = require('../models/reviewvendor');
const Wallet = require('../models/wallet');
const { sendEmail } = require('../services/emailService');

// ==================== VENDOR MANAGEMENT ====================

// Get all vendors with filters
const getAllVendorsAdmin = async (req, res) => {
    try {
        const { status, category, kycStatus, search, page = 1, limit = 20 } = req.query;

        let query = {};

        if (status) query.status = status;
        if (category) query.Category = category;
        if (kycStatus) query.kycStatus = kycStatus;
        if (search) {
            query.$or = [
                { Business_Name: { $regex: search, $options: 'i' } },
                { Owner_name: { $regex: search, $options: 'i' } },
                { Email_address: { $regex: search, $options: 'i' } },
                { Phone_number: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [vendors, total] = await Promise.all([
            Vendor.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-Password'),
            Vendor.countDocuments(query)
        ]);

        res.json({
            vendors,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ message: 'Failed to fetch vendors' });
    }
};

// Get vendor details with performance metrics
const getVendorDetailsAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const vendor = await Vendor.findById(id).select('-Password');
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Get performance metrics
        const [orders, bookings, reviews] = await Promise.all([
            Order.find({ vendorId: id }),
            Booking.find({ vendorId: id }),
            Review.find({ vendorId: id })
        ]);

        const completedJobs = bookings.filter(b => b.status === 'completed').length;
        const totalOrders = orders.length;
        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
            : 0;
        const complaintsCount = reviews.filter(r => r.isComplaint).length;

        res.json({
            vendor,
            performance: {
                completedJobs,
                totalOrders,
                totalBookings: bookings.length,
                avgRating: parseFloat(avgRating),
                reviewCount: reviews.length,
                complaintsCount,
                totalViews: vendor.Views || 0
            }
        });
    } catch (error) {
        console.error('Error fetching vendor details:', error);
        res.status(500).json({ message: 'Failed to fetch vendor details' });
    }
};

// Update vendor status (approve/reject/suspend/ban)
const updateVendorStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        const validStatuses = ['active', 'suspended', 'banned'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const vendor = await Vendor.findByIdAndUpdate(
            id,
            { status, statusReason: reason, statusUpdatedAt: new Date() },
            { new: true }
        ).select('-Password');

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Send email notification
        try {
            await sendEmail({
                to: vendor.Email_address,
                subject: `Account Status Update - Apna Mestri`,
                text: `Your vendor account status has been updated to: ${status}. ${reason ? `Reason: ${reason}` : ''}`
            });
        } catch (emailError) {
            console.log('Email notification failed:', emailError.message);
        }

        res.json({ message: 'Vendor status updated', vendor });
    } catch (error) {
        console.error('Error updating vendor status:', error);
        res.status(500).json({ message: 'Failed to update vendor status' });
    }
};

// Update vendor KYC status
const updateVendorKYC = async (req, res) => {
    try {
        const { id } = req.params;
        const { kycStatus, rejectionReason } = req.body;

        const validStatuses = ['pending', 'verified', 'rejected'];
        if (!validStatuses.includes(kycStatus)) {
            return res.status(400).json({ message: 'Invalid KYC status' });
        }

        const updateData = {
            kycStatus,
            kycUpdatedAt: new Date()
        };

        if (kycStatus === 'rejected') {
            updateData.kycRejectionReason = rejectionReason;
        }

        if (kycStatus === 'verified') {
            updateData.status = 'active';
        }

        const vendor = await Vendor.findByIdAndUpdate(id, updateData, { new: true }).select('-Password');

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Send email notification
        try {
            const statusMsg = kycStatus === 'verified'
                ? 'Your KYC verification has been approved!'
                : `Your KYC verification was rejected. Reason: ${rejectionReason}`;

            await sendEmail({
                to: vendor.Email_address,
                subject: `KYC Verification Update - Apna Mestri`,
                text: statusMsg
            });
        } catch (emailError) {
            console.log('Email notification failed:', emailError.message);
        }

        res.json({ message: 'KYC status updated', vendor });
    } catch (error) {
        console.error('Error updating KYC status:', error);
        res.status(500).json({ message: 'Failed to update KYC status' });
    }
};

// Edit vendor details (admin override)
const updateVendorAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove sensitive fields
        delete updateData.Password;
        delete updateData._id;

        const vendor = await Vendor.findByIdAndUpdate(id, updateData, { new: true }).select('-Password');

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        res.json({ message: 'Vendor updated', vendor });
    } catch (error) {
        console.error('Error updating vendor:', error);
        res.status(500).json({ message: 'Failed to update vendor' });
    }
};

// Get pending vendor registrations
const getPendingVendors = async (req, res) => {
    try {
        const pendingVendors = await TempVendor.find().sort({ createdAt: -1 });
        res.json(pendingVendors);
    } catch (error) {
        console.error('Error fetching pending vendors:', error);
        res.status(500).json({ message: 'Failed to fetch pending vendors' });
    }
};

// ==================== CUSTOMER MANAGEMENT ====================

// Get all customers with filters
const getAllCustomers = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;

        let query = {};

        if (status) query.status = status;
        if (search) {
            query.$or = [
                { Name: { $regex: search, $options: 'i' } },
                { Email: { $regex: search, $options: 'i' } },
                { Phone: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [customers, total] = await Promise.all([
            UserProfile.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-Password'),
            UserProfile.countDocuments(query)
        ]);

        res.json({
            customers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Failed to fetch customers' });
    }
};

// Get customer details with order history
const getCustomerDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await UserProfile.findById(id).select('-Password');
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const [orders, bookings] = await Promise.all([
            Order.find({ customerId: id }).sort({ createdAt: -1 }).limit(50),
            Booking.find({ customerId: id }).sort({ createdAt: -1 }).limit(50)
        ]);

        res.json({
            customer,
            orders,
            bookings,
            stats: {
                totalOrders: orders.length,
                totalBookings: bookings.length,
                totalSpent: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0)
            }
        });
    } catch (error) {
        console.error('Error fetching customer details:', error);
        res.status(500).json({ message: 'Failed to fetch customer details' });
    }
};

// Update customer status (block/unblock)
const updateCustomerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        const validStatuses = ['active', 'blocked'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const customer = await UserProfile.findByIdAndUpdate(
            id,
            { status, blockReason: reason },
            { new: true }
        ).select('-Password');

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json({ message: 'Customer status updated', customer });
    } catch (error) {
        console.error('Error updating customer status:', error);
        res.status(500).json({ message: 'Failed to update customer status' });
    }
};

// ==================== ORDER MANAGEMENT ====================

// Get all orders with filters
const getAllOrdersAdmin = async (req, res) => {
    try {
        const { status, vendorId, customerId, page = 1, limit = 20 } = req.query;

        let query = {};

        if (status) query.orderStatus = status;
        if (vendorId) query.vendorId = vendorId;
        if (customerId) query.customerId = customerId;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [orders, total] = await Promise.all([
            Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
            Order.countDocuments(query)
        ]);

        res.json({
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
};

// Update order status manually
const updateOrderStatusAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const order = await Order.findByIdAndUpdate(
            id,
            { orderStatus: status, adminNotes: notes, updatedAt: new Date() },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order status updated', order });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: 'Failed to update order' });
    }
};

// Cancel order (admin)
const cancelOrderAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const order = await Order.findByIdAndUpdate(
            id,
            { orderStatus: 'Cancelled', cancelReason: reason, cancelledBy: 'admin', cancelledAt: new Date() },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order cancelled', order });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Failed to cancel order' });
    }
};

// ==================== ANALYTICS ====================

// Get dashboard analytics
const getDashboardAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

        const [
            totalVendors,
            activeVendors,
            pendingVendors,
            totalCustomers,
            totalOrders,
            monthlyOrders,
            totalBookings,
            recentOrders
        ] = await Promise.all([
            Vendor.countDocuments(),
            Vendor.countDocuments({ status: { $ne: 'banned' } }),
            TempVendor.countDocuments(),
            UserProfile.countDocuments(),
            Order.countDocuments(),
            Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Booking.countDocuments(),
            Order.find().sort({ createdAt: -1 }).limit(10)
        ]);

        // Category distribution
        const categoryDistribution = await Vendor.aggregate([
            { $group: { _id: '$Category', count: { $sum: 1 } } }
        ]);

        // Monthly revenue (last 6 months)
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const monthlyRevenue = await Order.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    revenue: { $sum: '$totalPrice' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            overview: {
                totalVendors,
                activeVendors,
                pendingVendors,
                totalCustomers,
                totalOrders,
                monthlyOrders,
                totalBookings
            },
            categoryDistribution,
            monthlyRevenue,
            recentOrders
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
};

// ==================== REVIEWS & COMPLAINTS ====================

// Get all reviews
const getAllReviews = async (req, res) => {
    try {
        const { vendorId, flagged, page = 1, limit = 20 } = req.query;

        let query = {};
        if (vendorId) query.vendorId = vendorId;
        if (flagged === 'true') query.isFlagged = true;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [reviews, total] = await Promise.all([
            Review.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
            Review.countDocuments(query)
        ]);

        res.json({
            reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Failed to fetch reviews' });
    }
};

// Flag/unflag review
const flagReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { isFlagged, reason } = req.body;

        const review = await Review.findByIdAndUpdate(
            id,
            { isFlagged, flagReason: reason },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        res.json({ message: 'Review updated', review });
    } catch (error) {
        console.error('Error flagging review:', error);
        res.status(500).json({ message: 'Failed to flag review' });
    }
};

// Delete review
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const review = await Review.findByIdAndDelete(id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        res.json({ message: 'Review deleted', deletionReason: reason });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Failed to delete review' });
    }
};

module.exports = {
    // Vendor
    getAllVendorsAdmin,
    getVendorDetailsAdmin,
    updateVendorStatus,
    updateVendorKYC,
    updateVendorAdmin,
    getPendingVendors,
    // Customer
    getAllCustomers,
    getCustomerDetails,
    updateCustomerStatus,
    // Orders
    getAllOrdersAdmin,
    updateOrderStatusAdmin,
    cancelOrderAdmin,
    // Analytics
    getDashboardAnalytics,
    // Reviews
    getAllReviews,
    flagReview,
    deleteReview
};
