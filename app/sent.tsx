import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../lib/constants';
import Header from '../components/Header';

export default function SentScreen() {
  var router = useRouter();
  var insets = useSafeAreaInsets();

  useEffect(function () {
    var timer = setTimeout(function () {
      router.replace('/ask');
    }, 2000);
    return function () {
      clearTimeout(timer);
    };
  }, []);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/ask');
    }
  }

  return (
    <LinearGradient
      colors={[...Colors.gradientColors]}
      locations={[0, 0.3, 0.55, 0.8, 1]}
      start={{ x: 0.4, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      style={styles.container}
    >
      <View style={styles.headerWrap}>
        <View style={[styles.headerLeft, { top: insets.top + 18 }]}>
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        </View>
        <Header />
      </View>

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
  headerWrap: {
    position: 'relative',
  },
  headerLeft: {
    position: 'absolute',
    left: 16,
    zIndex: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 28,
    color: Colors.textOnGradient,
    fontFamily: Fonts.ui,
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
