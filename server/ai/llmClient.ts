/**
 * Unified Server-Side LLM Client
 *
 * Supports:
 * 1. OpenRouter API (sk-or-v1-...) via standard fetch to https://openrouter.ai/api/v1/chat/completions
 * 2. Official Google GenAI SDK (@google/genai) for native Gemini API keys
 *
 * All keys remain strictly on the server and are never exposed to the client.
 */

import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

export interface ChatMessagePayload {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMGenerateOptions {
  systemInstruction?: string;
  messages: ChatMessagePayload[];
  temperature?: number;
  maxTokens?: number;
}

export interface LLMGenerateResult {
  text: string;
  provider: 'openrouter' | 'gemini' | 'none';
}

function getApiKey(): { key: string; isOpenRouter: boolean } | null {
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey && openRouterKey !== '' && openRouterKey !== 'MY_OPENROUTER_API_KEY') {
    return { key: openRouterKey, isOpenRouter: true };
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey && geminiKey !== '' && geminiKey !== 'MY_GEMINI_API_KEY') {
    const isOpenRouter = geminiKey.startsWith('sk-or-v1-') || geminiKey.startsWith('sk-');
    return { key: geminiKey, isOpenRouter };
  }

  return null;
}

/**
 * Executes a chat completion request to the active LLM backend.
 */
export async function generateAdvisorCompletion(
  options: LLMGenerateOptions
): Promise<LLMGenerateResult> {
  const credentials = getApiKey();
  if (!credentials) {
    return { text: '', provider: 'none' };
  }

  const { key, isOpenRouter } = credentials;

  // 1. OpenRouter branch (using modern fetch)
  if (isOpenRouter) {
    try {
      const messages: Array<{ role: string; content: string }> = [];

      if (options.systemInstruction) {
        messages.push({
          role: 'system',
          content: options.systemInstruction,
        });
      }

      for (const m of options.messages) {
        messages.push({
          role: m.role,
          content: m.content,
        });
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': 'https://ai.studio/build',
          'X-Title': 'StudyMate Iranian Konkur Advisor',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages,
          temperature: options.temperature ?? 0.65,
          max_tokens: options.maxTokens ?? 1500,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`OpenRouter API error (status ${response.status}):`, errorBody);

        // Try fallback to secondary model if primary has quota issues
        if (response.status === 402 || response.status === 429) {
          const fallbackRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'meta-llama/llama-3.3-70b-instruct:free',
              messages,
              temperature: options.temperature ?? 0.65,
              max_tokens: 800,
            }),
          });
          if (fallbackRes.ok) {
            const fbData = (await fallbackRes.json()) as any;
            const content = fbData.choices?.[0]?.message?.content || '';
            return { text: content, provider: 'openrouter' };
          }
        }
        throw new Error(`OpenRouter returned status ${response.status}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content || '';
      return { text: content, provider: 'openrouter' };
    } catch (err) {
      console.error('OpenRouter call failed:', err);
      throw err;
    }
  }

  // 2. Native Gemini SDK branch
  try {
    const ai = new GoogleGenAI({
      apiKey: key,
    });

    const conversationParts: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    for (const m of options.messages) {
      conversationParts.push({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      });
    }

    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: conversationParts,
      config: {
        systemInstruction: options.systemInstruction,
        temperature: options.temperature ?? 0.65,
      },
    });

    return { text: res.text || '', provider: 'gemini' };
  } catch (err) {
    console.error('Google GenAI SDK call failed:', err);
    throw err;
  }
}
