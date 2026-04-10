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
import { Colors, Fonts, AnswerKey } from '../../lib/constants';
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
  var [question, setQuestion] = useState<any>(null);

  var askerName = question?.asker?.display_name || 'Someone';

  useEffect(function () {
    if (!params.id) return;

    if (params.id === 'demo') {
      setQuestion({
        id: 'demo',
        asker: { display_name: 'Sophie' },
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
      router.replace('/reveal/demo?answer=' + selected);
      return;
    }

    try {
      var result = await answerQuestion(question.id, selected);
      if (result.error) {
        Alert.alert('Error', 'Could not submit answer');
      } else {
        router.replace('/reveal/' + params.id);
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

        {/* Speech bubble */}
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>what are we?</Text>
        </View>

        {/* Answer grid */}
        <View style={styles.gridSection}>
          <AnswerGrid selected={selected} onSelect={setSelected} />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Viral loop */}
        <Text style={styles.viralText}>one good question deserves another</Text>

        {/* Button */}
        <View style={styles.buttonContainer}>
          {selected ? (
            <TouchableOpacity
              style={styles.buttonFilled}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={[styles.buttonText, { color: Colors.primary }]}>
                  Submit
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.buttonOutlined}
              onPress={function () {
                router.push('/ask');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: Colors.white }]}>
                Ask
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
  speechBubble: {
    backgroundColor: Colors.frosted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.frostedBorder,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: 'center',
    marginBottom: 20,
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
    marginVertical: 16,
  },
  viralText: {
    fontSize: 14,
    fontFamily: Fonts.ui,
    fontStyle: 'italic',
    color: Colors.textOnGradientMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    alignItems: 'center',
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
  },
  buttonText: {
    fontSize: 17,
    fontFamily: Fonts.uiBold,
  },
});
