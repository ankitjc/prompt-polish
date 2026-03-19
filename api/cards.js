import { openai } from "../lib/openai.js";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).end();
    }

    const { word } = req.body;

    try {

        // STEP 1: Generate phrases (generateCards logic)

        const prompt = `
        Generate 6 short phrases someone might say when dealing with "${word}".
        Each phrase under 5 words.
        Return JSON array.
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-nano",
            messages: [{ role: "user", content: prompt }]
        });

        const phrases = JSON.parse(
            completion.choices[0].message.content
        );

        // STEP 2: Generate images (generateImage logic)

        const cards = await Promise.all(
            phrases.map(async (phrase) => {

                const image = await openai.images.generate({
                    model: "gpt-image-1",
                    prompt: `Simple icon style illustration for communication card: ${phrase}`,
                    size: "256x256"
                });

                const base64 = image.data[0].b64_json;
                // eslint-disable-next-line no-undef
                const buffer = Buffer.from(base64, "base64");

                const filename = `${uuidv4()}.png`;

                // Save image to Vercel Blob
                const blob = await put(filename, buffer, {
                    access: "public"
                });

                return {
                    text: phrase,
                    image: blob.url
                };
            })
        );

        res.json(cards);

    } catch (err) {

        console.error(err);

        res.status(500).json([
            {
                text: "Error generating cards",
                image: "/images/placeholder.png"
            }
        ]);
    }
}