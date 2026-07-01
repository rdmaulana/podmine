import { GoogleGenAI } from '@google/genai';
import { LLMDriver, PodcastScript } from '@podmine/types';

export class GeminiDriver implements LLMDriver {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required for GeminiDriver');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateScript(prompt: string): Promise<PodcastScript> {
    const systemInstruction = `
      You are an expert AI Podcast Host. Your job is to write a highly engaging podcast script based on the user's prompt.
      Return the output as a JSON object with the following schema:
      {
        "title": "A catchy, relevant title for the podcast",
        "content": "The actual spoken content of the podcast. Do not include sound effects (like [music] or [laughter]), speaker tags, or stage directions. Write it exactly as it should be read aloud as a single narration."
      }
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: systemInstruction,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini returned an empty response');
    }

    try {
      const parsed = JSON.parse(responseText.trim());
      if (!parsed.title || !parsed.content) {
        throw new Error('Invalid JSON structure returned by Gemini');
      }
      return {
        title: parsed.title,
        content: parsed.content,
      };
    } catch (e: any) {
      console.error('Failed to parse Gemini response as JSON:', responseText);
      throw new Error(`Failed to parse script generation response: ${e.message}`);
    }
  }
}
