-- Landing-page email capture. Public-facing form on arewe.app POSTs here
-- using the anon key. Anon can INSERT but NOT SELECT/UPDATE/DELETE, so the
-- anon key can't be used to exfiltrate the list. Only the service role
-- (used by the Supabase dashboard) can read.

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS public.email_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL,
  user_agent text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_signups_email_key
  ON public.email_signups (email);

ALTER TABLE public.email_signups ENABLE ROW LEVEL SECURITY;

-- Allow anon + authenticated to INSERT. Basic shape validation only (email
-- must contain '@' and not be empty); length is capped via a CHECK to
-- prevent abuse.
CREATE POLICY "anyone can sign up"
  ON public.email_signups FOR INSERT
  WITH CHECK (
    length(email::text) BETWEEN 3 AND 254
    AND email::text LIKE '%@%'
  );

-- No SELECT policy -> anon + authenticated cannot read the list.
-- Service role bypasses RLS so the Supabase dashboard still sees everything.

GRANT INSERT ON public.email_signups TO anon, authenticated;
