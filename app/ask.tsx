import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../lib/constants';
import { supabase, getOrCreateUser, createQuestion } from '../lib/supabase';
import { sendQuestion } from '../lib/sms';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import PrimaryButton from '../components/PrimaryButton';

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
  var [selected, setSelected] = useState<ContactItem | null>(null);
  var [loading, setLoading] = useState(false);

  useEffect(function () {
    loadContacts();
  }, []);

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

  async function loadContacts() {
    var permission = await Contacts.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(
        'Contacts Required',
        'Please grant contacts access to send questions.'
      );
      return;
    }

    var result = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      sort: Contacts.SortTypes.FirstName,
    });

    var items: ContactItem[] = [];
    for (var i = 0; i < result.data.length; i++) {
      var contact = result.data[i];
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0 && contact.name) {
        items.push({
          id: contact.id || String(i),
          name: contact.name,
          phone: contact.phoneNumbers[0].number || '',
        });
      }
    }

    setContacts(items);
    setFiltered(items);
  }

  async function handleSend() {
    if (!selected) return;
    setLoading(true);

    try {
      var smsResult = await sendQuestion({
        recipientPhone: selected.phone,
        recipientName: selected.name,
      });

      if (smsResult.success) {
        // Save question to Supabase
        var sessionResult = await supabase.auth.getSession();
        var phone = sessionResult.data.session?.user?.phone;
        if (phone) {
          var user = await getOrCreateUser(phone);
          if (user) {
            await createQuestion(user.id, selected.phone, smsResult.deepLinkId);
          }
        }

        setSelected(null);
        router.push('/sent');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to send question');
    }

    setLoading(false);
  }

  function renderContact(item: { item: ContactItem }) {
    var contact = item.item;
    var isSelected = selected && selected.id === contact.id;

    return (
      <TouchableOpacity
        style={[styles.contactRow, isSelected && styles.contactSelected]}
        onPress={function () {
          setSelected(contact);
        }}
        activeOpacity={0.7}
      >
        <Avatar name={contact.name} size={44} />
        <Text
          style={[styles.contactName, isSelected && styles.contactNameSelected]}
        >
          {contact.name}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.questionCard}>
        <Text style={styles.questionText}>what are we? 💬</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor={Colors.gray}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={function (item) {
          return item.id;
        }}
        renderItem={renderContact}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <PrimaryButton
          title={
            selected ? 'Send to ' + selected.name + ' ✈' : 'Select a contact'
          }
          onPress={handleSend}
          disabled={!selected}
          loading={loading}
        />
      </View>
    </View>
  );
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  questionCard: {
    backgroundColor: Colors.cream,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  questionText: {
    fontSize: 20,
    fontFamily: Fonts.brandBold,
    color: Colors.dark,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: Fonts.ui,
    color: Colors.dark,
    borderWidth: 1,
    borderColor: Colors.sand,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
    marginBottom: 2,
  },
  contactSelected: {
    backgroundColor: Colors.cream,
  },
  contactName: {
    fontSize: 16,
    fontFamily: Fonts.ui,
    color: Colors.dark,
  },
  contactNameSelected: {
    fontFamily: Fonts.uiBold,
    color: Colors.primaryDark,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.sand,
    backgroundColor: Colors.warmWhite,
  },
});
