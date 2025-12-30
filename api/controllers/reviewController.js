const revieworder = require('../models/reviewvendor');

/**
 * Get reviews for a product
 */
exports.getProductReviews = async (req, res) => {
    try {
        const rid = req.params.rid;
        const getreview = await revieworder.find({ productId: rid });
        res.json({ getreview });
    } catch (err) {
        res.json({ err });
    }
};

/**
 * Get reviews for a service/vendor
 */
exports.getServiceReviews = async (req, res) => {
    try {
        const rid = req.params.rid;
        const getreview = await revieworder.find({ vendorids: rid });
        res.json({ getreview });
    } catch (err) {
        res.json({ err });
    }
};

/**
 * Post a review
 */
exports.postReview = async (req, res) => {
    try {
        const vid = req.params.vid;

        const {
            productId,
            customerName,
            vendorids,
            rating,
            comment
        } = req.body;

        const revieorders = new revieworder({
            productId,
            vid,
            customerName,
            rating,
            vendorids,
            comment
        });

        const savingreview = await revieorders.save();
        res.status(201).json({
            message: 'Review uploaded successfully',
            review: savingreview
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
};
