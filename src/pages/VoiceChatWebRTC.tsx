import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Wifi, WifiOff } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function VoiceChatWebRTC() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Connecting...');
  const [statusType, setStatusType] = useState<'default' | 'listening' | 'processing' | 'speaking' | 'error'>('default');
  const [messages, setMessages] = useState<Message[]>([]);
  const [partialTranscript, setPartialTranscript] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const transcriptBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connectWebSocket();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (transcriptBoxRef.current) {
      transcriptBoxRef.current.scrollTop = transcriptBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'production'
      ? window.location.host
      : 'localhost:3001';
    const wsUrl = `${protocol}//${host}/webrtc`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Edge bridge connected');
      setIsConnected(true);
      setStatus('Ready');
      setStatusType('default');
    };

    ws.onmessage = async (event) => {
      if (event.data instanceof Blob) {
        const arrayBuffer = await event.data.arrayBuffer();
        await queueAudioChunk(arrayBuffer);
        return;
      }

      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'connected':
            console.log('Session ID:', message.sessionId);
            break;

          case 'status':
            if (message.message === 'listening') {
              setStatus('Listening...');
              setStatusType('listening');
            } else if (message.message === 'thinking') {
              setStatus('Thinking...');
              setStatusType('processing');
            } else if (message.message === 'speaking') {
              setStatus('Speaking...');
              setStatusType('speaking');
            } else if (message.message === 'ready') {
              setStatus('Ready');
              setStatusType('default');
            }
            break;

          case 'transcript_partial':
            setPartialTranscript(message.text);
            break;

          case 'transcript_final':
            setMessages(prev => [...prev, { role: 'user', content: message.text }]);
            setPartialTranscript('');
            break;

          case 'response_token':
            setMessages(prev => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + message.text }];
              }
              return [...prev, { role: 'assistant', content: message.text }];
            });
            break;

          case 'audio_end':
            console.log('Audio playback complete');
            break;

          case 'audio_interrupted':
            console.log('Audio interrupted by barge-in');
            audioQueueRef.current = [];
            isPlayingRef.current = false;
            break;

          case 'error':
            setStatus(message.message || 'Error occurred');
            setStatusType('error');
            console.error('Server error:', message.message);
            break;
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('Connection error');
      setStatusType('error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setStatus('Disconnected');
      setStatusType('error');

      setTimeout(connectWebSocket, 3000);
    };
  };

  const initAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  };

  const queueAudioChunk = async (arrayBuffer: ArrayBuffer) => {
    try {
      const pcmData = new Int16Array(arrayBuffer);
      const float32Data = new Float32Array(pcmData.length);

      for (let i = 0; i < pcmData.length; i++) {
        float32Data[i] = pcmData[i] / 32768.0;
      }

      audioQueueRef.current.push(float32Data);

      if (!isPlayingRef.current) {
        playNextAudioChunk();
      }
    } catch (error) {
      console.error('Error queuing audio chunk:', error);
    }
  };

  const playNextAudioChunk = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const float32Data = audioQueueRef.current.shift()!;

    try {
      await initAudioContext();

      const audioBuffer = audioContextRef.current!.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = audioContextRef.current!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current!.destination);

      source.onended = () => {
        playNextAudioChunk();
      };

      source.start(0);
    } catch (error) {
      console.error('Error playing audio chunk:', error);
      playNextAudioChunk();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      mediaStreamRef.current = stream;

      await initAudioContext();
      const source = audioContextRef.current!.createMediaStreamSource(stream);

      const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isRecording) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);

        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(pcmData.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContextRef.current!.destination);

      setIsRecording(true);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'start_recording' }));
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setStatus('Microphone access denied');
      setStatusType('error');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);

    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop_recording' }));
    }

    setStatus('Processing...');
    setStatusType('processing');
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getStatusClasses = () => {
    const baseClasses = 'rounded-xl p-5 min-h-16 flex items-center justify-center transition-all border-2';
    switch (statusType) {
      case 'listening':
        return `${baseClasses} bg-green-50 border-green-500`;
      case 'processing':
        return `${baseClasses} bg-amber-50 border-amber-500`;
      case 'speaking':
        return `${baseClasses} bg-blue-50 border-blue-500`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-500`;
      default:
        return `${baseClasses} bg-slate-50 border-slate-200`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-slate-900">Elias</h1>
            {isConnected ? (
              <Wifi className="w-6 h-6 text-green-500" />
            ) : (
              <WifiOff className="w-6 h-6 text-red-500" />
            )}
          </div>
          <p className="text-slate-600">Sub-300ms Realtime Voice AI</p>
        </div>

        <div className={getStatusClasses()}>
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-slate-300'
              }`}
            ></span>
            <span className="text-slate-700 font-medium">{status}</span>
          </div>
        </div>

        <div className="flex justify-center my-8">
          <button
            onClick={handleRecordClick}
            disabled={!isConnected}
            className={`w-32 h-32 rounded-full font-semibold text-lg transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white animate-pulse hover:shadow-2xl hover:shadow-red-500/50'
                : 'bg-gradient-to-br from-slate-700 to-slate-900 text-white hover:shadow-2xl hover:shadow-slate-700/50 hover:scale-105'
            }`}
          >
            {isRecording ? (
              <div className="flex flex-col items-center gap-2">
                <MicOff className="w-8 h-8" />
                <span className="text-sm">Stop</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Mic className="w-8 h-8" />
                <span className="text-sm">Talk</span>
              </div>
            )}
          </button>
        </div>

        {partialTranscript && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs font-semibold text-slate-600 mb-1">Listening...</div>
            <div className="text-slate-700 italic">{partialTranscript}</div>
          </div>
        )}

        <div
          ref={transcriptBoxRef}
          className="bg-slate-50 rounded-xl p-6 min-h-64 max-h-96 overflow-y-auto border border-slate-200"
        >
          {messages.length === 0 ? (
            <p className="text-center text-slate-400">Press Talk to start your conversation...</p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-slate-200 border border-slate-300'
                      : 'bg-slate-700 text-white border border-slate-600'
                  }`}
                >
                  <div className="text-xs font-semibold uppercase mb-1 opacity-70">
                    {msg.role === 'user' ? 'You' : 'Elias'}
                  </div>
                  <div className="leading-relaxed">{msg.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          Powered by WebRTC • AssemblyAI • GPT-4o • Cartesia
        </div>
      </div>
    </div>
  );
}
