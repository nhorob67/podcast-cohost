import fetch from 'node-fetch';

export class CartesiaAdapter {
  constructor(apiKey, voiceId) {
    this.apiKey = apiKey;
    this.voiceId = voiceId;
    this.streamUrl = 'https://api.cartesia.ai/tts/bytes';
  }

  async streamSynthesis(text, onAudioChunk, onComplete, onError) {
    try {
      const response = await fetch(this.streamUrl, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Cartesia-Version': '2024-06-10',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_id: 'sonic-english',
          transcript: text,
          voice: {
            mode: 'id',
            id: this.voiceId,
          },
          output_format: {
            container: 'raw',
            encoding: 'pcm_s16le',
            sample_rate: 24000,
          },
          language: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error(`Cartesia API error: ${response.statusText}`);
      }

      const reader = response.body;
      for await (const chunk of reader) {
        onAudioChunk(chunk);
      }

      onComplete();
    } catch (error) {
      console.error('TTS streaming error:', error);
      onError(error);
    }
  }

  async streamTokenBased(tokenStream, onAudioChunk, onComplete, onError) {
    let buffer = '';
    let tokenCount = 0;
    const tokenThreshold = 15;

    for await (const token of tokenStream) {
      buffer += token;
      tokenCount++;

      if (tokenCount >= tokenThreshold) {
        await this.streamSynthesis(buffer, onAudioChunk, () => {}, onError);
        buffer = '';
        tokenCount = 0;
      }
    }

    if (buffer.length > 0) {
      await this.streamSynthesis(buffer, onAudioChunk, onComplete, onError);
    } else {
      onComplete();
    }
  }
}
