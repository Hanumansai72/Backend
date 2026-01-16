const vieworder = require('../models/productorders');
const ErrorResponse = require('../utils/errorResponse');
const { ERROR_CODES } = require('../utils/errorCodes');

/**
 * Get pending orders for vendor
 */
exports.getPendingOrders = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const vendorId = req.params.id;

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

        res.status(200).json({ success: true, orders, total, page: pageNum, limit: limitNum });
    } catch (err) {
        console.error('Error fetching pending orders:', err);
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to fetch pending orders',
                { error: err.message },
                500
            ).toJSON()
        );
    }
};

/**
 * Get all orders for vendor with pagination
 */
exports.getVendorOrders = async (req, res) => {
    try {
        const id = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await vieworder.countDocuments({ vendorid: id });
        const orders = await vieworder.find({ vendorid: id })
            .sort({ orderedAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({ success: true, total, orders, page, limit });
    } catch (err) {
        console.error('Error fetching paginated orders:', err);
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to fetch vendor orders',
                { error: err.message },
                500
            ).toJSON()
        );
    }
};

/**
 * Get order details for customer
 */
exports.getCustomerOrders = async (req, res) => {
    try {
        const id = req.params.id;
        const orders = await vieworder.find({ customerId: id });
        res.json({ success: true, orders, count: orders.length });
    } catch (err) {
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to fetch customer orders',
                { error: err.message },
                500
            ).toJSON()
        );
    }
};

/**
 * Get recent orders (last 7 days)
 */
exports.getRecentOrders = async (req, res) => {
    try {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        const orders = await vieworder.find({ orderedAt: { $gte: date } });
        res.json({ success: true, orders, count: orders.length });
    } catch (err) {
        console.error('Error fetching recent orders:', err);
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to fetch recent orders',
                { error: err.message },
                500
            ).toJSON()
        );
    }
};

/**
 * Create cart orders
 */
exports.createCartOrders = async (req, res) => {
    try {
        const { orders } = req.body;
        if (!Array.isArray(orders)) {
            return res.status(400).json(
                new ErrorResponse(
                    ERROR_CODES.VALIDATION_ERROR,
                    'Orders must be an array',
                    { field: 'orders' },
                    400
                ).toJSON()
            );
        }

        const created = await vieworder.insertMany(orders);
        res.status(201).json({ success: true, message: 'Orders created', orders: created });
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to create orders',
                { error: err.message },
                500
            ).toJSON()
        );
    }
};

/**
 * Cancel order
 */
exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await vieworder.findById(id);
        if (!order) {
            return res.status(404).json(
                new ErrorResponse(
                    ERROR_CODES.RESOURCE_NOT_FOUND,
                    'Order not found',
                    { orderId: id },
                    404
                ).toJSON()
            );
        }

        if (req.user.role !== 'admin' && order.customerId?.toString() !== req.user.id) {
            return res.status(403).json(
                new ErrorResponse(
                    ERROR_CODES.FORBIDDEN,
                    'Access denied. You can only cancel your own orders',
                    {},
                    403
                ).toJSON()
            );
        }

        const updateCancel = await vieworder.findByIdAndUpdate(
            id,
            { orderStatus: 'Cancelled' },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            order: updateCancel,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to cancel order',
                { error: err.message },
                500
            ).toJSON()
        );
    }
};

/**
 * Update order status
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        if (!orderStatus) {
            return res.status(400).json(
                new ErrorResponse(
                    ERROR_CODES.VALIDATION_ERROR,
                    'Order status is required',
                    { field: 'orderStatus' },
                    400
                ).toJSON()
            );
        }

        const updatedOrder = await vieworder.findByIdAndUpdate(
            id,
            { orderStatus },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json(
                new ErrorResponse(
                    ERROR_CODES.RESOURCE_NOT_FOUND,
                    'Order not found',
                    { orderId: id },
                    404
                ).toJSON()
            );
        }

        res.status(200).json({ success: true, message: 'Order status updated', order: updatedOrder });
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to update order status',
                { error: err.message },
                500
            ).toJSON()
        );
    }
};
