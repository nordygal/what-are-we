import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { Colors, Fonts, AnswerKey, getAnswerDisplay } from '../../lib/constants';
import { getQuestion } from '../../lib/supabase';
import Avatar from '../../components/Avatar';

export default function RevealScreen() {
  var params = useLocalSearchParams<{ id: string; answer?: string }>();
  var router = useRouter();
  var insets = useSafeAreaInsets();
  var [question, setQuestion] = useState<any>(null);
  var [loading, setLoading] = useState(true);
  var [receiptNumber, setReceiptNumber] = useState<number | null>(null);
  var captureRefView = useRef<View>(null);

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
        asker_display_name: 'Sophie',
        recipient_display_name: 'Alex',
      });
      setReceiptNumber(12);
      setLoading(false);
      return;
    }

    var result = await getQuestion(params.id);
    if (result.error || !result.data) {
      Alert.alert('Error', 'Could not find this question');
    } else {
      setQuestion(result.data);
      setReceiptNumber(result.data.receipt_number || null);
    }
    setLoading(false);
  }

  async function handleSave() {
    try {
      var permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow access to save to camera roll');
        return;
      }

      var uri = await captureRef(captureRefView, {
        format: 'png',
        quality: 1,
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved!', 'Image saved to your camera roll');
    } catch (e) {
      Alert.alert('Error', 'Could not save image');
    }
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/receipts');
    }
  }

  function formatReceiptNumber(num: number | null): string {
    if (!num) return 'receipt #00000';
    return 'receipt #' + String(num).padStart(5, '0');
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

  function firstName(name: string | null | undefined): string {
    if (!name) return 'Someone';
    var trimmed = name.trim();
    if (!trimmed) return 'Someone';
    return trimmed.split(/\s+/)[0];
  }

  var askerName = firstName(question.asker_display_name);
  var responderName = firstName(question.recipient_display_name);
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

  // Branding sits well below the status bar so it's visible when the image
  // is shared to an Instagram story — IG overlays a sizeable header
  // (username + close) on the top ~18% of the story, so we push the brand
  // down past that zone.
  var brandTopPadding = insets.top + 140;
  // Card is centered vertically in the remaining space; we leave enough
  // bottom padding for the IG story reply bar too.
  var bottomPadding = insets.bottom + 72;

  return (
    <View style={styles.root}>
      {/* This ref is what gets saved — no overlay buttons inside. */}
      <View
        ref={captureRefView}
        collapsable={false}
        style={StyleSheet.absoluteFill}
      >
        <LinearGradient
          colors={[...Colors.gradientColors]}
          locations={[0, 0.3, 0.55, 0.8, 1]}
          start={{ x: 0.4, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={styles.gradient}
        >
          <View style={[styles.brandWrap, { paddingTop: brandTopPadding }]}>
            <Text style={styles.brand}>
              are we<Text style={styles.brandTm}>™</Text>
            </Text>
          </View>

          <View
            style={[
              styles.cardWrap,
              { paddingBottom: bottomPadding },
            ]}
          >
            <View style={styles.card}>
              <Text style={styles.askedText}>
                {askerName} asked "what are we?"
              </Text>

              <Avatar name={responderName} size={64} />
              <Text style={styles.responderName}>{responderName}</Text>
              <Text style={styles.answeredLabel}>answered</Text>

              {answerDisplay ? (
                <View style={styles.answerPill}>
                  <Text
                    style={styles.answerText}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    numberOfLines={1}
                  >
                    {answerDisplay.label} {answerDisplay.emoji}
                  </Text>
                </View>
              ) : null}

              {dateStr ? (
                <View style={styles.timestamp}>
                  <Text style={styles.dateText}>{dateStr}</Text>
                  <Text style={styles.timeText}>{timeStr}</Text>
                </View>
              ) : null}

              <Text style={styles.receiptText}>
                {formatReceiptNumber(receiptNumber)}
              </Text>

              <Text style={styles.watermark}>
                are we<Text style={styles.watermarkTm}>™</Text>
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Overlay controls — rendered OUTSIDE the capture ref so they don't
          appear in the saved image. */}
      <View
        pointerEvents="box-none"
        style={[styles.overlay, { top: insets.top + 12 }]}
      >
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.7}
          style={styles.downloadBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.downloadIconWrap}>
            <View style={styles.downloadStem} />
            <View style={styles.downloadArrowHead} />
            <View style={styles.downloadTray} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

var styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
  },
  brandWrap: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  brand: {
    fontSize: 26,
    fontFamily: Fonts.brand,
    color: Colors.textOnGradient,
  },
  brandTm: {
    fontSize: 10,
    position: 'relative',
    top: -14,
  },
  cardWrap: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  downloadBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  downloadIconWrap: {
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
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  responderName: {
    fontSize: 22,
    fontFamily: Fonts.brandBold,
    color: '#333333',
    marginTop: 10,
    marginBottom: 4,
  },
  answeredLabel: {
    fontSize: 13,
    fontFamily: Fonts.ui,
    color: '#666666',
    marginBottom: 16,
  },
  answerPill: {
    backgroundColor: '#742a24',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginBottom: 18,
    maxWidth: '100%',
  },
  answerText: {
    fontSize: 26,
    fontFamily: Fonts.brandBold,
    color: '#ffffff',
  },
  timestamp: {
    alignItems: 'center',
    marginBottom: 14,
  },
  dateText: {
    fontSize: 15,
    fontFamily: Fonts.uiBold,
    color: '#333333',
  },
  timeText: {
    fontSize: 13,
    fontFamily: Fonts.ui,
    color: '#666666',
    marginTop: 2,
  },
  receiptText: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    color: '#666666',
    marginBottom: 12,
  },
  watermark: {
    fontSize: 18,
    fontFamily: Fonts.brand,
    color: '#666666',
  },
  watermarkTm: {
    fontSize: 8,
  },
});
