-- 1. Receipt number: sequential counter, auto-assigned on INSERT,
--    backfilled for existing rows by PostgreSQL when adding a SERIAL column.
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS receipt_number serial;

-- 2. pg_net: lets SECURITY DEFINER functions make HTTP calls (to the Expo
--    push API) without a separate Edge Function.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 3. Replace get_question_by_link to include recipient_display_name and
--    receipt_number. Drop first because the return shape changed.
DROP FUNCTION IF EXISTS public.get_question_by_link(text);
CREATE FUNCTION public.get_question_by_link(p_deep_link_id text)
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
  asker_display_name text,
  recipient_display_name text,
  receipt_number integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.asker_id, q.recipient_phone, q.recipient_id, q.answer,
         q.status, q.deep_link_id, q.sent_at, q.answered_at,
         a.display_name AS asker_display_name,
         r.display_name AS recipient_display_name,
         q.receipt_number
    FROM public.questions q
    LEFT JOIN public.users a ON a.id = q.asker_id
    LEFT JOIN public.users r ON r.id = q.recipient_id
   WHERE q.deep_link_id = p_deep_link_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_question_by_link(text) TO anon, authenticated;

-- 4. Replace submit_answer_by_link: match new return shape and fire a push
--    notification to the asker directly via pg_net (fire-and-forget).
DROP FUNCTION IF EXISTS public.submit_answer_by_link(text, answer_type);
CREATE FUNCTION public.submit_answer_by_link(
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
  asker_display_name text,
  recipient_display_name text,
  receipt_number integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_asker_token text;
  v_recipient_name text;
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

  SELECT a.push_token, COALESCE(r.display_name, 'Someone')
    INTO v_asker_token, v_recipient_name
    FROM public.questions q
    LEFT JOIN public.users a ON a.id = q.asker_id
    LEFT JOIN public.users r ON r.id = q.recipient_id
   WHERE q.deep_link_id = p_deep_link_id;

  IF v_asker_token IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'to', v_asker_token,
        'title', 'are we?',
        'body', E'\U0001F48C ' || v_recipient_name
                || ' answered! Tap to see what they said.',
        'data', jsonb_build_object('questionId', p_deep_link_id),
        'sound', 'default'
      )
    );
  END IF;

  RETURN QUERY
    SELECT * FROM public.get_question_by_link(p_deep_link_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_answer_by_link(text, answer_type) TO anon, authenticated;

-- 5. get_my_receipts: list every question the caller is a party to
--    (as asker OR as recipient, matched by user id or phone). Used by the
--    Receipts screen.
CREATE OR REPLACE FUNCTION public.get_my_receipts()
RETURNS TABLE (
  id uuid,
  deep_link_id text,
  asker_id uuid,
  recipient_id uuid,
  answer answer_type,
  status text,
  sent_at timestamptz,
  answered_at timestamptz,
  asker_display_name text,
  recipient_display_name text,
  receipt_number integer,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text;
  v_user_id uuid;
BEGIN
  v_phone := auth.jwt()->>'phone';
  IF v_phone IS NULL THEN
    RETURN;
  END IF;

  SELECT u.id INTO v_user_id
    FROM public.users u
   WHERE u.phone_number = v_phone
   LIMIT 1;

  RETURN QUERY
  SELECT q.id, q.deep_link_id, q.asker_id, q.recipient_id, q.answer, q.status,
         q.sent_at, q.answered_at,
         a.display_name, r.display_name, q.receipt_number,
         CASE WHEN q.asker_id = v_user_id THEN 'asker' ELSE 'recipient' END AS role
    FROM public.questions q
    LEFT JOIN public.users a ON a.id = q.asker_id
    LEFT JOIN public.users r ON r.id = q.recipient_id
   WHERE q.asker_id = v_user_id
      OR q.recipient_id = v_user_id
      OR q.recipient_phone = v_phone
   ORDER BY COALESCE(q.answered_at, q.sent_at) DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_receipts() TO authenticated;
