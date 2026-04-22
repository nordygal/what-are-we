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
  cancelled?: boolean;
  deepLinkId: string;
  error?: string;
}

export async function sendQuestion(
  params: SendQuestionParams
): Promise<SendQuestionResult> {
  var deepLinkId = generateDeepLinkId();
  // Send the arewe.app URL directly. The landing page at /q/<id> owns the
  // universal-link handoff to the app when installed, and the App Store
  // fallback with AppsFlyer deferred-deep-link tracking when not. We do NOT
  // use AppsFlyer's OneLink wrapper in the SMS — build 12 shipped that way
  // and it surfaced an "application ID not found" redirect to recipients.
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

  var defaultMessage = 'because one of us had to ask \uD83D\uDC40 ' + url;
  var message = params.message ? params.message + ' ' + url : defaultMessage;

  var isAvailable = await SMS.isAvailableAsync();
  if (!isAvailable) {
    return { success: false, deepLinkId: deepLinkId, error: 'SMS not available' };
  }

  // Open the SMS composer FIRST. We only persist the question row if the
  // user actually sends — cancelling the composer should leave no trace in
  // the receipts log.
  var smsResult = await SMS.sendSMSAsync([params.recipientPhone], message);
  var sent = smsResult.result === 'sent' || smsResult.result === 'unknown';
  if (!sent) {
    return { success: false, cancelled: true, deepLinkId: deepLinkId };
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

  return { success: true, deepLinkId: deepLinkId };
}
