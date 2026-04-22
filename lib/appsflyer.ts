import appsFlyer from 'react-native-appsflyer';

var APPSFLYER_DEV_KEY = 'RN9ZV7ZfqvXgV7cmSGe4Md';
// Using the bundle identifier on both platforms matches build 12 — where the
// app opened cleanly. Build 13 tried switching iOS to the numeric App Store
// ID ('6762583416') and the native SDK threw an NSException during initSdk on
// iOS 26.1, causing a startup crash via unhandled TurboModule exception. We
// aren't using AppsFlyer OneLink in the SMS path anymore, so having the
// "wrong" iOS appId here only means deferred-deep-link attribution is
// unreliable — a known limitation we'll address via a different flow later.
var APPSFLYER_APP_ID = 'com.arewe.app';

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

