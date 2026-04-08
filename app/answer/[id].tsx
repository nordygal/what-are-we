import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, AnswerKey } from '../../lib/constants';
import { getQuestion, answerQuestion, supabase, getOrCreateUser } from '../../lib/supabase';
import Header from '../../components/Header';
import Avatar from '../../components/Avatar';
import AnswerGrid from '../../components/AnswerGrid';
import PrimaryButton from '../../components/PrimaryButton';

export default function AnswerScreen() {
  var params = useLocalSearchParams<{ id: string }>();
  var router = useRouter();
  var insets = useSafeAreaInsets();
  var [question, setQuestion] = useState<any>(null);
  var [loading, setLoading] = useState(true);
  var [selected, setSelected] = useState<AnswerKey | null>(null);
  var [submitting, setSubmitting] = useState(false);
  var [answered, setAnswered] = useState(false);

  useEffect(function () {
    loadQuestion();
  }, [params.id]);

  async function loadQuestion() {
    if (!params.id) return;
    var result = await getQuestion(params.id);
    if (result.error) {
      Alert.alert('Error', 'Could not find this question');
    } else {
      setQuestion(result.data);
      if (result.data.answer) {
        setAnswered(true);
        setSelected(result.data.answer);
      }
    }
    setLoading(false);
  }

  async function handleAnswer(key: AnswerKey) {
    setSelected(key);
    setSubmitting(true);

    try {
      // Link recipient if logged in
      var sessionResult = await supabase.auth.getSession();
      if (sessionResult.data.session?.user?.phone) {
        await getOrCreateUser(sessionResult.data.session.user.phone);
      }

      var result = await answerQuestion(question.id, key);
      if (result.error) {
        Alert.alert('Error', 'Failed to save answer');
        setSelected(null);
      } else {
        setAnswered(true);
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
      setSelected(null);
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  var askerName = question?.asker?.display_name || 'Someone';

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.askerSection}>
          <Avatar name={askerName} size={56} />
          <Text style={styles.askerName}>{askerName}</Text>
          <Text style={styles.wantsToKnow}>wants to know...</Text>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>what are we? 💬</Text>
        </View>

        {!answered ? (
          <>
            <View style={styles.gridSection}>
              <AnswerGrid selected={selected} onSelect={handleAnswer} />
            </View>

            <Text style={styles.privacyNote}>
              Private answers. Only {askerName} will see your response.
            </Text>
          </>
        ) : null}

        <View style={styles.viralSection}>
          {answered ? (
            <Text style={styles.answeredConfirm}>
              Answer sent! ✅
            </Text>
          ) : null}
          <Text style={styles.viralTitle}>Your turn 🔄</Text>
          <Text style={styles.viralSubtitle}>
            Someone you've been wondering about?
          </Text>
          <PrimaryButton
            title="Ask Someone"
            onPress={function () {
              router.push('/ask');
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.warmWhite,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  askerSection: {
    alignItems: 'center',
    gap: 8,
  },
  askerName: {
    fontSize: 20,
    fontFamily: Fonts.uiBold,
    color: Colors.dark,
  },
  wantsToKnow: {
    fontSize: 15,
    fontFamily: Fonts.ui,
    color: Colors.gray,
  },
  questionCard: {
    backgroundColor: Colors.cream,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 20,
    fontFamily: Fonts.brandBold,
    color: Colors.dark,
  },
  gridSection: {
    marginBottom: 16,
  },
  privacyNote: {
    fontSize: 13,
    fontFamily: Fonts.ui,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 32,
  },
  viralSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.sand,
    paddingTop: 24,
    gap: 12,
    alignItems: 'center',
  },
  answeredConfirm: {
    fontSize: 17,
    fontFamily: Fonts.uiBold,
    color: Colors.primary,
    marginBottom: 8,
  },
  viralTitle: {
    fontSize: 20,
    fontFamily: Fonts.uiBold,
    color: Colors.dark,
  },
  viralSubtitle: {
    fontSize: 15,
    fontFamily: Fonts.ui,
    color: Colors.gray,
    marginBottom: 4,
  },
});
