import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Colors, Fonts } from '../lib/constants';
import Header from '../components/Header';

export default function SentScreen() {
  var router = useRouter();
  var insets = useSafeAreaInsets();

  // Drives the question-mark toss: 0 → 1 over 2s.
  var tossProgress = useSharedValue(0);
  var textOpacity = useSharedValue(0);
  var textTranslate = useSharedValue(14);

  useEffect(function () {
    tossProgress.value = withTiming(1, {
      duration: 2000,
      easing: Easing.bezier(0.33, 0.02, 0.36, 1),
    });
    textOpacity.value = withDelay(400, withTiming(1, { duration: 350 }));
    textTranslate.value = withDelay(400, withTiming(0, { duration: 350 }));

    var timer = setTimeout(function () {
      router.replace('/ask');
    }, 2000);
    return function () {
      clearTimeout(timer);
    };
  }, []);

  // Map a 0→1 progress through the toss keyframes (matches the /screens-preview
  // option C curve: pop-in hold, then smooth arc + continuous flip toward the
  // upper right, fading out at the end).
  var tossStyle = useAnimatedStyle(function () {
    var p = tossProgress.value;
    var opacity = interpolate(
      p,
      [0, 0.12, 0.22, 0.68, 0.85, 0.95, 1],
      [0, 1, 1, 0.7, 0.25, 0, 0]
    );
    var scale = interpolate(
      p,
      [0, 0.12, 0.22, 0.5, 0.68, 0.85, 0.95],
      [0.4, 1.08, 1, 0.95, 0.82, 0.65, 0.55]
    );
    var translateX = interpolate(
      p,
      [0, 0.22, 0.34, 0.5, 0.68, 0.85, 0.95],
      [0, 0, 8, 35, 80, 135, 165]
    );
    var translateY = interpolate(
      p,
      [0, 0.22, 0.34, 0.5, 0.68, 0.85, 0.95],
      [0, 0, -12, -45, -100, -160, -190]
    );
    var rotate = interpolate(
      p,
      [0, 0.22, 0.34, 0.5, 0.68, 0.85, 0.95],
      [0, 0, 60, 200, 380, 540, 620]
    );
    return {
      opacity: opacity,
      transform: [
        { translateX: translateX },
        { translateY: translateY },
        { scale: scale },
        { rotate: rotate + 'deg' },
      ],
    };
  });

  var textStyle = useAnimatedStyle(function () {
    return {
      opacity: textOpacity.value,
      transform: [{ translateY: textTranslate.value }],
    };
  });

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
        <Animated.Text style={[styles.emoji, tossStyle]}>❔</Animated.Text>
        <Animated.Text style={[styles.title, textStyle]}>Sent!</Animated.Text>
        <Animated.Text style={[styles.subtitle, textStyle]}>
          You'll get a notification when they answer.
        </Animated.Text>
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
