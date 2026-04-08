import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '../lib/constants';

export default function SentScreen() {
  var router = useRouter();

  useEffect(function () {
    var timer = setTimeout(function () {
      router.replace('/ask');
    }, 2000);

    return function () {
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>✈️</Text>
      <Text style={styles.title}>Sent!</Text>
      <Text style={styles.subtitle}>
        {"You'll"} get a notification when they answer.
      </Text>
    </View>
  );
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.brandBold,
    color: Colors.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.ui,
    color: Colors.gray,
    textAlign: 'center',
  },
});
