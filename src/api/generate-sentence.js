import OpenAI from "openai";
import config from "../config.js";

const openai = new OpenAI({
    apiKey: config.openaiApiKey,
});

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { keywords, tone, simplicity } = req.body;

        const prompt = `Generate a complete, meaningful sentence from these keywords: "${keywords}".
            Tone: ${tone}.
            Language complexity: ${simplicity}.
            If the keywords contain only abbreviations or internet slang, just expand them.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4.1-nano",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 60,
        });

        res.status(200).json({
            sentence: response.choices[0].message.content.trim(),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate sentence" });
    }
}