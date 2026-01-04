const vieworder = require('../models/productorders');

/**
 * Get pending orders for vendor
 */
exports.getPendingOrders = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const vendorId = req.params.id;

        // Verify vendor can only access their own orders
        if (req.user && req.user.id !== vendorId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. You can only view your own orders.' });
        }

        const query = {
            vendorid: vendorId,
            orderStatus: { $in: ['Pending', 'Processing'] }
        };

        if (search) {
            query.$or = [
                { customerName: { $regex: search, $options: 'i' } },
                { productName: { $regex: search, $options: 'i' } },
            ];
        }

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;

        const orders = await vieworder.find(query)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        const total = await vieworder.countDocuments(query);

        res.status(200).json({ orders, total, page: pageNum, limit: limitNum });
    } catch (err) {
        console.error('Error fetching pending orders:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Get all orders for vendor with pagination
 */
exports.getVendorOrders = async (req, res) => {
    try {
        const id = req.params.id;

        // Verify vendor can only access their own orders
        if (req.user && req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. You can only view your own orders.' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await vieworder.countDocuments({ vendorid: id });
        const all = await vieworder.find({ vendorid: id })
            .sort({ orderedAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({ total, all });
    } catch (err) {
        console.error('Error fetching paginated orders:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Get order details for customer
 */
exports.getCustomerOrders = async (req, res) => {
    try {
        const id = req.params.id;

        // Verify customer can only access their own orders
        if (req.user && req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. You can only view your own orders.' });
        }

        const ordercustomer = await vieworder.find({ customerId: id });
        res.json(ordercustomer);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Get recent orders (last 7 days)
 */
exports.getRecentOrders = async (req, res) => {
    try {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        const result = await vieworder.find({ orderedAt: { $gte: date } });
        res.json(result);
    } catch (err) {
        console.log(err);
    }
};

/**
 * Create cart orders
 */
exports.createCartOrders = async (req, res) => {
    try {
        const { orders } = req.body;
        if (!Array.isArray(orders)) return res.status(400).json({ error: 'Orders must be an array.' });

        const created = await vieworder.insertMany(orders);
        res.status(201).json(created);
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Cancel order
 */
exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const updateCancel = await vieworder.findByIdAndUpdate(
            id,
            { orderStatus: 'Cancelled' },
            { new: true }
        );

        if (!updateCancel) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({
            message: 'Order status updated to Cancelled',
            order: updateCancel,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Update order status
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        const updatedOrder = await vieworder.findByIdAndUpdate(
            id,
            { orderStatus },
            { new: true }
        );

        res.status(200).json({ message: 'Order status updated', updatedOrder });
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
