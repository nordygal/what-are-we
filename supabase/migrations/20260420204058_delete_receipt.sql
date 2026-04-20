-- Allow a participant (asker or recipient, matched by user id or phone) to
-- delete a receipt row via SECURITY DEFINER. Hard delete for now — MVP
-- behavior is "this removes the receipt for both parties"; we can add
-- per-user hiding later if users complain.

CREATE OR REPLACE FUNCTION public.delete_receipt(p_deep_link_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text;
  v_user_id uuid;
  v_asker uuid;
  v_recipient uuid;
  v_recipient_phone text;
BEGIN
  v_phone := auth.jwt()->>'phone';
  IF v_phone IS NULL THEN
    RETURN false;
  END IF;

  SELECT u.id INTO v_user_id
    FROM public.users u
   WHERE u.phone_number = v_phone
   LIMIT 1;

  SELECT q.asker_id, q.recipient_id, q.recipient_phone
    INTO v_asker, v_recipient, v_recipient_phone
    FROM public.questions q
   WHERE q.deep_link_id = p_deep_link_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_asker = v_user_id
     OR v_recipient = v_user_id
     OR v_recipient_phone = v_phone THEN
    DELETE FROM public.questions WHERE deep_link_id = p_deep_link_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_receipt(text) TO authenticated;
