import { useState } from "react";
import {OPENAI_API_KEY} from "../config.js";
import "./Cards.css";

function Cards() {
    const [word, setWord] = useState("");
    const [cards, setCards] = useState([]);
    // cards = [{ text: "Hello", image: "url" }]
    const [loading, setLoading] = useState(false);

    const SkeletonCard = () => {
        return (
            <div
                style={{
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    padding: "12px",
                    backgroundColor: "#fff",
                    textAlign: "center"
                }}
            >
                <div
                    style={{
                        width: "100px",
                        height: "100px",
                        margin: "0 auto",
                        borderRadius: "8px",
                        background: "#e5e7eb",
                        animation: "pulse 1.5s infinite"
                    }}
                />

                <div
                    style={{
                        height: "12px",
                        marginTop: "10px",
                        borderRadius: "4px",
                        background: "#e5e7eb",
                        animation: "pulse 1.5s infinite"
                    }}
                />
            </div>
        );
    };

    const generateImage = async (phrase) => {
        try {
            const res = await fetch("https://api.openai.com/v1/images/generations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-image-1-mini",
                    prompt: `Simple icon style illustration for communication card: ${phrase}`,
                    size: "256x256",
                    quality: "low"
                }),
            });

            const data = await res.json();

            const base64 = data.data?.[0]?.b64_json;

            if (!base64) return "/images/placeholder.png";

            const imageUrl = `data:image/png;base64,${base64}`;

            console.log("Generated image:", imageUrl);

            return imageUrl;

        } catch (err) {
            console.error(err);
            return "/images/placeholder.png";
        }
    };

    const generateCards = async () => {
        if (!word.trim()) return;

        setLoading(true);

        const prompt = `
            Generate 6 short, practical conversational phrases someone might use when dealing with "${word}".

            IMPORTANT:
            - Include at least:
              • 1 greeting (like "Hello", "Good morning")
              • 1 polite closing or gratitude phrase (like "Thank you")
            - The rest should be useful situation-specific phrases.
            - Keep phrases very simple.
            - Each phrase should be under 5 words.
            - Make them natural and easy to say.
            - Return ONLY a JSON array of strings.
        
            Example format:
            ["Hello", "I need help", "Thank you"]
            `;

        try {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4.1-nano",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 150,
                    temperature: 0.7
                }),
            });

            const data = await res.json();

            const content = data.choices?.[0]?.message?.content;

            // Parse JSON safely
            let cards;
            try {
                cards = JSON.parse(content);
            } catch {
                cards = ["Sorry, something went wrong."];
            }

            const cardsWithImages = await Promise.all(
                cards.map(async (phrase) => {
                    const image = await generateImage(phrase);

                    return {
                        text: phrase,
                        image: image
                    };
                })
            );

            setCards(cardsWithImages);

        } catch (error) {
            console.error(error);
            setCards(["Something went wrong."]);
        }

        setLoading(false);
    };

    const speak = (text) => {
        if (!window.speechSynthesis) {
            alert("Speech not supported in this browser.");
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.rate = 0.85;      // Speed (0.5 to 2)
        utterance.pitch = 1;     // Tone (0 to 2)
        utterance.volume = 1;    // Volume (0 to 1)

        window.speechSynthesis.cancel(); // Stop previous speech
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div>
            <p>Enter a word to generate communication cards</p>

            <div
                style={{
                    display: "flex",
                    gap: "12px",
                    width: "100%",
                    maxWidth: "600px",
                    margin: "0 auto",
                }}
            >
                <input
                    type="text"
                    placeholder="e.g. doctor"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    style={{
                        flex: 1,
                        padding: "14px 18px",
                        fontSize: "16px",
                        borderRadius: "12px",
                        border: "1px solid #e0e0e0",
                        outline: "none",
                        boxShadow: "0 2px 1px rgba(0,0,0,0.05)",
                        transition: "all 0.2s ease",
                    }}
                />

                <button
                    onClick={generateCards}
                    disabled={loading}
                    style={{
                        padding: "14px 20px",
                        fontSize: "16px",
                        borderRadius: "12px",
                        border: "none",
                        backgroundColor: "#6366f1",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: "500",
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    {loading ? "Generating..." : "🎨 Generate Cards"}
                </button>
            </div>

            <div
                style={{
                    marginTop: "20px",
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "15px"
                }}
            >
                {loading
                    ? Array.from({ length: 6 }).map((_, index) => (
                        <SkeletonCard key={index} />
                    ))
                    : cards.map((card, index) => (
                        <div
                            key={index}
                            onClick={() => speak(card.text)}
                            style={{
                                border: "1px solid #ccc",
                                borderRadius: "8px",
                                padding: "12px",
                                textAlign: "center",
                                backgroundColor: "#fff",
                                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                cursor: "pointer"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-3px)";
                                e.currentTarget.style.boxShadow = "0 6px 15px rgba(0,0,0,0.15)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.1)";
                            }}
                        >
                            <img
                                src={card.image}
                                alt={card.text}
                                style={{ width: "100px", borderRadius: "8px" }}
                            />
                            <p>{card.text}</p>
                        </div>
                    ))}
            </div>
        </div>
    );
}

export default Cards;