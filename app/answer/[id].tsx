import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SMS from 'expo-sms';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors, Fonts, AnswerKey, getAnswerDisplay } from '../../lib/constants';
import { getQuestion, answerQuestion, supabase } from '../../lib/supabase';
import { sendQuestion } from '../../lib/sms';
import Header from '../../components/Header';
import Avatar from '../../components/Avatar';
import AnswerGrid from '../../components/AnswerGrid';

var FADE_DURATION = 550;
var STAGGER = 110;

function firstName(name: string | null | undefined): string {
  if (!name) return 'Someone';
  var trimmed = name.trim();
  if (!trimmed) return 'Someone';
  return trimmed.split(/\s+/)[0];
}

export default function AnswerScreen() {
  var params = useLocalSearchParams<{ id: string }>();
  var router = useRouter();
  var insets = useSafeAreaInsets();
  var [selected, setSelected] = useState<AnswerKey | null>(null);
  var [loading, setLoading] = useState(true);
  var [submitting, setSubmitting] = useState(false);
  var [hasSubmitted, setHasSubmitted] = useState(false);
  var [askBackLoading, setAskBackLoading] = useState(false);
  var [question, setQuestion] = useState<any>(null);

  var askerName = firstName(question?.asker_display_name);

  var bubbleScale = useSharedValue(1);
  useEffect(function () {
    bubbleScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1750, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1750, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, []);
  var bubbleStyle = useAnimatedStyle(function () {
    return { transform: [{ scale: bubbleScale.value }] };
  });

  useEffect(function () {
    if (!params.id) return;

    if (params.id === 'demo') {
      setQuestion({
        id: 'demo',
        asker_display_name: 'Sophie',
        asker_phone: '+15555550123',
        answer: null,
      });
      setLoading(false);
      return;
    }

    getQuestion(params.id).then(function (result) {
      if (result.data) {
        setQuestion(result.data);
        if (result.data.answer) {
          setSelected(result.data.answer);
        }
      }
      setLoading(false);
    });
  }, [params.id]);

  async function handleSubmit() {
    if (!selected || !question) return;
    setSubmitting(true);

    if (question.id === 'demo') {
      setHasSubmitted(true);
      setSubmitting(false);
      return;
    }

    try {
      var result = await answerQuestion(params.id!, selected);
      if (result.error) {
        Alert.alert('Error', 'Could not submit answer');
      } else {
        setHasSubmitted(true);
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    }
    setSubmitting(false);
  }

  async function handleAskBack() {
    if (!question) return;
    var askerPhone = question.asker_phone;
    if (!askerPhone) {
      Alert.alert('Cannot ask back', "We don't have their number on file yet.");
      return;
    }

    setAskBackLoading(true);
    try {
      // Need to be signed in to create a reverse question. If not, send them
      // through login first.
      var sessionResult = await supabase.auth.getSession();
      if (!sessionResult.data.session) {
        router.push('/login');
        return;
      }

      var smsAvailable = await SMS.isAvailableAsync();
      if (!smsAvailable) {
        Alert.alert('SMS unavailable', 'Your device cannot send SMS messages.');
        return;
      }

      var result = await sendQuestion({
        recipientPhone: askerPhone,
        recipientName: question.asker_display_name || 'friend',
        message: 'your turn \uD83D\uDC40',
      });
      if (result.success) {
        router.replace('/sent');
      } else if (!result.cancelled) {
        Alert.alert('Error', result.error || 'Could not open SMS composer');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    }
    setAskBackLoading(false);
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/ask');
    }
  }

  if (loading) {
    return (
      <LinearGradient
        colors={[...Colors.gradientColors]}
        locations={[0, 0.3, 0.55, 0.8, 1]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color={Colors.white} />
      </LinearGradient>
    );
  }

  var backButton = (
    <TouchableOpacity
      onPress={handleBack}
      activeOpacity={0.7}
      style={styles.backBtn}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.backBtnText}>←</Text>
    </TouchableOpacity>
  );

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
          {backButton}
        </View>
        <Header />
      </View>

      {hasSubmitted ? (
        <View style={[styles.submittedRoot, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.submittedCentered}>
            <Avatar name={askerName} size={64} />
            <Text style={styles.askerName}>{askerName}</Text>
            <Text style={styles.wantsToKnow}>wants to know...</Text>

            <View style={styles.bubbleWrapper}>
              <View style={styles.bubbleTail} />
              <View style={styles.speechBubble}>
                <Text style={styles.speechText}>"what are we?"</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sentConfirm}>Answer sent ✓</Text>

            {selected && getAnswerDisplay(selected) ? (
              <View style={styles.submittedBubble}>
                <Text style={styles.submittedAnswerText}>
                  {getAnswerDisplay(selected)!.label} {getAnswerDisplay(selected)!.emoji}
                </Text>
              </View>
            ) : null}

            <Text style={styles.yourTurn}>your turn</Text>

            <TouchableOpacity
              style={styles.buttonFilled}
              onPress={handleAskBack}
              disabled={askBackLoading}
              activeOpacity={0.8}
            >
              {askBackLoading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={[styles.buttonText, { color: Colors.primary }]}>
                  Ask {askerName} back →
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={function () {
                router.replace('/ask');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>or skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.answerRoot, { paddingBottom: insets.bottom + 24 }]}>
          <Animated.View
            entering={FadeInDown.duration(FADE_DURATION)}
            style={styles.askerSection}
          >
            <Avatar name={askerName} size={64} />
            <Text style={styles.askerName}>{askerName}</Text>
            <Text style={styles.wantsToKnow}>wants to know...</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(FADE_DURATION).delay(STAGGER)}
            style={styles.bubbleWrapper}
          >
            <Animated.View style={bubbleStyle}>
              <View style={styles.bubbleTail} />
              <View style={styles.speechBubble}>
                <Text style={styles.speechText}>"what are we?"</Text>
              </View>
            </Animated.View>
          </Animated.View>

          <View style={styles.divider} />

          <Animated.View
            entering={FadeInDown.duration(FADE_DURATION).delay(STAGGER * 2)}
            style={styles.gridSection}
          >
            <AnswerGrid selected={selected} onSelect={setSelected} />
          </Animated.View>

          <View style={styles.divider} />

          <Animated.View
            entering={FadeInDown.duration(FADE_DURATION).delay(STAGGER * 3)}
            style={styles.buttonContainer}
          >
            <Text style={styles.trustText}>trust your gut</Text>
            <TouchableOpacity
              style={selected ? styles.buttonFilled : styles.buttonOutlined}
              onPress={handleSubmit}
              disabled={!selected || submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={[styles.buttonText, { color: selected ? Colors.primary : Colors.white }]}>
                  Submit
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </LinearGradient>
  );
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  answerRoot: {
    flex: 1,
    paddingHorizontal: 24,
  },
  submittedRoot: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  submittedCentered: {
    alignItems: 'center',
  },
  askerSection: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  askerName: {
    fontSize: 22,
    fontFamily: Fonts.brandBold,
    color: Colors.white,
    marginTop: 10,
  },
  wantsToKnow: {
    fontSize: 14,
    fontFamily: Fonts.ui,
    color: Colors.textOnGradientMuted,
    marginTop: 2,
  },
  bubbleWrapper: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255,255,255,0.30)',
  },
  speechBubble: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.30)',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  speechText: {
    fontSize: 18,
    fontFamily: Fonts.brand,
    fontStyle: 'italic',
    color: Colors.textOnGradient,
  },
  gridSection: {
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.frostedBorder,
    marginVertical: 10,
    alignSelf: 'stretch',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  trustText: {
    fontSize: 14,
    fontFamily: Fonts.ui,
    fontStyle: 'italic',
    color: Colors.textOnGradientMuted,
    marginBottom: 12,
  },
  buttonFilled: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    alignSelf: 'stretch',
  },
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    alignSelf: 'stretch',
  },
  buttonText: {
    fontSize: 17,
    fontFamily: Fonts.uiBold,
  },
  sentConfirm: {
    fontSize: 18,
    fontFamily: Fonts.uiBold,
    color: '#4ade80',
    marginBottom: 16,
  },
  submittedBubble: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginBottom: 32,
  },
  submittedAnswerText: {
    fontSize: 24,
    fontFamily: Fonts.brandBold,
    color: Colors.textOnGradient,
  },
  yourTurn: {
    fontSize: 14,
    fontFamily: Fonts.uiBold,
    color: Colors.white,
    marginBottom: 12,
  },
  skipText: {
    fontSize: 9,
    fontFamily: Fonts.ui,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 12,
  },
});
