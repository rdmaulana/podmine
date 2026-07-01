import { TTSDriver } from '@podmine/types';

export class ElevenLabsDriver implements TTSDriver {
  private apiKey: string;
  private defaultVoiceId: string;

  constructor(apiKey: string, defaultVoiceId = '21m00Tcm4TlvDq8ikWAM') {
    if (!apiKey) {
      throw new Error('ElevenLabs API key is required for ElevenLabsDriver');
    }
    this.apiKey = apiKey;
    this.defaultVoiceId = defaultVoiceId;
  }

  async synthesize(text: string): Promise<Buffer> {
    const voiceId = this.defaultVoiceId;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API failed with status ${response.status}: ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
