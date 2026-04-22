import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Contacts from 'expo-contacts';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Colors, Fonts, ANSWER_OPTIONS } from '../lib/constants';
import { sendQuestion } from '../lib/sms';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import Avatar from '../components/Avatar';

var FADE_DURATION = 550;
var STAGGER = 110;
var SUBTITLE_DWELL = 2000;     // how long each answer is held visible
var SUBTITLE_CROSSFADE = 220;  // out-then-in fade time (each half)

interface ContactItem {
  id: string;
  name: string;
  phone: string;
}

// Single contact row with its own press-spring. Owning the shared value here
// (instead of at the screen level) means one press doesn't affect the other
// rows, and FlatList recycling won't leave a stale animation behind.
function ContactRow(props: {
  contact: ContactItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  var pressScale = useSharedValue(1);

  var animatedStyle = useAnimatedStyle(function () {
    return { transform: [{ scale: pressScale.value }] };
  });

  function handlePressIn() {
    pressScale.value = withSpring(0.96, { mass: 0.5, damping: 12, stiffness: 250 });
  }
  function handlePressOut() {
    pressScale.value = withSpring(1, { mass: 0.5, damping: 12, stiffness: 200 });
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[
          styles.contactRow,
          props.isSelected && styles.contactRowSelected,
        ]}
        onPress={function () {
          props.onSelect(props.contact.id);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Avatar name={props.contact.name} size={44} />
        <Text
          style={[
            styles.contactName,
            props.isSelected && styles.contactNameSelected,
          ]}
        >
          {props.contact.name}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// Italic subtitle under the question card that cycles through every answer
// option (imported from lib/constants so it can never drift from the real
// answer grid). Each item holds for ~2s, with a short crossfade between.
// Purpose: hint to askers what kinds of answers they might get, since there
// is no onboarding yet.
function CyclingSubtitle() {
  var [index, setIndex] = useState(0);
  var opacity = useSharedValue(1);

  useEffect(function () {
    var timer = setInterval(function () {
      opacity.value = withTiming(0, { duration: SUBTITLE_CROSSFADE });
      var swap = setTimeout(function () {
        setIndex(function (prev) {
          return (prev + 1) % ANSWER_OPTIONS.length;
        });
        opacity.value = withTiming(1, { duration: SUBTITLE_CROSSFADE });
      }, SUBTITLE_CROSSFADE);
      // Capture swap timeout so StrictMode / fast re-renders don't leave it
      // dangling; attach it on the interval's ref via a closure.
      (timer as any)._swap = swap;
    }, SUBTITLE_DWELL);
    return function () {
      clearInterval(timer);
      if ((timer as any)._swap) clearTimeout((timer as any)._swap);
    };
  }, []);

  var style = useAnimatedStyle(function () {
    return { opacity: opacity.value };
  });

  var current = ANSWER_OPTIONS[index];

  return (
    <Animated.Text
      style={[styles.cyclingSubtitle, style]}
      numberOfLines={1}
    >
      {current.label} {current.emoji}
    </Animated.Text>
  );
}

export default function AskScreen() {
  var insets = useSafeAreaInsets();
  var router = useRouter();
  var [contacts, setContacts] = useState<ContactItem[]>([]);
  var [filtered, setFiltered] = useState<ContactItem[]>([]);
  var [search, setSearch] = useState('');
  var [selected, setSelected] = useState<string | null>(null);
  var [loading, setLoading] = useState(false);

  // Question card breathes continuously, chat icon bobs continuously. Both
  // start on mount and run forever.
  var cardScale = useSharedValue(1);
  var iconTranslate = useSharedValue(0);
  var iconRotate = useSharedValue(0);
  // Send button pulse is only active once a contact is selected.
  var sendScale = useSharedValue(1);

  useEffect(function () {
    loadContacts();

    cardScale.value = withRepeat(
      withSequence(
        withTiming(1.015, { duration: 1750, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1750, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    iconTranslate.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    iconRotate.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, []);

  // Start/stop the send-button pulse when `selected` flips.
  useEffect(function () {
    if (selected) {
      sendScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(sendScale);
      sendScale.value = withTiming(1, { duration: 180 });
    }
  }, [selected]);

  var cardAnimStyle = useAnimatedStyle(function () {
    return { transform: [{ scale: cardScale.value }] };
  });
  var iconAnimStyle = useAnimatedStyle(function () {
    return {
      transform: [
        { translateY: iconTranslate.value },
        { rotate: iconRotate.value + 'deg' },
      ],
    };
  });
  var sendAnimStyle = useAnimatedStyle(function () {
    return { transform: [{ scale: sendScale.value }] };
  });

  // If the signed-in user has no display_name yet, bounce to /login so the
  // name step runs. Runs on focus (not mount) so a fresh save in /login
  // immediately clears the gate when we come back — no stale state, no loop.
  useFocusEffect(
    useCallback(function () {
      var cancelled = false;
      supabase.auth.getSession().then(function (r) {
        var phone = r.data.session && r.data.session.user && r.data.session.user.phone;
        if (!phone || cancelled) return;
        supabase
          .from('users')
          .select('display_name')
          .eq('phone_number', phone)
          .maybeSingle()
          .then(function (res) {
            if (cancelled) return;
            if (!res.data || !res.data.display_name) {
              router.replace('/login');
            }
          });
      });
      return function () {
        cancelled = true;
      };
    }, [])
  );

  async function loadContacts() {
    var permission = await Contacts.requestPermissionsAsync();
    if (permission.status !== 'granted') return;

    var result = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      sort: Contacts.SortTypes.FirstName,
    });

    var parsed: ContactItem[] = [];
    for (var i = 0; i < result.data.length; i++) {
      var c = result.data[i];
      if (c.name && c.phoneNumbers && c.phoneNumbers.length > 0) {
        parsed.push({
          id: c.id || String(i),
          name: c.name,
          phone: c.phoneNumbers[0].number || '',
        });
      }
    }
    setContacts(parsed);
    setFiltered(parsed);
  }

  useEffect(function () {
    if (!search.trim()) {
      setFiltered(contacts);
    } else {
      var lower = search.toLowerCase();
      setFiltered(
        contacts.filter(function (c) {
          return c.name.toLowerCase().indexOf(lower) !== -1;
        })
      );
    }
  }, [search, contacts]);

  var selectedContact = contacts.find(function (c) {
    return c.id === selected;
  });

  async function handleSend() {
    if (!selectedContact) return;
    setLoading(true);
    try {
      var result = await sendQuestion({
        recipientPhone: selectedContact.phone,
        recipientName: selectedContact.name,
      });
      if (result.success) {
        router.push('/sent');
      } else if (!result.cancelled) {
        Alert.alert('Error', 'Could not open SMS composer');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    }
    setLoading(false);
  }

  function renderContact(item: { item: ContactItem }) {
    return (
      <ContactRow
        contact={item.item}
        isSelected={selected === item.item.id}
        onSelect={setSelected}
      />
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
      <Header
        leftIcon={
          <TouchableOpacity
            onPress={function () {
              Alert.alert(
                'Log out?',
                'You can sign back in with the same phone number anytime.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Log out',
                    style: 'destructive',
                    onPress: async function () {
                      await supabase.auth.signOut();
                    },
                  },
                ]
              );
            }}
            activeOpacity={0.7}
            style={styles.logoutBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.logoutIcon}>⋯</Text>
          </TouchableOpacity>
        }
        rightIcon={
          <TouchableOpacity
            onPress={function () {
              router.push('/receipts');
            }}
            activeOpacity={0.7}
            style={styles.receiptsBtn}
          >
            <Text style={styles.receiptsIcon}>🧾</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* Question card */}
        <Animated.View
          entering={FadeInDown.duration(FADE_DURATION)}
          style={[styles.questionCard, cardAnimStyle]}
        >
          <View style={styles.questionCardInner}>
            <Text style={styles.askLabel}>ASK</Text>
            <Text style={styles.questionText}>"what are we?"</Text>
          </View>
          <Animated.Text style={[styles.chatIcon, iconAnimStyle]}>💬</Animated.Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(FADE_DURATION).delay(STAGGER / 2)}
          style={styles.cyclingSubtitleWrap}
        >
          <CyclingSubtitle />
        </Animated.View>

        {/* Search bar */}
        <Animated.View
          entering={FadeInDown.duration(FADE_DURATION).delay(STAGGER)}
          style={styles.searchBar}
        >
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor={Colors.textOnGradientMuted}
            value={search}
            onChangeText={setSearch}
          />
        </Animated.View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Contact list */}
        <Animated.View
          entering={FadeInDown.duration(FADE_DURATION).delay(STAGGER * 2)}
          style={styles.list}
        >
          <FlatList
            data={filtered}
            keyExtractor={function (item) {
              return item.id;
            }}
            renderItem={renderContact}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>

        {/* Send button */}
        <Animated.View
          entering={FadeInDown.duration(FADE_DURATION).delay(STAGGER * 3)}
          style={[{ paddingBottom: insets.bottom + 12 }, sendAnimStyle]}
        >
          <TouchableOpacity
            style={[
              styles.sendButton,
              !selectedContact && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!selectedContact || loading}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.sendButtonText,
                !selectedContact && styles.sendButtonTextDisabled,
              ]}
            >
              {selectedContact
                ? 'Ask ' + selectedContact.name + ' \u2192'
                : 'Select a contact'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </LinearGradient>
  );
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 27,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionCardInner: {
    flex: 1,
  },
  askLabel: {
    fontSize: 12,
    fontFamily: Fonts.uiBold,
    color: Colors.textOnGradientMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  chatIcon: {
    fontSize: 24,
    marginLeft: 12,
  },
  cyclingSubtitleWrap: {
    marginTop: 8,
    alignItems: 'center',
  },
  cyclingSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.brand,
    fontStyle: 'italic',
    color: Colors.textOnGradientMuted,
    textAlign: 'center',
  },
  receiptsBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  receiptsIcon: {
    fontSize: 22,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logoutIcon: {
    fontSize: 28,
    color: Colors.textOnGradient,
    fontFamily: Fonts.uiBold,
    marginTop: -6,
  },
  questionText: {
    fontSize: 21,
    fontFamily: Fonts.brandBold,
    fontStyle: 'italic',
    color: Colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.frostedBorder,
    marginVertical: 16,
  },
  list: {
    flex: 1,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  contactName: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.ui,
    color: Colors.textOnGradient,
  },
  contactNameSelected: {
    color: Colors.white,
    fontFamily: Fonts.uiBold,
  },
  contactRowSelected: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  searchBar: {
    backgroundColor: Colors.frosted,
    borderWidth: 1,
    borderColor: Colors.frostedBorder,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Fonts.ui,
    color: Colors.white,
  },
  sendButton: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 16,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.frosted,
    borderWidth: 1,
    borderColor: Colors.frostedBorder,
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 17,
    fontFamily: Fonts.uiBold,
    color: Colors.primary,
  },
  sendButtonTextDisabled: {
    color: Colors.textOnGradientMuted,
  },
});
