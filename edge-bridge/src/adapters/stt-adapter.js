import { WebSocket } from 'ws';

export class AssemblyAIAdapter {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.socket = null;
    this.sessionId = null;
  }

  async connect(onPartial, onFinal, onEndpoint, onError) {
    const url = 'wss://api.assemblyai.com/v2/realtime/ws?sample_rate=24000';

    this.socket = new WebSocket(url, {
      headers: {
        authorization: this.apiKey,
      },
    });

    this.socket.on('open', () => {
      console.log('AssemblyAI connection opened');
    });

    this.socket.on('message', (data) => {
      const message = JSON.parse(data.toString());

      if (message.message_type === 'SessionBegins') {
        this.sessionId = message.session_id;
        console.log('AssemblyAI session started:', this.sessionId);
      } else if (message.message_type === 'PartialTranscript') {
        if (message.text && message.text.trim()) {
          onPartial(message.text);
        }
      } else if (message.message_type === 'FinalTranscript') {
        if (message.text && message.text.trim()) {
          onFinal(message.text);
        }
      } else if (message.message_type === 'SessionTerminated') {
        console.log('AssemblyAI session terminated');
      }
    });

    this.socket.on('error', (error) => {
      console.error('AssemblyAI error:', error);
      onError(error);
    });

    this.socket.on('close', () => {
      console.log('AssemblyAI connection closed');
    });

    return new Promise((resolve, reject) => {
      this.socket.once('open', resolve);
      this.socket.once('error', reject);
    });
  }

  sendAudio(pcmData) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const base64Audio = Buffer.from(pcmData).toString('base64');
      this.socket.send(JSON.stringify({ audio_data: base64Audio }));
    }
  }

  async disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
