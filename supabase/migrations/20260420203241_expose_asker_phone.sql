-- Expose the asker's phone number on get_question_by_link /
-- submit_answer_by_link so the answer screen's "ask X back" button can
-- open an SMS composer prefilled for the original asker without going
-- through the contacts picker.
--
-- Note: the recipient who opens the deep link already has the asker's
-- phone number in the inbound SMS, so returning it here doesn't leak
-- new information to them. Anyone else who somehow acquires the link
-- would learn it, but the threat model already assumes the link is
-- private.

DROP FUNCTION IF EXISTS public.get_question_by_link(text);
CREATE FUNCTION public.get_question_by_link(p_deep_link_id text)
RETURNS TABLE (
  id uuid,
  asker_id uuid,
  asker_phone text,
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
  SELECT q.id, q.asker_id,
         a.phone_number AS asker_phone,
         q.recipient_phone, q.recipient_id, q.answer,
         q.status, q.deep_link_id, q.sent_at, q.answered_at,
         a.display_name AS asker_display_name,
         COALESCE(r.display_name, q.recipient_name) AS recipient_display_name,
         q.receipt_number
    FROM public.questions q
    LEFT JOIN public.users a ON a.id = q.asker_id
    LEFT JOIN public.users r ON r.id = q.recipient_id
   WHERE q.deep_link_id = p_deep_link_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_question_by_link(text) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.submit_answer_by_link(text, answer_type);
CREATE FUNCTION public.submit_answer_by_link(
  p_deep_link_id text,
  p_answer answer_type
)
RETURNS TABLE (
  id uuid,
  asker_id uuid,
  asker_phone text,
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

  SELECT a.push_token,
         COALESCE(r.display_name, q.recipient_name, 'Someone')
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
