import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../lib/constants';

// Universal-link catcher. SMS messages link to https://arewe.app/q/<id>;
// when installed, iOS hands that URL to the app and Expo Router matches
// it to this route (matches the public URL path). We redirect to the
// real /answer/<id> screen with router.replace so the unmatched stub
// never stays in the stack — that was the source of the "Unmatched
// Route" users saw when pressing back from the submit confirmation.
export default function QRedirect() {
  var params = useLocalSearchParams<{ id: string }>();
  var router = useRouter();

  useEffect(function () {
    if (params.id) {
      router.replace('/answer/' + params.id);
    } else {
      router.replace('/ask');
    }
  }, [params.id]);

  return (
    <LinearGradient
      colors={[...Colors.gradientColors]}
      locations={[0, 0.3, 0.55, 0.8, 1]}
      start={{ x: 0.4, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      style={styles.container}
    >
      <ActivityIndicator size="large" color={Colors.white} />
    </LinearGradient>
  );
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
