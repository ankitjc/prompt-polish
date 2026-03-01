import { useState } from "react";

function Cards() {
    const [word, setWord] = useState("");
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);

    const generateCards = async () => {
        if (!word.trim()) return;

        setLoading(true);

        try {
            const exampleResponse = [
                { text: "Hello", image: "../images/placeholder.png" },
                { text: "How are you?", image: "../images/placeholder.png" },
                { text: "I feel good", image: "../images/placeholder.png" },
                { text: "I don’t feel well", image: "../images/placeholder.png" },
                { text: "Thank you", image: "../images/placeholder.png" },
                { text: "Goodbye", image: "../images/placeholder.png" }
            ];

            setCards(exampleResponse);
        } catch (err) {
            console.error(err);
        }

        setLoading(false);
    };

    return (
        <div>
            <p>Enter a word to generate communication cards</p>

            <div style={{ display: "flex", gap: "10px" }}>
                <input
                    type="text"
                    placeholder="e.g. doctor"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                />
                <button onClick={generateCards} disabled={loading}>
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
                {cards.map((card, index) => (
                    <div
                        key={index}
                        style={{
                            border: "1px solid #ccc",
                            borderRadius: "5px",
                            padding: "12px",
                            textAlign: "center"
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