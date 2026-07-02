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
      You are an expert AI Podcast Producer. Your job is to write a highly engaging conversational podcast script between two hosts: Host A and Host B, based on the user's prompt.
      Return the output as a JSON object with the following schema:
      {
        "title": "A catchy, relevant title for the podcast",
        "dialogue": [
          {
            "speaker": "Host A",
            "text": "First line of dialogue by Host A. Keep it engaging, natural, and conversational."
          },
          {
            "speaker": "Host B",
            "text": "Response or next line of dialogue by Host B."
          }
        ]
      }
      
      Constraints:
      - Always structure the output strictly in this JSON format.
      - The dialogue must alternate between Host A and Host B in a natural conversation.
      - Do not include sound effects (like [music] or [laughter]) or stage directions in the text fields. Only the spoken words.
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
      if (!parsed.title || !Array.isArray(parsed.dialogue)) {
        throw new Error('Invalid JSON structure returned by Gemini: missing title or dialogue array');
      }
      return {
        title: parsed.title,
        dialogue: parsed.dialogue,
      };
    } catch (e: any) {
      console.error('Failed to parse Gemini response as JSON:', responseText);
      throw new Error(`Failed to parse script generation response: ${e.message}`);
    }
  }
}
