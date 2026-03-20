import { openai } from "../lib/openai.js";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Safe JSON parser for GPT-generated arrays
function safeParseGPTArray(raw) {
    try {
        let clean = raw.trim().replace(/^```json\s*/, "").replace(/```$/, "");
        const match = clean.match(/\[.*\]/s);
        if (!match) return ["Sorry, something went wrong."];
        const fixed = match[0].replace(/,\s*\]/g, "]"); // fix trailing commas
        return JSON.parse(fixed);
    } catch (err) {
        console.error("JSON parse error:", err, raw);
        return ["Sorry, something went wrong."];
    }
}

// Generate embedding for a single phrase
async function getEmbedding(phrase) {
    try {
        const embRes = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: phrase,
        });
        return embRes.data[0].embedding;
    } catch (err) {
        console.warn("Embedding generation failed for phrase:", phrase, err.message);
        return null;
    }
}

// Generate image and insert card into Supabase
async function createCard(searchTerm, phrase, embedding) {
    console.log(` -- Generating image for '${phrase}'...`);
    let imageUrl = "/images/placeholder.png";

    try {
        const image = await openai.images.generate({
            model: "gpt-image-1-mini",
            prompt: `Simple icon style illustration for communication card: ${phrase}`,
            size: "1024x1024",
        });
        console.log("Saving image to blob...");
        const base64 = image.data?.[0]?.b64_json;
        if (base64) {
            const buffer = Buffer.from(base64, "base64");
            const filename = `cards/${uuidv4()}.png`;

            const { url } = await put(filename, buffer, {
                store: process.env.VERCEL_BLOB_STORE,
                access: "public",
            });

            imageUrl = url;
        }
    } catch (err) {
        console.warn(`Image generation failed for phrase "${phrase}":`, err.message);
    }

    console.log("Saving card to Supabase...");
    try {
        const { error: insertError } = await supabase.from("cards").insert([
            {
                search_term: searchTerm,
                phrase,
                image_url: imageUrl,
                embedding,
            },
        ]);
        if (insertError) console.warn("Supabase insert error:", insertError.message);
    } catch (err) {
        console.warn("Supabase insert failed:", err.message);
    }

    return { text: phrase, image: imageUrl };
}

// API Handler
export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { inputText } = req.body;
    if (!inputText || !inputText.trim())
        return res.status(400).json({ cards: [], error: "Input text is required" });

    try {
        // Step 1: Generate phrases from GPT
        const prompt = `
          Generate 6 common short phrases (max 5 words)
          that a person might say in this situation: "${inputText}".
          Keep them simple, conversational, and distinct.
          Return JSON array only.
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-nano",
            messages: [{ role: "user", content: prompt }],
        });

        const raw = completion.choices[0].message.content;
        const phrases = safeParseGPTArray(raw);

        console.log("Generated phrases:", phrases);

        // Step 2: Generate embeddings
        const embeddings = await Promise.all(phrases.map(p => getEmbedding(p)));

        // Step 3: Check matches in parallel
        const matchResults = await Promise.all(
            embeddings.map(e =>
                supabase.rpc("match_phrases", {
                    query_vector: e,
                    match_limit: 1,
                    match_threshold: 0.85,
                })
            )
        );

        // Step 4: Prepare cards (reuse or create images)
        const newCards = await Promise.all(
            phrases.map(async (phrase, i) => {
                const data = matchResults[i].data;
                if (data && data.length > 0) {
                    // reuse existing
                    console.log(`++ Reusing image for '${phrase}'...`);
                    return { text: data[0].phrase, image: data[0].image_url };
                } else {
                    // create new card (slowest step)
                    const embedding = embeddings[i];
                    return createCard(inputText, phrase, embedding);
                }
            })
        );

        return res.status(200).json({ cards: newCards.slice(0, 6) });
    } catch (err) {
        console.error("Card generation failed:", err);
        return res.status(500).json({ cards: [], error: "Failed to generate cards" });
    }
}