export interface Conversation {
  id: string;
  title: string;
  description?: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  thread_id: string;
  is_archived: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  audio_url?: string;
  timestamp: string;
  created_at: string;
}

export interface Report {
  id: string;
  title: string;
  description?: string;
  file_type: string;
  file_size_bytes: number;
  upload_date: string;
  tags?: string[];
  openai_file_id?: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Personality {
  id: string;
  name: string;
  instructions: string;
  speaking_style?: {
    tone?: string;
    pace?: string;
    formality?: string;
  };
  knowledge_domains?: string[];
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ReferenceSettings {
  level: 'never' | 'rarely' | 'sometimes' | 'often' | 'always';
  weight: number;
}
