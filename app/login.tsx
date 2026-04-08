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
import { LinearGradient } from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../lib/constants';
import { sendOtp, verifyOtp } from '../lib/supabase';
import PrimaryButton from '../components/PrimaryButton';

export default function LoginScreen() {
  var insets = useSafeAreaInsets();
  var [phone, setPhone] = useState('');
  var [otp, setOtp] = useState('');
  var [step, setStep] = useState<'phone' | 'otp'>('phone');
  var [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    if (!phone.trim()) return;
    setLoading(true);
    try {
      var result = await sendOtp(phone.trim());
      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else {
        setStep('otp');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to send verification code');
    }
    setLoading(false);
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      var result = await verifyOtp(phone.trim(), otp);
      if (result.error) {
        Alert.alert('Error', result.error.message);
      }
      // Auth state change in _layout handles navigation
    } catch (e) {
      Alert.alert('Error', 'Failed to verify code');
    }
    setLoading(false);
  }

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientEnd]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.branding}>
          <Text style={styles.brandText}>what are we?™</Text>
          <Text style={styles.subtitle}>find out where you stand</Text>
        </View>

        <View style={styles.card}>
          {step === 'phone' ? (
            <>
              <Text style={styles.label}>Enter your phone number</Text>
              <TextInput
                style={styles.input}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor={Colors.sand}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoFocus
              />
              <PrimaryButton
                title="Send Code"
                onPress={handleSendOtp}
                loading={loading}
                disabled={!phone.trim()}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Enter verification code</Text>
              <Text style={styles.sublabel}>
                Sent to {phone}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={Colors.sand}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              <PrimaryButton
                title="Verify"
                onPress={handleVerifyOtp}
                loading={loading}
                disabled={otp.length !== 6}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  branding: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandText: {
    fontSize: 36,
    fontFamily: Fonts.brandBold,
    color: Colors.white,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.ui,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  card: {
    backgroundColor: Colors.warmWhite,
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  label: {
    fontSize: 17,
    fontFamily: Fonts.uiBold,
    color: Colors.dark,
  },
  sublabel: {
    fontSize: 14,
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
