import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Fonts } from '../lib/constants';
import { sendOtp, verifyOtp, supabase, getOrCreateUser } from '../lib/supabase';
import PrimaryButton from '../components/PrimaryButton';

var FADE_DURATION = 500;
var STAGGER = 120;

export default function LoginScreen() {
  var insets = useSafeAreaInsets();
  var router = useRouter();
  var [phone, setPhone] = useState('');
  var [otp, setOtp] = useState('');
  var [name, setName] = useState('');
  var [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  var [loading, setLoading] = useState(false);

  // If session already exists on mount, jump straight to the right step.
  useEffect(function () {
    supabase.auth.getSession().then(function (result) {
      var session = result.data.session;
      var sessionPhone = session && session.user && session.user.phone;
      if (!sessionPhone) return;
      supabase
        .from('users')
        .select('display_name')
        .eq('phone_number', sessionPhone)
        .maybeSingle()
        .then(function (dbResult) {
          if (dbResult.data && dbResult.data.display_name) {
            router.replace('/ask');
          } else {
            setPhone(sessionPhone);
            setStep('name');
          }
        });
    });
  }, []);

  function formatPhone(raw: string): string {
    var digits = raw.replace(/[^0-9]/g, '');
    if (digits.startsWith('1') && digits.length === 11) {
      return '+' + digits;
    }
    if (digits.length === 10) {
      return '+1' + digits;
    }
    if (raw.startsWith('+')) {
      return raw.trim();
    }
    return '+' + digits;
  }

  async function handleSendOtp() {
    if (!phone.trim()) return;
    setLoading(true);
    try {
      var formatted = formatPhone(phone);
      var result = await sendOtp(formatted);
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
      var formatted = formatPhone(phone);
      var result = await verifyOtp(formatted, otp);
      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else {
        var sessionPhone =
          (result.data && result.data.session && result.data.session.user && result.data.session.user.phone) ||
          formatted;
        var existing = await supabase
          .from('users')
          .select('display_name')
          .eq('phone_number', sessionPhone)
          .maybeSingle();
        if (existing.data && existing.data.display_name) {
          router.replace('/ask');
        } else {
          setPhone(sessionPhone);
          setStep('name');
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to verify code');
    }
    setLoading(false);
  }

  async function handleSaveName() {
    var trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      var user = await getOrCreateUser(phone, trimmed);
      if (!user) {
        Alert.alert('Error', 'Could not save your name');
      } else {
        router.replace('/ask');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    }
    setLoading(false);
  }

  return (
    <LinearGradient
      colors={[...Colors.gradientColors]}
      locations={[0, 0.3, 0.55, 0.8, 1]}
      start={{ x: 0.4, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.headerArea, { paddingTop: insets.top + 16 }]}>
        {step !== 'phone' ? (
          <TouchableOpacity
            onPress={function () {
              setStep(step === 'name' ? 'otp' : 'phone');
            }}
            activeOpacity={0.7}
            style={[styles.backBtn, { top: insets.top + 8 }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        ) : null}
        <Animated.Text
          entering={FadeInDown.duration(FADE_DURATION)}
          style={styles.brand}
        >
          are we<Text style={styles.tm}>™</Text>
        </Animated.Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        {step === 'phone' ? (
          <View key="step-phone" style={styles.formArea}>
            <Animated.Text
              entering={FadeInDown.duration(FADE_DURATION).delay(STAGGER)}
              style={styles.label}
            >
              Enter your phone number
            </Animated.Text>
            <Animated.View entering={FadeInDown.duration(FADE_DURATION).delay(STAGGER * 2)}>
              <TextInput
                style={styles.input}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor={Colors.textOnGradientMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoFocus
              />
            </Animated.View>
            <Animated.View entering={FadeInDown.duration(FADE_DURATION).delay(STAGGER * 3)}>
              <PrimaryButton
                title="Send Code"
                onPress={handleSendOtp}
                loading={loading}
                disabled={!phone.trim()}
              />
            </Animated.View>
          </View>
        ) : step === 'otp' ? (
          <View key="step-otp" style={styles.formArea}>
            <Animated.Text
              entering={FadeInDown.duration(FADE_DURATION)}
              style={styles.label}
            >
              Enter verification code
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.duration(FADE_DURATION).delay(STAGGER)}
              style={styles.sublabel}
            >
              Sent to {phone}
            </Animated.Text>
            <Animated.View entering={FadeInDown.duration(FADE_DURATION).delay(STAGGER * 2)}>
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={Colors.textOnGradientMuted}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </Animated.View>
            <Animated.View entering={FadeInDown.duration(FADE_DURATION).delay(STAGGER * 3)}>
              <PrimaryButton
                title="Verify"
                onPress={handleVerifyOtp}
                loading={loading}
                disabled={otp.length !== 6}
              />
            </Animated.View>
          </View>
        ) : (
          <View key="step-name" style={styles.formArea}>
            <Animated.Text
              entering={FadeInDown.duration(FADE_DURATION)}
              style={styles.label}
            >
              What's your name?
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.duration(FADE_DURATION).delay(STAGGER)}
              style={styles.sublabel}
            >
              This shows up when you ask someone a question.
            </Animated.Text>
            <Animated.View entering={FadeInDown.duration(FADE_DURATION).delay(STAGGER * 2)}>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={Colors.textOnGradientMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoFocus
              />
            </Animated.View>
            <Animated.View entering={FadeInDown.duration(FADE_DURATION).delay(STAGGER * 3)}>
              <PrimaryButton
                title="Continue"
                onPress={handleSaveName}
                loading={loading}
                disabled={!name.trim()}
              />
            </Animated.View>
          </View>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    alignItems: 'center',
    paddingBottom: 16,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 2,
  },
  backBtnText: {
    fontSize: 28,
    color: Colors.textOnGradient,
    fontFamily: Fonts.ui,
  },
  brand: {
    fontSize: 26,
    fontFamily: Fonts.brand,
    color: Colors.textOnGradient,
  },
  tm: {
    fontSize: 10,
    position: 'relative',
    top: -20,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  formArea: {
    gap: 16,
  },
  label: {
    fontSize: 18,
    fontFamily: Fonts.ui,
    color: Colors.white,
    textAlign: 'center',
  },
  sublabel: {
    fontSize: 14,
    fontFamily: Fonts.ui,
    color: Colors.textOnGradientMuted,
    textAlign: 'center',
    marginTop: -8,
  },
  input: {
    backgroundColor: Colors.frosted,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    fontFamily: Fonts.ui,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.frostedBorder,
  },
});
