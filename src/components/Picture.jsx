import React, { useEffect, useRef, useState } from "react";
import "./Cards.css";

function Picture() {

    const DAILY_LIMIT = 20;

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [cameraOpen, setCameraOpen] = useState(false);
    const [image, setImage] = useState(null);
    const [sentences, setSentences] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [cameraError, setCameraError] = useState("");

    const getTodayKey = () => {
        const today = new Date().toISOString().slice(0, 10);
        const email = localStorage.getItem("email");

        return `api-usage-${email}-${today}`;
    };

    const getApiUsage = () => {
        const key = getTodayKey();
        const usage = localStorage.getItem(key);

        return usage ? parseInt(usage) : 0;
    };

    const incrementApiUsage = () => {
        const key = getTodayKey();
        const current = getApiUsage();

        localStorage.setItem(key, current + 1);
    };

    const canMakeApiCall = () => {
        return getApiUsage() < DAILY_LIMIT;
    };

    const getRemainingCalls = () => {
        return DAILY_LIMIT - getApiUsage();
    };

    // Start camera
    const startCamera = async () => {

        setCameraError("");

        try {

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: {
                        ideal: "environment"
                    },
                    width: {
                        ideal: 1280
                    },
                    height: {
                        ideal: 720
                    }
                },
                audio: false
            });

            streamRef.current = stream;

            setCameraOpen(true);

            // Wait until video element is rendered
            setTimeout(() => {

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

            }, 100);

        } catch (err) {

            console.error(err);

            setCameraError(
                "Unable to access the camera. Please allow camera access and try again."
            );

        }
    };

    // Stop camera
    const stopCamera = () => {

        if (streamRef.current) {

            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });

            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraOpen(false);
    };

    // Capture photo from video
    const capturePhoto = () => {

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) return;

        const width = video.videoWidth;
        const height = video.videoHeight;

        if (!width || !height) {
            return;
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        context.drawImage(
            video,
            0,
            0,
            width,
            height
        );

        // JPEG keeps the request size smaller than PNG
        const base64Image = canvas.toDataURL(
            "image/jpeg",
            0.85
        );

        setImage(base64Image);
        setSentences([]);
        setHasGenerated(false);

        stopCamera();
    };

    // Retake photo
    const retakePhoto = () => {

        setImage(null);
        setSentences([]);
        setHasGenerated(false);

        startCamera();
    };

    // Generate sentences
    const generateSentences = async () => {

        if (!image || !canMakeApiCall()) return;

        setLoading(true);

        try {

            const res = await fetch("/api/picture", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    image
                })
            });

            if (!res.ok) {
                throw new Error("API failed");
            }

            const data = await res.json();

            setSentences(data.sentences || []);
            setHasGenerated(true);

            incrementApiUsage();

        } catch (err) {

            console.error(err);

            setSentences([
                "Something went wrong. Please try again."
            ]);

            setHasGenerated(true);

        } finally {

            setLoading(false);
        }
    };

    // Cleanup camera when component disappears
    useEffect(() => {

        return () => {

            if (streamRef.current) {

                streamRef.current
                    .getTracks()
                    .forEach(track => track.stop());

            }

        };

    }, []);

    return (
        <div>

            <p>
                📷 Take a picture to get ideas for things you can say about it.
            </p>

            {/* CAMERA */}

            {cameraOpen && (

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "15px"
                    }}
                >

                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            width: "100%",
                            maxWidth: "500px",
                            borderRadius: "16px",
                            backgroundColor: "#000"
                        }}
                    />

                    <div
                        style={{
                            display: "flex",
                            gap: "10px"
                        }}
                    >

                        <button
                            onClick={capturePhoto}
                            style={{
                                padding: "14px 24px",
                                fontSize: "16px",
                                borderRadius: "12px",
                                border: "none",
                                backgroundColor: "#6366f1",
                                color: "white",
                                cursor: "pointer",
                                fontWeight: "500"
                            }}
                        >
                            📸 Capture
                        </button>

                        <button
                            onClick={stopCamera}
                            style={{
                                padding: "14px 20px",
                                fontSize: "16px",
                                borderRadius: "12px",
                                border: "none",
                                backgroundColor: "#6b7280",
                                color: "white",
                                cursor: "pointer",
                                fontWeight: "500"
                            }}
                        >
                            Cancel
                        </button>

                    </div>

                </div>

            )}

            {/* CAMERA ERROR */}

            {cameraError && (

                <div
                    style={{
                        color: "#dc2626",
                        marginTop: "15px"
                    }}
                >
                    {cameraError}
                </div>

            )}

            {/* OPEN CAMERA */}

            {!cameraOpen && !image && (

                <button
                    onClick={startCamera}
                    style={{
                        padding: "14px 24px",
                        fontSize: "16px",
                        borderRadius: "12px",
                        border: "none",
                        backgroundColor: "#6366f1",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: "500"
                    }}
                >
                    📷 Open Camera
                </button>

            )}

            {/* HIDDEN CANVAS */}

            <canvas
                ref={canvasRef}
                style={{ display: "none" }}
            />

            {/* PHOTO PREVIEW */}

            {image && (

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "15px",
                        marginTop: "20px"
                    }}
                >

                    <img
                        src={image}
                        alt="Captured"
                        style={{
                            width: "100%",
                            maxWidth: "500px",
                            maxHeight: "500px",
                            objectFit: "contain",
                            borderRadius: "16px",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.15)"
                        }}
                    />

                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            justifyContent: "center"
                        }}
                    >

                        <button
                            onClick={retakePhoto}
                            disabled={loading}
                            style={{
                                padding: "14px 20px",
                                fontSize: "16px",
                                borderRadius: "12px",
                                border: "none",
                                backgroundColor: "#6b7280",
                                color: "white",
                                cursor: "pointer",
                                fontWeight: "500"
                            }}
                        >
                            📷 Retake
                        </button>

                        <button
                            onClick={generateSentences}
                            disabled={
                                loading ||
                                !canMakeApiCall()
                            }
                            style={{
                                padding: "14px 20px",
                                fontSize: "16px",
                                borderRadius: "12px",
                                border: "none",
                                backgroundColor: "#6366f1",
                                color: "white",
                                cursor: "pointer",
                                fontWeight: "500",
                                opacity: loading ? 0.7 : 1
                            }}
                        >

                            {loading
                                ? <span className="loader"></span>
                                : hasGenerated
                                    ? "🔁 Generate Again"
                                    : "🚀 Generate Sentences"
                            }

                        </button>

                    </div>

                </div>

            )}

            {/* DAILY USAGE */}

            <div className="system-controls">
                🪙 Remaining tokens today: {getRemainingCalls()}
            </div>

            {/* RESULTS */}

            <div className="output">
                {sentences.map((sentence, index) => (
                    <div className="sentence-card" key={index}>
                        {sentence}
                    </div>
                ))}

                <h4 className="ai-label">
                    ✨ AI Generated Sentences
                </h4>
            </div>

        </div>
    );
}

export default Picture;