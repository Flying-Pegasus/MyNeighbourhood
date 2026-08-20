import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
export const isGeminiEnabled = geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY";

export const ai = isGeminiEnabled 
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    })
  : null;
