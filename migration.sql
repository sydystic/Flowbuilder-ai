-- Supabase Migration Script: Chat Persistence & Auth Schema
-- Execute this script in your Supabase SQL Editor.

-- 1. Ensure public.users table exists (should match existing auth trigger/middleware setup)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on users table (if desired, otherwise accessed via service role)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Create Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  spec JSONB DEFAULT '{"trigger":{"service":"[unknown]","event":"[unknown]","sheetName":"[unknown]","details":"[unknown]"},"action":{"service":"[unknown]","action":"[unknown]","channel":"[unknown]","details":"[unknown]"}}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on owner_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_owner_id ON public.conversations(owner_id);

-- 3. Create Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL, -- 'user', 'ai', 'system'
  content TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb, -- messageType, workflow, n8nId, suggestedTemplates, questions, etc.
  model_name TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on conversation_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
