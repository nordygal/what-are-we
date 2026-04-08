import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../lib/constants';
import { supabase, getOrCreateUser } from '../lib/supabase';
import PrimaryButton from '../components/PrimaryButton';
import Header from '../components/Header';

export default function OnboardingScreen() {
  var insets = useSafeAreaInsets();
  var router = useRouter();
  var [name, setName] = useState('');
  var [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      var sessionResult = await supabase.auth.getSession();
      var phone = sessionResult.data.session?.user?.phone;
      if (phone) {
        await getOrCreateUser(phone, name.trim());
      }
      router.replace('/ask');
    } catch (e) {
      Alert.alert('Error', 'Failed to save your name');
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Header />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.card}>
          <Text style={styles.title}>What should we call you?</Text>
          <Text style={styles.subtitle}>
            This is the name others will see when you ask them.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Your first name"
            placeholderTextColor={Colors.sand}
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="words"
          />
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            loading={loading}
            disabled={!name.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.brandBold,
    color: Colors.dark,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.ui,
    color: Colors.gray,
    marginTop: -8,
  },
  input: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: Fonts.ui,
    color: Colors.dark,
    borderWidth: 1,
    borderColor: Colors.sand,
  },
});
