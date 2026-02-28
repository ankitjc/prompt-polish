import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import cors from "cors";

// LOAD ENV FIRST
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Missing");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // ✅ Must be set AFTER dotenv.config()
});

app.post("/api/generate-sentence", async (req, res) => {
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

        res.json({
            sentence: response.choices[0].message.content.trim(),
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate sentence" });
    }
});

app.listen(3001, () => {
    console.log("Backend running on http://localhost:3001");
});