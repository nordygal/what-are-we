import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://bnmhywuyxdtfwuqbcxaw.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWh5d3V5eGR0Znd1cWJjeGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDM4MTgsImV4cCI6MjA5MTE3OTgxOH0.UN3dG3-T3AwI-Ip2clWI2F2EfnZbe9c0OZ1U5bFTXFg';

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
  deepLinkId: string,
  recipientName?: string
) {
  var result = await supabase
    .from('questions')
    .insert({
      asker_id: askerId,
      recipient_phone: recipientPhone,
      deep_link_id: deepLinkId,
      recipient_name: recipientName || null,
    })
    .select()
    .single();

  return result;
}

export async function getQuestion(deepLinkId: string) {
  var result = await supabase
    .rpc('get_question_by_link', { p_deep_link_id: deepLinkId })
    .maybeSingle();

  return result;
}

export async function answerQuestion(deepLinkId: string, answer: string) {
  var result = await supabase
    .rpc('submit_answer_by_link', {
      p_deep_link_id: deepLinkId,
      p_answer: answer,
    })
    .maybeSingle();

  return result;
}

export async function getMyReceipts() {
  var result = await supabase.rpc('get_my_receipts');
  return result;
}

export async function deleteReceipt(deepLinkId: string) {
  var result = await supabase.rpc('delete_receipt', {
    p_deep_link_id: deepLinkId,
  });
  return result;
}

export async function updatePushToken(userId: string, token: string) {
  var result = await supabase
    .from('users')
    .update({ push_token: token })
    .eq('id', userId);

  return result;
}
