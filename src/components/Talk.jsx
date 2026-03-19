import React, {useEffect, useState} from "react";

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

function Talk() {


    const DAILY_LIMIT = 20;
    const [keywords, setKeywords] = useState("");
    const [tone, setTone] = useState("casual");
    const [simplicity, setSimplicity] = useState("simple");
    const [sentence, setSentence] = useState("");
    const [loading, setLoading] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    const getTodayKey = () => {
        const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
        const email = localStorage.getItem("email");
        return `api-usage-${email}-${today}`;
    }

    const getApiUsage = () => {
        const key = getTodayKey();
        const usage = localStorage.getItem(key);
        return usage ? parseInt(usage) : 0;
    }

    const incrementApiUsage = () => {
        const key = getTodayKey();
        const current = getApiUsage();
        localStorage.setItem(key, current + 1);
    }

    const canMakeApiCall = () => {
        return getApiUsage() < DAILY_LIMIT;
    }

    const getRemainingCalls = () => {
        return DAILY_LIMIT - getApiUsage();
    }

    // const generateSentence = async () => {
    //     if (!keywords.trim()) return;
    //     setLoading(true);
    //     const prompt = `Generate a complete, meaningful sentence from these keywords: "${keywords}".
    //     Tone: ${tone}.
    //     Language complexity: ${simplicity}.
    //     If the keywords contains only abbreviations or internet slang, just expand them.`;
    //
    //     const res = await fetch("https://api.openai.com/v1/chat/completions", {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json",
    //             Authorization: `Bearer ${OPENAI_API_KEY}`,
    //         },
    //         body: JSON.stringify({
    //             model: "gpt-4.1-nano",
    //             messages: [{ role: "user", content: prompt }],
    //             max_tokens: 60,
    //         }),
    //     });
    //
    //     const data = await res.json();
    //     setSentence(data.choices?.[0]?.message?.content.trim() || "Something went wrong.");
    //     setLoading(false);
    //     setHasGenerated(true); // ✅ Set this flag
    //     incrementApiUsage();
    // };
    const generateSentence = async () => {
        if (!keywords.trim()) return;
        setLoading(true);

        try {
            const res = await fetch("/api/talk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    keywords,
                    tone,
                    simplicity
                }),
            });

            if (!res.ok) throw new Error("API failed");

            const data = await res.json();
            setSentence(data.sentence || "Something went wrong.");
            setHasGenerated(true);
            incrementApiUsage();

        } catch (err) {
            console.error(err);
            setSentence("Something went wrong.");
            setHasGenerated(true);
        }

        setLoading(false);
    };
    useEffect(() => {
        setHasGenerated(false);
    }, [keywords]);

    return (
        <div>
        <p>Speak or type a few keywords. We'll turn them into a sentence!</p>

        <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                            <textarea
                                placeholder="e.g. tired, homework, late night"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                style={{resize: "none", width: "340px", height: "80px"}}
                            />
            <button  style={{
                padding: "14px 20px",
                fontSize: "16px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "#6366f1",
                color: "white",
                cursor: "pointer",
                fontWeight: "500",
                transition: "all 0.2s ease",
                opacity: loading ? 0.7 : 1,
            }}
                     onClick={generateSentence}
                     disabled={!canMakeApiCall() || loading || !keywords.trim()}>
                {loading
                    ? <span className="loader"></span>
                    : hasGenerated
                        ? "🔁 Regenerate Sentence"
                        : "🚀 Generate Sentence"}
            </button>
        </div>

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

        <div className="system-controls">
            🪙 Remaining tokens today: {getRemainingCalls()}
        </div>

        {sentence && (
            <div className="output">
                <p>{sentence}</p>
                <h4 className="ai-label">✨ AI Generated Sentence</h4>
            </div>
        )}
        </div>
    )
}

export default Talk;