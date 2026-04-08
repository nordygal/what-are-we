import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function sendOtp(phone: string) {
  var result = await supabase.auth.signInWithOtp({ phone: phone });
  return result;
}

export async function verifyOtp(phone: string, token: string) {
  var result = await supabase.auth.verifyOtp({
    phone: phone,
    token: token,
    type: 'sms',
  });
  return result;
}

export async function getOrCreateUser(phone: string, displayName?: string) {
  // Check if user exists
  var existing = await supabase
    .from('users')
    .select('*')
    .eq('phone_number', phone)
    .single();

  if (existing.data) {
    if (displayName && !existing.data.display_name) {
      await supabase
        .from('users')
        .update({ display_name: displayName })
        .eq('id', existing.data.id);
      return Object.assign({}, existing.data, { display_name: displayName });
    }
    return existing.data;
  }

  // Create user
  var created = await supabase
    .from('users')
    .insert({ phone_number: phone, display_name: displayName })
    .select()
    .single();

  return created.data;
}

export async function createQuestion(
  askerId: string,
  recipientPhone: string,
  deepLinkId: string
) {
  var result = await supabase
    .from('questions')
    .insert({
      asker_id: askerId,
      recipient_phone: recipientPhone,
      deep_link_id: deepLinkId,
    })
    .select()
    .single();

  return result;
}

export async function getQuestion(deepLinkId: string) {
  var result = await supabase
    .from('questions')
    .select('*, asker:users!questions_asker_id_fkey(*)')
    .eq('deep_link_id', deepLinkId)
    .single();

  return result;
}

export async function answerQuestion(questionId: string, answer: string) {
  var result = await supabase
    .from('questions')
    .update({
      answer: answer,
      status: 'answered',
      answered_at: new Date().toISOString(),
    })
    .eq('id', questionId)
    .select('*, asker:users!questions_asker_id_fkey(*)')
    .single();

  return result;
}

export async function getMyQuestions(userId: string) {
  var result = await supabase
    .from('questions')
    .select('*, asker:users!questions_asker_id_fkey(*)')
    .eq('asker_id', userId)
    .order('sent_at', { ascending: false });

  return result;
}

export async function updatePushToken(userId: string, token: string) {
  var result = await supabase
    .from('users')
    .update({ push_token: token })
    .eq('id', userId);

  return result;
}
