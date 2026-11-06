import { openai } from "../lib/openai.js";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { image } = req.body;

    if (!image) {
        return res.status(400).json({
            sentences: [],
            error: "Image is required."
        });
    }

    try {
        const prompt = `
        Analyze the image and identify its main communication topic.

            Generate 3–5 short, simple, natural sentences that a person with aphasia could use in everyday conversation about that topic.

            Prioritize FUNCTIONAL COMMUNICATION over describing the image.

            Rules:
        - Keep sentences very short, concrete, and easy to say.
        - Use common, everyday words and simple grammar.
        - Focus on useful communication: requests, wants, needs, choices, preferences, questions, comments, and refusals.
        - Prefer phrases such as "I want...", "Can I have...?", "Can you...?", "Do you...?", "Where is...?", "What is...?", "I like...", and "I don't want...".
        - Generate phrases the person could choose to say; do not assume these are true about the person.
        - Do not invent personal circumstances, memories, emotions, plans, or relationships.
        - Do not describe the image itself.
        - Do not mention the picture, photo, or visual details.
        - Avoid long, abstract, or situation-specific sentences.

            Example:
        For a coffee cup:
            Can I have some coffee?
            Can I have some tea?
            I want some coffee.
            Do you want coffee?
            I like coffee.

            Return only the sentences, one per line. No numbering or explanations.
            `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-nano",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: image,
                                detail: "auto"
                            }
                        }
                    ]
                }
            ],
            max_tokens: 150,
        });

        const text =
            completion.choices?.[0]?.message?.content?.trim() || "";

        const sentences = text
            .split(/\n+/)
            .map(s => s.replace(/^\s*[-•\d.)]+\s*/, "").trim())
            .filter(Boolean);

        res.status(200).json({ sentences });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            sentences: [],
            error: "Something went wrong."
        });
    }
}