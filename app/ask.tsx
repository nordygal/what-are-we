import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Contacts from 'expo-contacts';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../lib/constants';
import { sendQuestion } from '../lib/sms';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import Avatar from '../components/Avatar';

interface ContactItem {
  id: string;
  name: string;
  phone: string;
}

export default function AskScreen() {
  var insets = useSafeAreaInsets();
  var router = useRouter();
  var [contacts, setContacts] = useState<ContactItem[]>([]);
  var [filtered, setFiltered] = useState<ContactItem[]>([]);
  var [search, setSearch] = useState('');
  var [selected, setSelected] = useState<string | null>(null);
  var [loading, setLoading] = useState(false);

  useEffect(function () {
    loadContacts();
  }, []);

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
    var contact = item.item;
    var isSelected = selected === contact.id;
    return (
      <TouchableOpacity
        style={[styles.contactRow, isSelected && styles.contactRowSelected]}
        onPress={function () {
          setSelected(contact.id);
        }}
        activeOpacity={0.7}
      >
        <Avatar name={contact.name} size={44} />
        <Text style={[styles.contactName, isSelected && styles.contactNameSelected]}>
          {contact.name}
        </Text>
      </TouchableOpacity>
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
        <View style={styles.questionCard}>
          <View style={styles.questionCardInner}>
            <Text style={styles.askLabel}>ASK</Text>
            <Text style={styles.questionText}>"what are we?"</Text>
          </View>
          <Text style={styles.chatIcon}>💬</Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor={Colors.textOnGradientMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Contact list */}
        <FlatList
          data={filtered}
          keyExtractor={function (item) {
            return item.id;
          }}
          renderItem={renderContact}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />

        {/* Send button */}
        <View style={{ paddingBottom: insets.bottom + 12 }}>
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
        </View>

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
