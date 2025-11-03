import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface WebSocketMessage {
  type: string;
  text?: string;
  data?: string;
  message?: string;
  thread_id?: string;
  conversation_id?: string;
}

export default function VoiceChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Connecting...');
  const [statusType, setStatusType] = useState<'default' | 'listening' | 'processing' | 'speaking' | 'error'>('default');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const transcriptBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (transcriptBoxRef.current) {
      transcriptBoxRef.current.scrollTop = transcriptBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setStatus('Ready');
      setStatusType('default');
      setIsEnabled(true);
    };

    ws.onmessage = async (event) => {
      if (event.data instanceof Blob) {
        const arrayBuffer = await event.data.arrayBuffer();
        await queueAudioChunk(arrayBuffer);
        return;
      }

      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'connected':
          console.log('Thread ID:', message.thread_id);
          break;

        case 'status':
          if (message.message === 'Transcribing...') {
            setStatus(message.message);
            setStatusType('processing');
          } else if (message.message === 'Elias is thinking...') {
            setStatus(message.message);
            setStatusType('processing');
          } else if (message.message === 'Elias is speaking...') {
            setStatus(message.message);
            setStatusType('speaking');
          } else if (message.message === 'Ready') {
            setStatus(message.message);
            setStatusType('default');
          }
          break;

        case 'transcript':
          if (message.text) {
            setMessages((prev) => [...prev, { role: 'user', content: message.text! }]);
          }
          break;

        case 'response_chunk':
          if (message.text) {
            setMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + message.text! }];
              }
              return [...prev, { role: 'assistant', content: message.text! }];
            });
            setStatus('Elias is speaking...');
            setStatusType('speaking');
          }
          break;

        case 'response':
          if (message.text) {
            setMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                return prev;
              }
              return [...prev, { role: 'assistant', content: message.text! }];
            });
          }
          break;

        case 'audio_chunk':
          if (message.data) {
            const binaryData = atob(message.data);
            const arrayBuffer = new ArrayBuffer(binaryData.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            for (let i = 0; i < binaryData.length; i++) {
              uint8Array[i] = binaryData.charCodeAt(i);
            }
            await queueAudioChunk(arrayBuffer);
          }
          break;

        case 'audio_end':
          console.log('Audio streaming complete');
          break;

        case 'error':
          setStatus(message.message || 'Error occurred');
          setStatusType('error');
          console.error('Server error:', message.message);
          break;
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
      setIsEnabled(false);

      setTimeout(connectWebSocket, 3000);
    };
  };

  const initAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  };

  const queueAudioChunk = async (arrayBuffer: ArrayBuffer) => {
    try {
      audioQueueRef.current.push(arrayBuffer);

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

    const arrayBuffer = audioQueueRef.current.shift()!;

    try {
      await initAudioContext();

      const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const arrayBuffer = await audioBlob.arrayBuffer();
          wsRef.current.send(arrayBuffer);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus('Listening...');
      setStatusType('listening');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setStatus('Microphone access denied');
      setStatusType('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatus('Processing...');
      setStatusType('processing');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Elias</h1>
          <p className="text-slate-600">Your AI Co-Host</p>
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
            disabled={!isEnabled}
            className={`w-32 h-32 rounded-full font-semibold text-lg transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? 'bg-gradient-to-br from-pink-500 to-red-500 text-white animate-pulse hover:shadow-2xl hover:shadow-red-500/50'
                : 'bg-gradient-to-br from-blue-600 to-purple-600 text-white hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105'
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
                <span className="text-sm">Start</span>
              </div>
            )}
          </button>
        </div>

        <div
          ref={transcriptBoxRef}
          className="bg-slate-50 rounded-xl p-6 min-h-64 max-h-96 overflow-y-auto border border-slate-200"
        >
          {messages.length === 0 ? (
            <p className="text-center text-slate-400">Your conversation will appear here...</p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-100 border border-blue-200'
                      : 'bg-purple-100 border border-purple-200'
                  }`}
                >
                  <div className="text-xs font-semibold uppercase text-slate-600 mb-1">
                    {msg.role === 'user' ? 'You' : 'Elias'}
                  </div>
                  <div className="text-slate-800 leading-relaxed">{msg.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          Click Start to begin your conversation with Elias
        </div>
      </div>
    </div>
  );
}
