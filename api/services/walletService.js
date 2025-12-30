const Wallet = require('../models/wallet');

/**
 * Add a transaction to vendor wallet (for service bookings)
 */
async function addTransaction(vendorId, orderId, totalAmount) {
    let wallet = await Wallet.findOne({ vendorId });

    if (!wallet) {
        wallet = new Wallet({ vendorId, balance: 0, commissionDue: 0, transactions: [] });
    }

    // Calculate commission (5%)
    const commission = totalAmount * 0.05;
    const vendorEarning = totalAmount - commission;

    // Add transaction for vendor earning
    wallet.transactions.push({
        orderId,
        amount: vendorEarning,
        type: 'credit',
        commission,
        description: `Payment received for Order #${orderId}`,
    });

    // Update wallet balance and commissionDue
    wallet.balance += vendorEarning;
    wallet.commissionDue += commission;

    await wallet.save();
    return wallet;
}

/**
 * Add a product transaction to vendor wallet
 */
async function addProductTransaction(vendorid, orderId, totalAmount) {
    let wallet = await Wallet.findOne({ vendorId: vendorid });

    // If wallet doesn't exist, create it
    if (!wallet) {
        wallet = new Wallet({
            vendorId: vendorid,
            balance: 0,
            commissionDue: 0,
            transactions: []
        });
    }

    // Commission is 5%
    const commission = totalAmount * 0.05;
    const vendorEarning = totalAmount - commission;

    // Add transaction
    wallet.transactions.push({
        orderId,
        amount: vendorEarning,
        commission,
        type: 'credit',
        description: `Payment received for Order #${orderId}`
    });

    // Update balance & commissionDue
    wallet.balance += vendorEarning;
    wallet.commissionDue += commission;

    await wallet.save();
    return wallet;
}

module.exports = {
    addTransaction,
    addProductTransaction
};
