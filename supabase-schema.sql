-- ============================================
-- AUTHENTICATION SCHEMA (Managed by Supabase)
-- ============================================
-- The auth.users table is automatically created and managed by Supabase Auth
-- You don't need to create it, but here's its structure for reference:
--
-- auth.users (
--   id UUID PRIMARY KEY,
--   email TEXT UNIQUE,
--   encrypted_password TEXT,
--   email_confirmed_at TIMESTAMP,
--   invited_at TIMESTAMP,
--   confirmation_token TEXT,
--   confirmation_sent_at TIMESTAMP,
--   recovery_token TEXT,
--   recovery_sent_at TIMESTAMP,
--   email_change_token_new TEXT,
--   email_change TEXT,
--   email_change_sent_at TIMESTAMP,
--   last_sign_in_at TIMESTAMP,
--   raw_app_meta_data JSONB,
--   raw_user_meta_data JSONB (stores username, etc.),
--   is_super_admin BOOLEAN,
--   created_at TIMESTAMP,
--   updated_at TIMESTAMP,
--   phone TEXT,
--   phone_confirmed_at TIMESTAMP,
--   phone_change TEXT,
--   phone_change_token TEXT,
--   phone_change_sent_at TIMESTAMP,
--   confirmed_at TIMESTAMP,
--   email_change_token_current TEXT,
--   email_change_confirm_status SMALLINT,
--   banned_until TIMESTAMP,
--   reauthentication_token TEXT,
--   reauthentication_sent_at TIMESTAMP,
--   is_sso_user BOOLEAN,
--   deleted_at TIMESTAMP
-- )
--
-- This table is in the 'auth' schema, not 'public' schema
-- RLS policies use auth.uid() to get the current user's ID from JWT token
-- ============================================

-- Create enum types
CREATE TYPE time_slot_enum AS ENUM ('morning', 'afternoon', 'evening', 'custom');
CREATE TYPE status_enum AS ENUM ('pending', 'completed');

-- ============================================
-- TASKS TABLE (Your Application Data)
-- ============================================
-- Create tasks table with user_id foreign key that references auth.users
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- Links to Supabase Auth user
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  remind_before INTEGER NOT NULL CHECK (remind_before IN (1, 2, 3, 5, 7, 10)),  -- Only allow these values
  time_slot time_slot_enum NOT NULL DEFAULT 'morning',
  custom_time TIMESTAMP WITH TIME ZONE,
  status status_enum NOT NULL DEFAULT 'pending',
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_reminder_sent ON tasks(reminder_sent);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can view their own tasks"
  ON tasks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a policy for the n8n workflow to read tasks for sending reminders
-- You'll need to create a service role key for n8n to use
CREATE POLICY "Service role can read all tasks for reminders"
  ON tasks
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can update reminder_sent"
  ON tasks
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Note: The service role policies will only work when using the service_role key
-- For n8n, use the service_role key from Supabase dashboard
