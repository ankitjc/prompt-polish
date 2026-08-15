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
            Analyze the image and identify its main conversation topic.
            
            Generate 3–5 short, natural, easy-to-say sentences that a person could use in everyday conversation about that topic.
            
            Rules:
            - Write from the speaker's perspective when appropriate ("I", "me", "my", "we").
            - Treat the image as a TOPIC, not as a specific situation involving the speaker.
            - Generate GENERAL, REUSABLE phrases rather than image-specific statements.
            - Include a mix of useful conversational intents: preferences, opinions, requests, questions, habits, and related experiences.
            - Do not assume the speaker owns, wants, needs, likes, dislikes, uses, purchased, or plans to purchase anything in the image.
            - Do not invent personal circumstances, emotions, memories, relationships, plans, or intentions.
            - Avoid sentences that depend on details that cannot be known from the image.
            - Questions are encouraged when they would be useful in conversation.
            - Keep sentences short, natural, concrete, and easy to understand.
            - Never describe the image itself (e.g. "There is a...", "The picture shows...", "They are...").
            - Return only the sentences, one per line. No numbering or explanations.
            
            Example:
            For headphones, prefer:
            "I like listening to music using headphones."
            "Do you have any headphones?"
            "Have you seen my headphones?"
            "I use headphones when I listen to music."
            
            Avoid:
            "I need new headphones for work."
            "I might buy these tomorrow."
            "I hope these help me focus."
            
            The first group is general and reusable; the second group incorrectly assumes the speaker's situation.
            
            Generate the most useful general-purpose conversational phrases for the topic.
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