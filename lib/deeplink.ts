import { nanoid } from 'nanoid/non-secure';

var BASE_URL = 'https://arewe.app';

export function generateDeepLinkId(): string {
  return nanoid(8);
}

export function getQuestionUrl(deepLinkId: string): string {
  return BASE_URL + '/q/' + deepLinkId;
}

export function parseDeepLink(url: string): string | null {
  if (!url) return null;

  // Handle arewe://answer/XXXX
  var schemeMatch = url.match(/arewe:\/\/answer\/([^/?]+)/);
  if (schemeMatch) return schemeMatch[1];

  // Handle https://arewe.app/q/XXXX
  var webMatch = url.match(/arewe\.app\/q\/([^/?]+)/);
  if (webMatch) return webMatch[1];

  return null;
}
