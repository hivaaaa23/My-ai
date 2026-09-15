/**
 * Server-Side Gemini Client
 *
 * Exclusively instantiated and executed within the Node.js server environment.
 * The API key is securely retrieved from process.env.GEMINI_API_KEY and is never
 * shipped or exposed to client-side bundles or browsers.
 */

import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

let geminiClientInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }

  if (!geminiClientInstance) {
    geminiClientInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return geminiClientInstance;
}

export const GEMINI_DEFAULT_MODEL = 'gemini-3.6-flash';
