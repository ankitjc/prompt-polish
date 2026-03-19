import {openai} from "../lib/openai.js";
import {put} from "@vercel/blob";
import {v4 as uuidv4} from "uuid";
import {createClient} from "@supabase/supabase-js";

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

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { word } = req.body;
    if (!word || !word.trim())
        return res.status(400).json({ error: "Word is required" });

    try {
        // STEP 0: Compute embedding for search term
        let searchEmbedding = null;
        try {
            const embRes = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: word,
            });
            searchEmbedding = embRes.data[0].embedding;
        } catch (err) {
            console.warn("Embedding generation failed for search term:", err.message);
        }

        // STEP 1: Semantic search for existing cards
        let cachedCards = [];
        if (searchEmbedding) {
            const { data, error } = await supabase
                .rpc("match_phrases", {
                    query_vector: searchEmbedding,
                    match_limit: 6,
                    match_threshold: 0.3
                });

            if (error) console.error("Supabase vector search error:", error);
            else cachedCards = data || [];
        }

        console.log(cachedCards.map(c => ({
            phrase: c.phrase,
            similarity: c.similarity
        })));

        // Return cached cards if enough
        if (cachedCards.length === 6) {
            console.log(" \n ---- Returning cached cards for:", word);
            return res.status(200).json(
                cachedCards.map((c) => ({ text: c.phrase, image: c.image_url }))
            );
        }

        // STEP 2: Generate missing phrases
        const missingCount = 6 - cachedCards.length;

        const prompt = `
          Generate ${missingCount} short phrases someone might say when dealing with "${word}".
          Each phrase under 5 words.
          Return JSON array ONLY.
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-nano",
            messages: [{ role: "user", content: prompt }],
        });

        const raw = completion.choices[0].message.content;
        const phrases = safeParseGPTArray(raw);

        console.log(phrases);

        // STEP 3: Generate images and embeddings, insert into Supabase
        const newCards = await Promise.all(
            phrases.map(async (phrase) => {
                let imageUrl = "/images/placeholder.png";
                let embedding = null;

                // Generate embedding for the phrase
                try {
                    const embRes = await openai.embeddings.create({
                        model: "text-embedding-3-small",
                        input: phrase,
                    });
                    embedding = embRes.data[0].embedding;
                } catch (err) {
                    console.warn("Embedding generation failed for phrase:", err.message);
                }

                console.log(`generating image for '${phrase}'...`);
                // Generate image
                try {
                    const image = await openai.images.generate({
                        model: "gpt-image-1-mini",
                        prompt: `Simple icon style illustration for communication card: ${phrase}`,
                        size: "1024x1024",
                    });

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

                console.log("saving image to supabase...");
                // Insert into Supabase
                try {
                    const { error: insertError } = await supabase.from("cards").insert([
                        {
                            search_term: word,
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
            })
        );

        // STEP 4: Return cached + newly generated cards
        const allCards = [...cachedCards.map(c => ({ text: c.phrase, image: c.image_url })), ...newCards];

        res.status(200).json(allCards.slice(0, 6));
    } catch (err) {
        console.error("Card generation failed:", err);
        res.status(500).json([{ text: "Error generating cards", image: "/images/placeholder.png" }]);
    }
}