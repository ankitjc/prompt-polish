import React, { useState, useEffect, useRef } from "react";
import { OPENAI_API_KEY } from "./config";
import "./App.css";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
// Tones & Simplicity Options
const toneOptions = [
    { label: "Casual", value: "casual", emoji: "🧢" },
    { label: "Formal", value: "formal", emoji: "🧑‍⚖️" },
    { label: "Friendly", value: "friendly", emoji: "🤗" },
    { label: "Funny", value: "funny", emoji: "🤣" }
];

const simplicityOptions = [
    { label: "Simple", value: "simple", emoji: "🐣" },
    { label: "Intermediate", value: "intermediate", emoji: "🧠" },
    { label: "Advanced", value: "advanced", emoji: "🧬" },
];

function App() {
    const [keywords, setKeywords] = useState("");
    const [tone, setTone] = useState("casual");
    const [simplicity, setSimplicity] = useState("simple");
    const [sentence, setSentence] = useState("");
    const [loading, setLoading] = useState(false);
    const [listening, setListening] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    const recognitionRef = useRef(null);

    useEffect(() => {
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = "en-US";
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setKeywords(transcript);
                setListening(false);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setListening(false);
            };

            recognition.onend = () => {
                setListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            alert("Your browser does not support speech recognition.");
        }
    }, []);

    const startListening = () => {
        if (recognitionRef.current && !listening) {
            recognitionRef.current.start();
            setListening(true);
        }
    };

    const generateSentence = async () => {
        if (!keywords.trim()) return;
        setLoading(true);
        const prompt = `Generate a complete, meaningful sentence from these keywords: "${keywords}". Tone: ${tone}. Language complexity: ${simplicity}.
        If the keywords contains only abbreviations or internet slang, just expand them.`;

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4.1-nano",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 60,
            }),
        });

        const data = await res.json();
        setSentence(data.choices?.[0]?.message?.content.trim() || "Something went wrong.");
        setLoading(false);
        setHasGenerated(true); // ✅ Set this flag
    };

    useEffect(() => {
        setHasGenerated(false);
    }, [keywords]);

    return (
        <div className="App">
            <h1>🤖💬 PromptBuddy</h1>
            <p>Speak or type a few keywords. We'll turn them into a sentence!</p>

            <textarea
                placeholder="e.g. tired, homework, late night"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
            />

            <button onClick={startListening} disabled={listening}>
                {listening ? "Listening..." : "🎤 Speak Keywords"}
            </button>

            <div className="controls">
                <div className="emoji-options">
                    <p><strong>Tone:</strong></p>
                    <div className="option-group">
                        {toneOptions.map((opt) => (
                            <button
                                key={opt.value}
                                className={`emoji-button ${tone === opt.value ? "selected" : ""}`}
                                onClick={() => setTone(opt.value)}
                            >
                                {opt.emoji} {opt.label}
                            </button>
                        ))}
                    </div>

                    <p><strong>Simplicity:</strong></p>
                    <div className="option-group">
                        {simplicityOptions.map((opt) => (
                            <button
                                key={opt.value}
                                className={`emoji-button ${simplicity === opt.value ? "selected" : ""}`}
                                onClick={() => setSimplicity(opt.value)}
                            >
                                {opt.emoji} {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button onClick={generateSentence} disabled={loading || !keywords.trim()}>
                {loading
                    ? <span className="loader"></span>
                    : hasGenerated
                        ? "🔁 Regenerate Sentence"
                        : "🚀 Generate Sentence"}
            </button>

            {sentence && (
                <div className="output">
                    <p>{sentence}</p>
                    <h4 className="ai-label">🌟 AI Generated Sentence</h4>
                </div>
            )}
        </div>
    );
}

export default App;
