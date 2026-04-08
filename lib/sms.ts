import * as SMS from 'expo-sms';
import { generateDeepLinkId, getQuestionUrl } from './deeplink';

interface SendQuestionParams {
  recipientPhone: string;
  recipientName: string;
}

interface SendQuestionResult {
  success: boolean;
  deepLinkId: string;
}

export async function sendQuestion(
  params: SendQuestionParams
): Promise<SendQuestionResult> {
  var deepLinkId = generateDeepLinkId();
  var url = getQuestionUrl(deepLinkId);

  var message =
    'Someone wants to know... what are we? 💬\n' +
    'Open the app to find out who & answer:\n' +
    url;

  var isAvailable = await SMS.isAvailableAsync();

  if (!isAvailable) {
    return { success: false, deepLinkId: deepLinkId };
  }

  var result = await SMS.sendSMSAsync([params.recipientPhone], message);

  return {
    success: result.result === 'sent' || result.result === 'unknown',
    deepLinkId: deepLinkId,
  };
}
