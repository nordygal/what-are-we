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

  var message = 'because one of us had to ask \uD83D\uDC40 ' + url;

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
