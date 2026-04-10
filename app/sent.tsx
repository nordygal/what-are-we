import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '../lib/constants';
import Header from '../components/Header';

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
    <LinearGradient
      colors={[...Colors.gradientColors]}
      locations={[0, 0.3, 0.55, 0.8, 1]}
      start={{ x: 0.4, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      style={styles.container}
    >
      <Header />

      <View style={styles.center}>
        <Text style={styles.emoji}>✈️</Text>
        <Text style={styles.title}>Sent!</Text>
        <Text style={styles.subtitle}>
          You'll get a notification when they answer.
        </Text>
      </View>
    </LinearGradient>
  );
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.brandBold,
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.ui,
    color: Colors.textOnGradient,
    textAlign: 'center',
  },
});
