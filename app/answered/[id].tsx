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
import { Colors, Fonts, AnswerKey, getAnswerDisplay } from '../../lib/constants';
import { getQuestion, supabase } from '../../lib/supabase';
import { sendQuestion } from '../../lib/sms';
import Header from '../../components/Header';
import Avatar from '../../components/Avatar';

function firstName(name: string | null | undefined): string {
  if (!name) return 'Someone';
  var trimmed = name.trim();
  if (!trimmed) return 'Someone';
  return trimmed.split(/\s+/)[0];
}

// Post-submit confirmation screen. /answer/[id] routes here via router.replace
// once an answer is saved, so this is its own stack entry — back from here
// goes to the previous screen (typically /ask), not back to the answer picker.
export default function AnsweredScreen() {
  var params = useLocalSearchParams<{ id: string; answer?: string }>();
  var router = useRouter();
  var insets = useSafeAreaInsets();
  var [question, setQuestion] = useState<any>(null);
  var [loading, setLoading] = useState(true);
  var [askBackLoading, setAskBackLoading] = useState(false);

  var askerName = firstName(question?.asker_display_name);
  // Prefer the query param (passed by /answer at submit time) for instant
  // render; fall back to the question row which also has the answer
  // populated after answerQuestion ran.
  var answerKey = (params.answer || question?.answer) as AnswerKey | undefined;
  var answerDisplay = answerKey ? getAnswerDisplay(answerKey) : undefined;

  useEffect(function () {
    if (!params.id) return;

    if (params.id === 'demo') {
      setQuestion({
        id: 'demo',
        asker_display_name: 'Sophie',
        asker_phone: '+15555550123',
        answer: params.answer || 'just_friends',
      });
      setLoading(false);
      return;
    }

    getQuestion(params.id).then(function (result) {
      if (result.data) {
        setQuestion(result.data);
      }
      setLoading(false);
    });
  }, [params.id]);

  async function handleAskBack() {
    if (!question) return;
    var askerPhone = question.asker_phone;
    if (!askerPhone) {
      Alert.alert('Cannot ask back', "We don't have their number on file yet.");
      return;
    }

    setAskBackLoading(true);
    try {
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
    // After answering, the natural "back" is home — not the answer picker
    // they just submitted from. Replace instead of router.back() so users
    // can't accidentally re-open the already-answered question.
    router.replace('/ask');
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

      <View style={[styles.root, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.centered}>
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

          {answerDisplay ? (
            <View style={styles.answerBubble}>
              <Text style={styles.answerText}>
                {answerDisplay.label} {answerDisplay.emoji}
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
    </LinearGradient>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerWrap: { position: 'relative' },
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
  root: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
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
  divider: {
    height: 1,
    backgroundColor: Colors.frostedBorder,
    marginVertical: 10,
    alignSelf: 'stretch',
  },
  sentConfirm: {
    fontSize: 18,
    fontFamily: Fonts.uiBold,
    color: '#4ade80',
    marginBottom: 16,
  },
  answerBubble: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginBottom: 32,
  },
  answerText: {
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
  buttonText: {
    fontSize: 17,
    fontFamily: Fonts.uiBold,
  },
  skipText: {
    fontSize: 9,
    fontFamily: Fonts.ui,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 12,
  },
});
