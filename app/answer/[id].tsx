import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, AnswerKey, getAnswerDisplay } from '../../lib/constants';
import { getQuestion, answerQuestion } from '../../lib/supabase';
import Header from '../../components/Header';
import Avatar from '../../components/Avatar';
import AnswerGrid from '../../components/AnswerGrid';

export default function AnswerScreen() {
  var params = useLocalSearchParams<{ id: string }>();
  var router = useRouter();
  var insets = useSafeAreaInsets();
  var [selected, setSelected] = useState<AnswerKey | null>(null);
  var [loading, setLoading] = useState(true);
  var [submitting, setSubmitting] = useState(false);
  var [hasSubmitted, setHasSubmitted] = useState(false);
  var [question, setQuestion] = useState<any>(null);

  var askerName = question?.asker_display_name || 'Someone';

  useEffect(function () {
    if (!params.id) return;

    if (params.id === 'demo') {
      setQuestion({
        id: 'demo',
        asker_display_name: 'Sophie',
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

  return (
    <LinearGradient
      colors={[...Colors.gradientColors]}
      locations={[0, 0.3, 0.55, 0.8, 1]}
      start={{ x: 0.4, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      style={styles.container}
    >
      <Header />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Asker info */}
        <View style={styles.askerSection}>
          <Avatar name={askerName} size={64} />
          <Text style={styles.askerName}>{askerName}</Text>
          <Text style={styles.wantsToKnow}>wants to know...</Text>
        </View>

        {/* Speech bubble with tail pointing up */}
        <View style={styles.bubbleWrapper}>
          <View style={styles.bubbleTail} />
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>"what are we?"</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {hasSubmitted ? (
          <View style={styles.submittedContainer}>
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
              onPress={function () {
                router.replace({
                  pathname: '/ask',
                  params: { preselect: askerName },
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: Colors.primary }]}>
                Ask {askerName} back →
              </Text>
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
        ) : (
          <View>
            {/* Answer grid */}
            <View style={styles.gridSection}>
              <AnswerGrid selected={selected} onSelect={setSelected} />
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Buttons */}
            <View style={styles.buttonContainer}>
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
            </View>
          </View>
        )}
      </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
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
  submittedContainer: {
    alignItems: 'center',
    paddingTop: 16,
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
    marginBottom: 40,
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
