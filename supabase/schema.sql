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

-- RPCs for the answer flow. Anon recipients open the deep link in a browser
-- with no JWT, so they can't satisfy the recipient_phone RLS policy. These
-- SECURITY DEFINER functions let anyone holding a deep_link_id read the
-- question (including the asker's display_name) and submit exactly one
-- answer, without exposing the rest of the users table.

CREATE OR REPLACE FUNCTION public.get_question_by_link(p_deep_link_id text)
RETURNS TABLE (
  id uuid,
  asker_id uuid,
  recipient_phone text,
  recipient_id uuid,
  answer answer_type,
  status text,
  deep_link_id text,
  sent_at timestamptz,
  answered_at timestamptz,
  asker_display_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.asker_id, q.recipient_phone, q.recipient_id, q.answer,
         q.status, q.deep_link_id, q.sent_at, q.answered_at,
         u.display_name AS asker_display_name
    FROM public.questions q
    LEFT JOIN public.users u ON u.id = q.asker_id
   WHERE q.deep_link_id = p_deep_link_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_question_by_link(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_answer_by_link(
  p_deep_link_id text,
  p_answer answer_type
)
RETURNS TABLE (
  id uuid,
  asker_id uuid,
  recipient_phone text,
  recipient_id uuid,
  answer answer_type,
  status text,
  deep_link_id text,
  sent_at timestamptz,
  answered_at timestamptz,
  asker_display_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.questions
     SET answer = p_answer,
         status = 'answered',
         answered_at = now()
   WHERE questions.deep_link_id = p_deep_link_id
     AND questions.status = 'sent';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'question not found or already answered'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
    SELECT * FROM public.get_question_by_link(p_deep_link_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_answer_by_link(text, answer_type) TO anon, authenticated;
