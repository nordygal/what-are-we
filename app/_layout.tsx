import React, { useEffect, useState, useCallback } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { View } from 'react-native';
import { supabase } from '../lib/supabase';
import { registerForPushNotifications, addNotificationResponseListener } from '../lib/notifications';
import { parseDeepLink } from '../lib/deeplink';
// import { initAppsFlyer, onDeepLink, onInstallConversionData } from '../lib/appsflyer';
import { Session } from '@supabase/supabase-js';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  var [session, setSession] = useState<Session | null>(null);
  var [isReady, setIsReady] = useState(false);
  var [userId, setUserId] = useState<string | null>(null);
  var router = useRouter();
  var segments = useSegments();

  var [fontsLoaded] = useFonts({
    'PlayfairDisplay': require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
    'DMSans': require('../assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('../assets/fonts/DMSans-Medium.ttf'),
    'DMSans-Bold': require('../assets/fonts/DMSans-Bold.ttf'),
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(function () {
    supabase.auth.getSession().then(function (result) {
      setSession(result.data.session);
      setIsReady(true);
    });
    var subscription = supabase.auth.onAuthStateChange(function (_event, newSession) {
      setSession(newSession);
    });
    return function () {
      subscription.data.subscription.unsubscribe();
    };
  }, []);

  // Fetch user record when session exists
  useEffect(function () {
    if (session && session.user && session.user.phone) {
      supabase
        .from('users')
        .select('id, display_name')
        .eq('phone_number', session.user.phone)
        .single()
        .then(function (result) {
          if (result.data) {
            setUserId(result.data.id);
          }
        });
    }
  }, [session]);

  // Register for push notifications
  useEffect(function () {
    if (userId) {
      registerForPushNotifications(userId);
    }
  }, [userId]);

  // Handle notification taps
  useEffect(function () {
    var sub = addNotificationResponseListener(function (response) {
      var data = response.notification.request.content.data;
      if (data && data.questionId) {
        router.push('/reveal/' + data.questionId);
      }
    });

    return function () {
      sub.remove();
    };
  }, []);

  // Initialize AppsFlyer (disabled in Expo Go — needs native build)
  // useEffect(function () {
  //   initAppsFlyer();
  //   onInstallConversionData(function (questionId) {
  //     router.push('/answer/' + questionId);
  //   });
  //   onDeepLink(function (questionId) {
  //     router.push('/answer/' + questionId);
  //   });
  // }, []);

  // Handle deep links (fallback via expo-linking)
  useEffect(function () {
    function handleUrl(event: { url: string }) {
      var deepLinkId = parseDeepLink(event.url);
      if (deepLinkId) {
        router.push('/answer/' + deepLinkId);
      }
    }

    var sub = Linking.addEventListener('url', handleUrl);

    // Check initial URL
    Linking.getInitialURL().then(function (url) {
      if (url) {
        handleUrl({ url: url });
      }
    });

    return function () {
      sub.remove();
    };
  }, []);

  // Auth gate
  useEffect(function () {
    if (!isReady) return;

    var inAuthGroup = segments[0] === 'login';
    var inAnswerRoute = segments[0] === 'answer';

    if (!session && !inAuthGroup && !inAnswerRoute) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/ask');
    }
  }, [session, segments, isReady]);

  var onLayoutRootView = useCallback(function () {
    if (fontsLoaded && isReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isReady]);

  if (!fontsLoaded || !isReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="ask" />
        <Stack.Screen name="sent" />
        <Stack.Screen name="answer/[id]" />
        <Stack.Screen name="reveal/[id]" />
      </Stack>
    </View>
  );
}
