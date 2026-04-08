import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { Colors, Fonts, AnswerKey, getAnswerDisplay } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import Avatar from '../../components/Avatar';
import RevealCard from '../../components/RevealCard';
import PrimaryButton from '../../components/PrimaryButton';

export default function RevealScreen() {
  var params = useLocalSearchParams<{ id: string }>();
  var router = useRouter();
  var insets = useSafeAreaInsets();
  var cardRef = useRef<View>(null);
  var [question, setQuestion] = useState<any>(null);
  var [loading, setLoading] = useState(true);

  useEffect(function () {
    loadQuestion();
  }, [params.id]);

  async function loadQuestion() {
    if (!params.id) return;

    var result = await supabase
      .from('questions')
      .select('*, asker:users!questions_asker_id_fkey(*), recipient:users!questions_recipient_id_fkey(*)')
      .eq('id', params.id)
      .single();

    if (result.error) {
      // Try by deep_link_id
      var altResult = await supabase
        .from('questions')
        .select('*, asker:users!questions_asker_id_fkey(*), recipient:users!questions_recipient_id_fkey(*)')
        .eq('deep_link_id', params.id)
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

  async function handleSave() {
    try {
      var permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save images.');
        return;
      }

      if (cardRef.current) {
        var uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1,
        });
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Saved!', 'Image saved to your camera roll.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save image');
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!question) return null;

  var responderName =
    question.recipient?.display_name || 'Someone';
  var answer = question.answer as AnswerKey;
  var answerDisplay = getAnswerDisplay(answer);

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
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveIcon}>💾</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.revealSection}>
          <Avatar name={responderName} size={72} />
          <Text style={styles.answeredBy}>{responderName} answered</Text>
          <Text style={styles.youAsked}>You asked: &quot;what are we?&quot;</Text>
        </View>

        <RevealCard
          ref={cardRef}
          name={responderName}
          answer={answer}
          timestamp={question.answered_at || question.sent_at}
        />

        <View style={styles.ctaSection}>
          <PrimaryButton
            title="Ask Someone Else"
            onPress={function () {
              router.push('/ask');
            }}
          />
          <PrimaryButton
            title={'Ask ' + responderName + ' Again'}
            onPress={function () {
              router.push('/ask');
            }}
            variant="outlined"
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
    paddingTop: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  saveButton: {
    padding: 8,
  },
  saveIcon: {
    fontSize: 24,
  },
  revealSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  answeredBy: {
    fontSize: 22,
    fontFamily: Fonts.uiBold,
    color: Colors.dark,
  },
  youAsked: {
    fontSize: 15,
    fontFamily: Fonts.ui,
    color: Colors.gray,
  },
  ctaSection: {
    marginTop: 32,
    gap: 12,
  },
});
