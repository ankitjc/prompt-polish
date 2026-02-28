import React, { useState, useEffect, useRef } from "react";
import { OPENAI_API_KEY } from "./config";
import "./App.css";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode"; // for decoding user info

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

const DAILY_LIMIT = 20;

function App() {
    const [keywords, setKeywords] = useState("");
    const [tone, setTone] = useState("casual");
    const [simplicity, setSimplicity] = useState("simple");
    const [sentence, setSentence] = useState("");
    const [loading, setLoading] = useState(false);
    const [listening, setListening] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [user, setUser] = useState(() => {
        return {
            name : localStorage.getItem("name"),
            email: localStorage.getItem("email")
        };
    });
    // const [loggedIn, setLoggedIn] = useState(false);
    const [loggedIn, setLoggedIn] = useState(() => {
        // Check localStorage on initial load
        const loggedIn = localStorage.getItem("loggedIn");
        return loggedIn === "true"; // convert string to boolean
    });

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

        console.log("got results");
        const data = await res.json();
        setSentence(data.choices?.[0]?.message?.content.trim() || "Something went wrong.");
        setLoading(false);
        setHasGenerated(true); // ✅ Set this flag
        incrementApiUsage();
    };

    useEffect(() => {
        setHasGenerated(false);
    }, [keywords]);

    useEffect(() => {
        // Update localStorage whenever loggedIn changes
        localStorage.setItem("loggedIn", loggedIn+"");
    }, [loggedIn]);

    useEffect(() => {
        // Update localStorage whenever loggedIn changes
        localStorage.setItem("email", user.email);
        localStorage.setItem("name", user.name);
    }, [user]);

    const handleGoogleLogin = (credentialResponse) => {
        const decoded = jwtDecode(credentialResponse.credential);
        setUser(decoded);
        setLoggedIn(true);
    };

    const handleGoogleLoginError = () => {
        console.error("Google Login Failed");
    };

    const logout = () => {
        setLoggedIn(false);
    }

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

    return (
        <div className="App">

            {!loggedIn ? (
                <div>
                    <h1>🤖💬 PromptPolish</h1>
                    <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={handleGoogleLoginError}
                    />
                </div>
            ) : (
                <div>
                    <div className="header">
                        <div className="user-controls">
                            <p className="welcome">👋 Hello, {user.name}</p>
                            <button className="logout-button" onClick={logout}>Logout</button>
                        </div>
                    </div>
                    <h1>🤖💬 PromptPolish</h1>
                    <p>Speak or type a few keywords. We'll turn them into a sentence!</p>

                    <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                        <textarea
                            placeholder="e.g. tired, homework, late night"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            style={{resize: "none", width: "400px", height: "80px"}}
                        />
                        <button style={{width: "150px", height: "110px"}}
                                onClick={startListening} disabled={listening}>
                            {listening ? "Listening..." : "🎤 Speak"}
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

                    <button onClick={generateSentence} disabled={!canMakeApiCall() || loading || !keywords.trim()}>
                        {loading
                            ? <span className="loader"></span>
                            : hasGenerated
                                ? "🔁 Regenerate Sentence"
                                : "🚀 Generate Sentence"}
                    </button>
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


            )}


        </div>
    );
}

export default App;
