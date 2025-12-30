const { OpenAI } = require('openai');

const client = new OpenAI({
    baseURL: 'https://router.huggingface.co/nebius/v1',
    baseURL: 'https://router.huggingface.co/nebius/v1',
    apiKey: process.env.API_KEY_HUGGEFACE || process.env.HUGGINGFACE_API_KEY || process.env.OPENAI_API_KEY,
});
if (!process.env.API_KEY_HUGGEFACE && !process.env.HUGGINGFACE_API_KEY && !process.env.OPENAI_API_KEY) {
    console.warn("WARNING: No HuggingFace/OpenAI API key found in environment variables (API_KEY_HUGGEFACE, HUGGINGFACE_API_KEY, OPENAI_API_KEY). AI features may fail.");
}


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
