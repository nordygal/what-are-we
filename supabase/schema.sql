-- what are we?™ — Database Schema
-- Run this in the Supabase SQL editor after creating your project

-- Users table
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text UNIQUE NOT NULL,
  display_name text,
  push_token text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Answer type enum
CREATE TYPE answer_type AS ENUM (
  'in_a_relationship', 'exclusive', 'seeing_other_people',
  'keeping_it_casual', 'friends_with_benefits', 'best_friends',
  'just_friends', 'dont_know_yet', 'we_just_met', 'who_is_this'
);

-- Questions table
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asker_id uuid REFERENCES public.users(id) NOT NULL,
  recipient_phone text NOT NULL,
  recipient_id uuid REFERENCES public.users(id),
  answer answer_type,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'answered')),
  deep_link_id text UNIQUE NOT NULL,
  sent_at timestamptz DEFAULT now(),
  answered_at timestamptz
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own record"
  ON public.users FOR SELECT
  USING (auth.uid()::text = id::text OR phone_number = auth.jwt()->>'phone');

CREATE POLICY "Users can insert own record"
  ON public.users FOR INSERT
  WITH CHECK (phone_number = auth.jwt()->>'phone');

CREATE POLICY "Users can update own record"
  ON public.users FOR UPDATE
  USING (phone_number = auth.jwt()->>'phone');

-- RLS Policies for questions
CREATE POLICY "Users can read questions they sent or received"
  ON public.questions FOR SELECT
  USING (
    asker_id IN (SELECT id FROM public.users WHERE phone_number = auth.jwt()->>'phone')
    OR recipient_phone = auth.jwt()->>'phone'
    OR recipient_id IN (SELECT id FROM public.users WHERE phone_number = auth.jwt()->>'phone')
  );

CREATE POLICY "Users can insert questions as asker"
  ON public.questions FOR INSERT
  WITH CHECK (
    asker_id IN (SELECT id FROM public.users WHERE phone_number = auth.jwt()->>'phone')
  );

CREATE POLICY "Recipients can answer questions"
  ON public.questions FOR UPDATE
  USING (
    recipient_phone = auth.jwt()->>'phone'
    OR recipient_id IN (SELECT id FROM public.users WHERE phone_number = auth.jwt()->>'phone')
  );

-- Allow unauthenticated read by deep_link_id (for answering via link)
CREATE POLICY "Anyone can read question by deep_link_id"
  ON public.questions FOR SELECT
  USING (true);

-- Auto-match trigger: link recipients when they sign up
CREATE FUNCTION match_recipient_on_signup() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.questions SET recipient_id = NEW.id
  WHERE recipient_phone = NEW.phone_number AND recipient_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created AFTER INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION match_recipient_on_signup();
