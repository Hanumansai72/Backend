const Vendor = require('../models/admin');
const { generateDescription } = require('../services/aiService');

/**
 * Get services by category
 */
exports.getServicesByCategory = async (req, res) => {
    const { category } = req.query;

    if (!category) {
        return res.status(400).json({ message: 'Missing category parameter' });
    }

    try {
        const services = await Vendor.find({
            Sub_Category: { $in: [new RegExp(category.trim(), 'i')] }
        });

        res.json({
            services,
            description: `Find skilled ${category} professionals across India.`,
            tags: [category, 'services', 'all']
        });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Generate AI content for product description
 */
exports.generateContent = async (req, res) => {
    const { category, subCategory } = req.body;

    try {
        const resultText = await generateDescription(category, subCategory);

        const descriptionMatch = resultText.match(/Product Description:\s*(.*?)\s*ProductTags:/s);
        const tagsMatch = resultText.match(/ProductTags:\s*(.*)/s);
        console.log('sai:', descriptionMatch);
        const description = descriptionMatch ? descriptionMatch[1].trim() : '';
        const tags = tagsMatch ? tagsMatch[1].trim() : '';

        res.json({
            content: {
                des: description,
                tag: tags,
            },
        });
    } catch (error) {
        console.error('API error:', error.message || error.response?.data);
        res.status(500).json({ error: 'Failed to generate content' });
    }
};
