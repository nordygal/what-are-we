import * as SMS from 'expo-sms';
import { generateDeepLinkId, getQuestionUrl } from './deeplink';
import { supabase, createQuestion, getOrCreateUser } from './supabase';

interface SendQuestionParams {
  recipientPhone: string;
  recipientName: string;
  message?: string;
}

interface SendQuestionResult {
  success: boolean;
  deepLinkId: string;
  error?: string;
}

export async function sendQuestion(
  params: SendQuestionParams
): Promise<SendQuestionResult> {
  var deepLinkId = generateDeepLinkId();
  var url = getQuestionUrl(deepLinkId);

  var sessionResult = await supabase.auth.getSession();
  var askerPhone = sessionResult.data.session?.user?.phone;
  if (!askerPhone) {
    return { success: false, deepLinkId: deepLinkId, error: 'Not signed in' };
  }

  var asker = await getOrCreateUser(askerPhone);
  if (!asker || !asker.id) {
    return { success: false, deepLinkId: deepLinkId, error: 'Could not load user' };
  }

  var dbResult = await createQuestion(
    asker.id,
    params.recipientPhone,
    deepLinkId,
    params.recipientName
  );
  if (dbResult.error) {
    return { success: false, deepLinkId: deepLinkId, error: dbResult.error.message };
  }

  var defaultMessage = 'because one of us had to ask \uD83D\uDC40 ' + url;
  var message = params.message ? params.message + ' ' + url : defaultMessage;

  var isAvailable = await SMS.isAvailableAsync();
  if (!isAvailable) {
    return { success: false, deepLinkId: deepLinkId, error: 'SMS not available' };
  }

  var result = await SMS.sendSMSAsync([params.recipientPhone], message);
  return {
    success: result.result === 'sent' || result.result === 'unknown',
    deepLinkId: deepLinkId,
  };
}
