import { openai } from "../lib/openai.js";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { keywords, tone, simplicity } = req.body;

    try {
        const prompt = `Generate a complete, meaningful sentence from these keywords: "${keywords}". 
Tone: ${tone}. 
Language complexity: ${simplicity}.
If the keywords contains only abbreviations or internet slang, just expand them.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-nano",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 60,
        });

        const sentence = completion.choices?.[0]?.message?.content?.trim() || "";

        res.status(200).json({ sentence });

    } catch (err) {
        console.error(err);
        res.status(500).json({ sentence: "Something went wrong." });
    }
}