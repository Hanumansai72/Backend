const Wallet = require('../models/wallet');
const productwallet = require('../models/productwallet');
const booking_service = require('../models/servicebooking');
const vieworder = require('../models/productorders');
const { addTransaction, addProductTransaction } = require('../services/walletService');

/**
 * Get vendor wallet (for service bookings)
 */
exports.getVendorWallet = async (req, res) => {
    try {
        const { vendorId } = req.params;

        let wallet = await Wallet.findOne({ vendorId });
        if (!wallet) {
            wallet = new Wallet({ vendorId, balance: 0, commissionDue: 0, transactions: [] });
            await wallet.save();
        }

        const completedBookings = await booking_service.find({
            Vendorid: vendorId,
            status: 'Completed',
        });

        for (const booking of completedBookings) {
            const alreadyExists = wallet.transactions.some(
                (txn) => txn.orderId.toString() === booking._id.toString()
            );

            if (!alreadyExists) {
                wallet = await addTransaction(
                    vendorId,
                    booking._id,
                    booking.totalAmount
                );
            }
        }

        res.json(wallet);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get product wallet for vendor
 */
exports.getProductWallet = async (req, res) => {
    try {
        const { vendorid } = req.params;

        let wallet = await Wallet.findOne({ vendorId: vendorid });
        if (!wallet) {
            wallet = new productwallet({
                vendorid,
                balance: 0,
                commissionDue: 0,
                transactions: []
            });
            await wallet.save();
        }

        const completedOrders = await vieworder.find({
            vendorid,
            orderStatus: 'Delivered',
            paymentStatus: 'Paid'
        });

        for (const order of completedOrders) {
            const exists = wallet.transactions.some(
                txn => txn.orderId.toString() === order._id.toString()
            );

            if (!exists) {
                wallet = await addProductTransaction(
                    vendorid,
                    order._id,
                    order.totalPrice
                );
            }
        }

        res.json(wallet);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
