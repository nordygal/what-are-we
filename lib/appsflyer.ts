import appsFlyer from 'react-native-appsflyer';
import { Platform } from 'react-native';

var APPSFLYER_DEV_KEY = 'RN9ZV7ZfqvXgV7cmSGe4Md';
// iOS: numeric App Store Connect app ID (same value as ascAppId in eas.json).
// Android: bundle/package name. Build 12 shipped with the bundle ID on both
// platforms, which caused OneLink redirects to show AppsFlyer's "application
// ID not found" page because iOS needs the numeric form.
var APPSFLYER_APP_ID =
  Platform.OS === 'ios' ? '6762583416' : 'com.arewe.app';

export function initAppsFlyer(): Promise<void> {
  return new Promise(function (resolve) {
    appsFlyer.initSdk(
      {
        devKey: APPSFLYER_DEV_KEY,
        isDebug: __DEV__,
        appId: APPSFLYER_APP_ID,
        onInstallConversionDataListener: true,
        onDeepLinkListener: true,
        timeToWaitForATTUserAuthorization: 10,
      },
      function (result) {
        console.log('AppsFlyer init success:', result);
        resolve();
      },
      function (error) {
        console.log('AppsFlyer init error:', error);
        resolve();
      }
    );
  });
}

// Listen for deferred deep links (user installs app after clicking link)
export function onDeepLink(callback: (questionId: string) => void): void {
  appsFlyer.onDeepLink(function (result) {
    console.log('AppsFlyer deep link:', JSON.stringify(result));
    if (result && result.data) {
      var questionId = result.data.question_id || result.data.deep_link_value;
      if (questionId) {
        callback(questionId);
      }
    }
  });
}

// Listen for install conversion data (deferred deep link on first open)
export function onInstallConversionData(callback: (questionId: string) => void): void {
  appsFlyer.onInstallConversionData(function (result) {
    console.log('AppsFlyer conversion data:', JSON.stringify(result));
    if (result && result.data) {
      var isFirstLaunch = result.data.is_first_launch;
      var questionId = result.data.question_id || result.data.deep_link_value;
      if (isFirstLaunch && questionId) {
        callback(questionId);
      }
    }
  });
}

