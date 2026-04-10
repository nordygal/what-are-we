// Supabase Edge Function: send-push-on-answer
// Deploy as: supabase functions deploy send-push-on-answer
// Trigger via Database Webhook on questions table UPDATE

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface WebhookPayload {
  type: 'UPDATE';
  table: string;
  record: {
    id: string;
    asker_id: string;
    answer: string | null;
    status: string;
  };
  old_record: {
    answer: string | null;
  };
}

serve(async function (req: Request) {
  var payload: WebhookPayload = await req.json();

  // Only fire when answer changes from null to a value
  if (payload.old_record.answer !== null || payload.record.answer === null) {
    return new Response('No push needed', { status: 200 });
  }

  var supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get asker's push token
  var askerResult = await supabase
    .from('users')
    .select('push_token, display_name')
    .eq('id', payload.record.asker_id)
    .single();

  if (!askerResult.data || !askerResult.data.push_token) {
    return new Response('No push token found', { status: 200 });
  }

  // Get recipient name
  var questionResult = await supabase
    .from('questions')
    .select('recipient_id')
    .eq('id', payload.record.id)
    .single();

  var recipientName = 'Someone';
  if (questionResult.data && questionResult.data.recipient_id) {
    var recipientResult = await supabase
      .from('users')
      .select('display_name')
      .eq('id', questionResult.data.recipient_id)
      .single();

    if (recipientResult.data && recipientResult.data.display_name) {
      recipientName = recipientResult.data.display_name;
    }
  }

  // Send Expo push notification
  var pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: askerResult.data.push_token,
      title: 'are we?',
      body: '\uD83D\uDC8C ' + recipientName + ' answered! Tap to see what they said.',
      data: { questionId: payload.record.id },
      sound: 'default',
    }),
  });

  var pushResult = await pushResponse.json();

  return new Response(JSON.stringify(pushResult), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
