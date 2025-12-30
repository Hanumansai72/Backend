const { OpenAI } = require('openai');

const client = new OpenAI({
    baseURL: 'https://router.huggingface.co/nebius/v1',
    apiKey: process.env.HUGGINGFACE_API_KEY,
});

/**
 * Generate product description and tags using AI
 */
async function generateDescription(category, subCategory) {
    const prompt = `Write a short product description and relevant comma-separated tags for a product in the category "${category}" and sub-category "${subCategory}". Format like this:

Product Description: <text>
ProductTags: <tag1>, <tag2>, ...`;

    const chatCompletion = await client.chat.completions.create({
        model: 'Qwen/Qwen3-32B',
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
    });

    return chatCompletion.choices[0].message.content;
}

module.exports = {
    generateDescription
};
