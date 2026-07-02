import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMDriver, PodcastScript } from '@podmine/types';

export class GeminiDriver implements LLMDriver {
  private ai: GoogleGenerativeAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required for GeminiDriver');
    }
    this.ai = new GoogleGenerativeAI(apiKey);
  }

  async generateScript(prompt: string): Promise<PodcastScript> {
    const model = this.ai.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const systemInstructionText = `
      You are an expert AI Podcast Host. Your job is to write a highly engaging podcast script based on the user's prompt.
      Return the output as a JSON object with the following schema:
      {
        "title": "A catchy, relevant title for the podcast",
        "content": "The actual spoken content of the podcast. Do not include sound effects (like [music] or [laughter]), speaker tags, or stage directions. Write it exactly as it should be read aloud as a single narration."
      }
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: systemInstructionText,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const response = result.response;
    const responseText = response.text();
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
