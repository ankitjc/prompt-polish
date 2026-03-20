import { useEffect, useRef } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

export default function HandTracker({ onMove, onClick }) {
    const videoRef = useRef(null);
    const lastClickRef = useRef(0);

    useEffect(() => {
        if (!videoRef.current) return;

        const hands = new Hands({
            locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7,
        });

        hands.onResults((results) => {
            if (!results.multiHandLandmarks?.length) return;

            const landmarks = results.multiHandLandmarks[0];

            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];

            // 👉 Move cursor
            onMove({ x: indexTip.x, y: indexTip.y });

            // 👉 Detect pinch
            const dx = indexTip.x - thumbTip.x;
            const dy = indexTip.y - thumbTip.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const now = Date.now();

            if (distance < 0.05 && now - lastClickRef.current > 800) {
                lastClickRef.current = now;
                onClick();
            }
        });

        const camera = new Camera(videoRef.current, {
            onFrame: async () => {
                await hands.send({ image: videoRef.current });
            },
            width: 640,
            height: 480,
        });

        camera.start();

        return () => {
            camera.stop();
        };
    }, []);

    return (
        <video
            ref={videoRef}
            autoPlay
            muted
            style={{
                position: "fixed",
                bottom: 12,
                right: 12,
                width: 180,
                borderRadius: 12,
                opacity: 0.8,
                zIndex: 1000,
            }}
        />
    );
}