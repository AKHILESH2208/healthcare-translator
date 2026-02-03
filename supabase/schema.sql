-- Healthcare Translator Database Schema
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Messages table for storing all chat messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('doctor', 'patient')),
  original_content TEXT NOT NULL,
  translated_content TEXT,
  audio_url TEXT,
  language TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster queries by timestamp
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_role ON messages(sender_role);

-- Create index for search functionality
CREATE INDEX IF NOT EXISTS idx_messages_content ON messages USING gin(to_tsvector('english', original_content || ' ' || COALESCE(translated_content, '')));

-- Enable Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (modify for production with authentication)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Enable all access for messages'
  ) THEN
    CREATE POLICY "Enable all access for messages" ON messages
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Function to get recent messages for medical summary
CREATE OR REPLACE FUNCTION get_recent_messages(message_limit INT DEFAULT 20)
RETURNS SETOF messages AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM messages
  ORDER BY created_at DESC
  LIMIT message_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to search messages
CREATE OR REPLACE FUNCTION search_messages(search_query TEXT)
RETURNS SETOF messages AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM messages
  WHERE 
    original_content ILIKE '%' || search_query || '%' OR
    translated_content ILIKE '%' || search_query || '%'
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE messages IS 'Stores all doctor-patient chat messages with translations';
COMMENT ON COLUMN messages.sender_role IS 'Role of the sender: doctor or patient';
COMMENT ON COLUMN messages.original_content IS 'Original message in the sender language';
COMMENT ON COLUMN messages.translated_content IS 'AI-translated message in the recipient language';
COMMENT ON COLUMN messages.audio_url IS 'Public URL to audio recording in Supabase Storage';
COMMENT ON COLUMN messages.language IS 'ISO language code (e.g., en, es, hi)';
COMMENT ON COLUMN messages.metadata IS 'Additional flexible data (e.g., transcription confidence)';
