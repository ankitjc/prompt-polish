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
            model: "gpt-5-nano",
            messages: [{ role: "user", content: prompt }],
            max_completion_tokens: 1000
        });

        const sentence = completion.choices?.[0]?.message?.content?.trim() || "";

        res.status(200).json({ sentence });

    } catch (error) {
        console.error("========== OPENAI ERROR ==========");
        console.error("Message:", error.message);
        console.error("Status:", error.status);
        console.error("Code:", error.code);
        console.error("Type:", error.type);
        console.error("===================================");

        res.status(500).json({ sentence: "Something went wrong." });
    }
}