/*
  # Podcast Co-Host System Schema

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key) - Unique conversation identifier
      - `title` (text) - Conversation title
      - `description` (text, nullable) - Optional description
      - `started_at` (timestamptz) - When conversation started
      - `ended_at` (timestamptz, nullable) - When conversation ended
      - `duration_seconds` (integer, nullable) - Total duration
      - `thread_id` (text) - OpenAI thread ID
      - `is_archived` (boolean) - Soft delete flag
      - `tags` (text[], nullable) - Topic tags
      - `created_at` (timestamptz) - Record creation time
      - `updated_at` (timestamptz) - Last update time

    - `messages`
      - `id` (uuid, primary key) - Unique message identifier
      - `conversation_id` (uuid, foreign key) - Links to conversations
      - `role` (text) - Speaker role (user/assistant)
      - `content` (text) - Transcript text
      - `audio_url` (text, nullable) - Reference to audio file
      - `timestamp` (timestamptz) - When message was created
      - `created_at` (timestamptz) - Record creation time

    - `reports`
      - `id` (uuid, primary key) - Unique report identifier
      - `title` (text) - Report title
      - `description` (text, nullable) - Report description
      - `file_type` (text) - File type (markdown, pdf, txt, etc)
      - `file_size_bytes` (integer) - File size
      - `upload_date` (timestamptz) - Upload timestamp
      - `tags` (text[], nullable) - Category tags
      - `openai_file_id` (text, nullable) - OpenAI file ID
      - `processing_status` (text) - Status (pending, processing, completed, failed)
      - `created_at` (timestamptz) - Record creation time
      - `updated_at` (timestamptz) - Last update time

    - `report_files`
      - `id` (uuid, primary key) - Unique file record identifier
      - `report_id` (uuid, foreign key) - Links to reports
      - `file_path` (text) - Storage location
      - `content_text` (text, nullable) - Extracted text content
      - `version` (integer) - Version number
      - `created_at` (timestamptz) - Record creation time

    - `personality_config`
      - `id` (uuid, primary key) - Unique config identifier
      - `name` (text) - Personality name
      - `instructions` (text) - Detailed personality instructions
      - `speaking_style` (jsonb, nullable) - Speaking style details
      - `knowledge_domains` (text[], nullable) - Areas of expertise
      - `is_active` (boolean) - Currently active personality
      - `version` (integer) - Version number
      - `created_at` (timestamptz) - Record creation time
      - `updated_at` (timestamptz) - Last update time

    - `conversation_references`
      - `id` (uuid, primary key) - Unique reference identifier
      - `source_conversation_id` (uuid, foreign key) - New conversation
      - `referenced_conversation_id` (uuid, foreign key) - Past conversation referenced
      - `reference_text` (text) - How it was referenced
      - `timestamp` (timestamptz) - When reference was made
      - `created_at` (timestamptz) - Record creation time

    - `system_settings`
      - `id` (uuid, primary key) - Unique setting identifier
      - `key` (text, unique) - Setting key
      - `value` (jsonb) - Setting value
      - `description` (text, nullable) - Setting description
      - `updated_at` (timestamptz) - Last update time

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access to own data

  3. Indexes
    - Index on conversations.started_at for date queries
    - Index on messages.conversation_id for fast message retrieval
    - Index on reports.upload_date for recent reports
    - Index on conversation_references for relationship queries
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  thread_id text NOT NULL,
  is_archived boolean DEFAULT false,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  audio_url text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_type text NOT NULL,
  file_size_bytes integer NOT NULL,
  upload_date timestamptz NOT NULL DEFAULT now(),
  tags text[],
  openai_file_id text,
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create report_files table
CREATE TABLE IF NOT EXISTS report_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  content_text text,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create personality_config table
CREATE TABLE IF NOT EXISTS personality_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  instructions text NOT NULL,
  speaking_style jsonb,
  knowledge_domains text[],
  is_active boolean DEFAULT false,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversation_references table
CREATE TABLE IF NOT EXISTS conversation_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  referenced_conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  reference_text text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_started_at ON conversations(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_is_archived ON conversations(is_archived);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_reports_upload_date ON reports(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_processing_status ON reports(processing_status);
CREATE INDEX IF NOT EXISTS idx_conversation_references_source ON conversation_references(source_conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_references_referenced ON conversation_references(referenced_conversation_id);
CREATE INDEX IF NOT EXISTS idx_personality_config_active ON personality_config(is_active);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth needs)
-- For now, allowing all operations for development
CREATE POLICY "Allow all operations on conversations"
  ON conversations FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on messages"
  ON messages FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on reports"
  ON reports FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on report_files"
  ON report_files FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on personality_config"
  ON personality_config FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on conversation_references"
  ON conversation_references FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on system_settings"
  ON system_settings FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('reference_frequency', '{"level": "sometimes", "weight": 0.5}'::jsonb, 'How often to reference past conversations'),
  ('max_context_conversations', '{"count": 5}'::jsonb, 'Maximum number of past conversations to include in context')
ON CONFLICT (key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personality_config_updated_at BEFORE UPDATE ON personality_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
