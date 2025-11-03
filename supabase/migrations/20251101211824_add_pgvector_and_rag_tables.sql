/*
  # Add pgvector extension and RAG infrastructure

  ## Overview
  This migration adds vector search capabilities and supporting infrastructure for the
  sub-300ms realtime voice system transformation.

  ## New Components

  1. Extensions
    - Enable pgvector for vector similarity search

  2. New Tables
    - `document_chunks`
      - Stores chunked report content with vector embeddings
      - Fields: id, report_id, company, section, chunk_text, abstract, fast_facts, quote, embedding, chunk_index, token_count
      - Supports fast vector similarity search with pgvector
    
    - `latency_telemetry`
      - Tracks latency metrics for performance monitoring
      - Fields: id, session_id, conversation_id, turn_number, stt_endpoint_ms, llm_first_token_ms, tts_first_frame_ms, total_latency_ms
      - Enables P50/P95/P99 analysis and alerting
    
    - `session_state`
      - Stores edge session metadata
      - Fields: id, session_id, personality_id, speaking_rate, recent_turns, retrieved_chunk_ids, created_at, expires_at
      - Supports Redis-backed session management

  3. Indexes
    - Vector similarity index on document_chunks.embedding using HNSW
    - Indexes on company, report_id for fast filtering
    - Index on latency_telemetry timestamps for time-series queries

  4. Security
    - Enable RLS on all new tables
    - Add public policies for development (to be restricted in production)
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document_chunks table for vector RAG
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  company text,
  section text,
  chunk_text text NOT NULL,
  abstract text,
  fast_facts text[],
  quote text,
  embedding vector(1536),
  chunk_index integer NOT NULL DEFAULT 0,
  token_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create latency_telemetry table
CREATE TABLE IF NOT EXISTS latency_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  turn_number integer NOT NULL DEFAULT 0,
  stt_endpoint_ms integer,
  llm_first_token_ms integer,
  tts_first_frame_ms integer,
  total_latency_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Create session_state table
CREATE TABLE IF NOT EXISTS session_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  personality_id uuid REFERENCES personality_config(id) ON DELETE SET NULL,
  speaking_rate float DEFAULT 1.0,
  recent_turns jsonb DEFAULT '[]'::jsonb,
  retrieved_chunk_ids uuid[] DEFAULT ARRAY[]::uuid[],
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '2 hours'
);

-- Create indexes for document_chunks
CREATE INDEX IF NOT EXISTS idx_document_chunks_report_id ON document_chunks(report_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_company ON document_chunks(company);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create indexes for latency_telemetry
CREATE INDEX IF NOT EXISTS idx_latency_telemetry_session_id ON latency_telemetry(session_id);
CREATE INDEX IF NOT EXISTS idx_latency_telemetry_created_at ON latency_telemetry(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_latency_telemetry_conversation_id ON latency_telemetry(conversation_id);

-- Create indexes for session_state
CREATE INDEX IF NOT EXISTS idx_session_state_session_id ON session_state(session_id);
CREATE INDEX IF NOT EXISTS idx_session_state_expires_at ON session_state(expires_at);

-- Enable Row Level Security
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE latency_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_state ENABLE ROW LEVEL SECURITY;

-- Create policies for development (public access)
CREATE POLICY "Allow all operations on document_chunks"
  ON document_chunks FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on latency_telemetry"
  ON latency_telemetry FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on session_state"
  ON session_state FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM session_state WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Create view for latency statistics
CREATE OR REPLACE VIEW latency_stats AS
SELECT
  date_trunc('hour', created_at) as hour,
  COUNT(*) as turn_count,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY total_latency_ms) as p50_latency_ms,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY total_latency_ms) as p95_latency_ms,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY total_latency_ms) as p99_latency_ms,
  AVG(stt_endpoint_ms) as avg_stt_ms,
  AVG(llm_first_token_ms) as avg_llm_ms,
  AVG(tts_first_frame_ms) as avg_tts_ms
FROM latency_telemetry
WHERE created_at > now() - interval '7 days'
GROUP BY hour
ORDER BY hour DESC;