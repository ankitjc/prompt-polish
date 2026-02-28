// config.js
import dotenv from "dotenv";
import path from "path";

// Load environment variables from root .env
dotenv.config({ path: path.resolve("./.env") });

// Centralized config
const config = {
    openaiApiKey: process.env.VITE_OPENAI_API_KEY,
    // Add more variables here as needed
};

if (!config.openaiApiKey) {
    console.warn("⚠️ OPENAI_API_KEY is missing!");
}

export default config;