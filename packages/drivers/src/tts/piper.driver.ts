import { TTSDriver } from '@podmine/types';

export class PiperDriver implements TTSDriver {
  private apiUrl: string;

  constructor(apiUrl: string) {
    if (!apiUrl) {
      throw new Error('Piper API URL is required for PiperDriver');
    }
    this.apiUrl = apiUrl;
  }

  async synthesize(text: string): Promise<Buffer> {
    try {
      // Send POST request to Piper HTTP API server with JSON body
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error(`Piper HTTP API failed with status ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      throw new Error(`Piper TTS API request failed: ${error.message}`);
    }
  }
}
