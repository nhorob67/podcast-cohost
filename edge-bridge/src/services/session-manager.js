import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

export class SessionManager {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.sessions = new Map();
  }

  async createSession(personalityId = null) {
    const sessionId = uuidv4();

    const sessionData = {
      sessionId,
      personalityId,
      conversationHistory: [],
      retrievedChunks: [],
      startTime: Date.now(),
      metrics: {
        turnCount: 0,
      },
    };

    this.sessions.set(sessionId, sessionData);

    try {
      await this.supabase.from('session_state').insert({
        session_id: sessionId,
        personality_id: personalityId,
        speaking_rate: 1.0,
        recent_turns: [],
        retrieved_chunk_ids: [],
      });
    } catch (error) {
      console.error('Error saving session to database:', error);
    }

    console.log('Session created:', sessionId);
    return sessionData;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  async updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
    }
  }

  addMessageToHistory(sessionId, role, content) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.conversationHistory.push({ role, content });

      if (session.conversationHistory.length > 20) {
        session.conversationHistory.shift();
      }
    }
  }

  async recordLatency(sessionId, conversationId, metrics) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) return;

      session.metrics.turnCount++;

      const totalLatency =
        (metrics.sttEndpointMs || 0) +
        (metrics.llmFirstTokenMs || 0) +
        (metrics.ttsFirstFrameMs || 0);

      await this.supabase.from('latency_telemetry').insert({
        session_id: sessionId,
        conversation_id: conversationId,
        turn_number: session.metrics.turnCount,
        stt_endpoint_ms: metrics.sttEndpointMs,
        llm_first_token_ms: metrics.llmFirstTokenMs,
        tts_first_frame_ms: metrics.ttsFirstFrameMs,
        total_latency_ms: totalLatency,
      });

      if (totalLatency > 220) {
        console.warn(`⚠️ High latency detected: ${totalLatency}ms for session ${sessionId}`);
      }
    } catch (error) {
      console.error('Error recording latency:', error);
    }
  }

  async destroySession(sessionId) {
    this.sessions.delete(sessionId);
    console.log('Session destroyed:', sessionId);
  }

  async getActivePersonality() {
    try {
      const { data, error } = await this.supabase
        .from('personality_config')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching personality:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching personality:', error);
      return null;
    }
  }

  compileSystemPrompt(personality) {
    if (!personality) {
      return 'You are Elias, a helpful AI assistant. Keep responses concise and conversational.';
    }

    let prompt = personality.instructions;

    prompt += '\n\nGUARDRAILS:';
    prompt += '\n1. Keep responses under 3 sentences unless more detail is requested.';
    prompt += '\n2. Never provide specific stock picks or financial advice.';
    prompt += '\n3. Stay in character and maintain conversational tone.';
    prompt += '\n4. If unsure, admit it honestly.';
    prompt += '\n5. Reference context naturally when relevant.';

    return prompt;
  }
}
