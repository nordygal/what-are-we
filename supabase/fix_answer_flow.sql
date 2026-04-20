-- Fix: anon (unauthenticated) recipients could not submit answers, and the
-- asker's display_name was filtered out by users RLS, causing "Someone".
--
-- Run this in the Supabase SQL editor against the existing project.

-- Return a question by its deep link, plus the asker's display_name.
-- SECURITY DEFINER so the callers don't need SELECT on users.
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

-- Submit an answer for a question identified by its deep link.
-- Anyone with the link may answer, but only once (status must be 'sent').
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
