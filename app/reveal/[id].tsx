import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, AnswerKey, getAnswerDisplay } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import Avatar from '../../components/Avatar';

export default function RevealScreen() {
  var params = useLocalSearchParams<{ id: string; answer?: string }>();
  var insets = useSafeAreaInsets();
  var [question, setQuestion] = useState<any>(null);
  var [loading, setLoading] = useState(true);

  useEffect(function () {
    loadQuestion();
  }, [params.id]);

  async function loadQuestion() {
    if (!params.id) return;

    if (params.id === 'demo') {
      setQuestion({
        id: 'demo',
        answer: params.answer || 'exclusive',
        answered_at: new Date().toISOString(),
        asker: { display_name: 'Sophie' },
        recipient: { display_name: 'Alex' },
      });
      setLoading(false);
      return;
    }

    var result = await supabase
      .from('questions')
      .select('*, asker:users!questions_asker_id_fkey(*), recipient:users!questions_recipient_id_fkey(*)')
      .eq('deep_link_id', params.id)
      .single();

    if (result.error) {
      var altResult = await supabase
        .from('questions')
        .select('*, asker:users!questions_asker_id_fkey(*), recipient:users!questions_recipient_id_fkey(*)')
        .eq('id', params.id)
        .single();

      if (altResult.error) {
        Alert.alert('Error', 'Could not find this question');
      } else {
        setQuestion(altResult.data);
      }
    } else {
      setQuestion(result.data);
    }
    setLoading(false);
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

  if (!question) return null;

  var askerName = question.asker?.display_name || 'Someone';
  var responderName = question.recipient?.display_name || 'Someone';
  var answer = question.answer as AnswerKey;
  var answerDisplay = getAnswerDisplay(answer);

  var dateStr = '';
  var timeStr = '';
  try {
    var d = new Date(question.answered_at || question.sent_at);
    dateStr = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (e) {
    dateStr = '';
  }

  var downloadIcon = (
    <TouchableOpacity activeOpacity={0.7} style={styles.downloadBtn}>
      <View style={styles.downloadIcon}>
        {/* Vertical stem */}
        <View style={styles.downloadStem} />
        {/* Arrow head */}
        <View style={styles.downloadArrowHead} />
        {/* Tray / shallow U */}
        <View style={styles.downloadTray} />
      </View>
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
      <Header rightIcon={downloadIcon} />

      <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.card}>
          {/* Asked text */}
          <Text style={styles.askedText}>
            {askerName} asked "what are we?"
          </Text>

          {/* Responder avatar + name */}
          <Avatar name={responderName} size={64} />
          <Text style={styles.responderName}>{responderName}</Text>

          {/* Answer bubble */}
          {answerDisplay ? (
            <View style={styles.answerBubble}>
              <Text style={styles.answerText}>
                {answerDisplay.label} {answerDisplay.emoji}
              </Text>
            </View>
          ) : null}

          {/* Timestamp */}
          {dateStr ? (
            <View style={styles.timestamp}>
              <Text style={styles.dateText}>{dateStr}</Text>
              <Text style={styles.timeText}>{timeStr}</Text>
            </View>
          ) : null}

          {/* Watermark */}
          <Text style={styles.watermark}>
            are we<Text style={styles.watermarkTm}>™</Text>
          </Text>
        </View>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.frosted,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.frostedBorder,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtn: {
    padding: 4,
  },
  downloadIcon: {
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  downloadStem: {
    width: 2,
    height: 10,
    backgroundColor: Colors.textOnGradientMuted,
  },
  downloadArrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.textOnGradientMuted,
    marginBottom: 3,
  },
  downloadTray: {
    width: 18,
    height: 6,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderLeftColor: Colors.textOnGradientMuted,
    borderRightColor: Colors.textOnGradientMuted,
    borderBottomColor: Colors.textOnGradientMuted,
    borderTopColor: 'transparent',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  askedText: {
    fontSize: 15,
    fontFamily: Fonts.ui,
    color: Colors.textOnGradientMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  responderName: {
    fontSize: 22,
    fontFamily: Fonts.brandBold,
    color: Colors.white,
    marginTop: 10,
    marginBottom: 20,
  },
  answerBubble: {
    backgroundColor: Colors.frosted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.frostedBorder,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginBottom: 20,
  },
  answerText: {
    fontSize: 22,
    fontFamily: Fonts.brandBold,
    color: Colors.textOnGradient,
  },
  timestamp: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dateText: {
    fontSize: 15,
    fontFamily: Fonts.uiBold,
    color: Colors.textOnGradient,
  },
  timeText: {
    fontSize: 13,
    fontFamily: Fonts.ui,
    color: Colors.textOnGradientMuted,
    marginTop: 2,
  },
  watermark: {
    fontSize: 18,
    fontFamily: Fonts.brand,
    color: 'rgba(255,255,255,0.25)',
  },
  watermarkTm: {
    fontSize: 8,
  },
});
