import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, AnswerKey, getAnswerDisplay } from '../lib/constants';
import { getMyReceipts } from '../lib/supabase';
import Header from '../components/Header';
import Avatar from '../components/Avatar';

interface Receipt {
  id: string;
  deep_link_id: string;
  asker_id: string;
  recipient_id: string | null;
  answer: AnswerKey | null;
  status: string;
  sent_at: string;
  answered_at: string | null;
  asker_display_name: string | null;
  recipient_display_name: string | null;
  receipt_number: number | null;
  role: 'asker' | 'recipient';
}

export default function ReceiptsScreen() {
  var router = useRouter();
  var insets = useSafeAreaInsets();
  var [receipts, setReceipts] = useState<Receipt[]>([]);
  var [loading, setLoading] = useState(true);
  var [refreshing, setRefreshing] = useState(false);

  async function load() {
    var result = await getMyReceipts();
    if (result.data) {
      setReceipts(result.data as Receipt[]);
    }
    setLoading(false);
    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(function () {
      load();
    }, [])
  );

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  function formatDate(iso: string): string {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return '';
    }
  }

  function renderRow(item: { item: Receipt }) {
    var r = item.item;
    var otherName =
      r.role === 'asker'
        ? r.recipient_display_name || 'recipient'
        : r.asker_display_name || 'Someone';
    var rolePrefix = r.role === 'asker' ? 'You asked' : 'Asked by';
    var answerDisplay = r.answer ? getAnswerDisplay(r.answer) : null;
    var pending = !r.answer;

    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={function () {
          if (pending) return;
          router.push('/reveal/' + r.deep_link_id);
        }}
      >
        <Avatar name={otherName} size={44} />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>
            {rolePrefix} <Text style={styles.rowName}>{otherName}</Text>
          </Text>
          <Text style={styles.rowAnswer}>
            {pending
              ? 'waiting for answer...'
              : answerDisplay
              ? answerDisplay.label + ' ' + answerDisplay.emoji
              : String(r.answer)}
          </Text>
        </View>
        <View style={styles.rowMeta}>
          <Text style={styles.rowDate}>
            {formatDate(r.answered_at || r.sent_at)}
          </Text>
          <Text style={styles.rowReceipt}>
            {r.receipt_number
              ? '#' + String(r.receipt_number).padStart(5, '0')
              : '#00000'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  var backButton = (
    <TouchableOpacity
      onPress={function () {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/ask');
        }
      }}
      activeOpacity={0.7}
      style={styles.backBtn}
    >
      <Text style={styles.backBtnText}>←</Text>
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
      <View style={styles.headerWrap}>
        <View style={[styles.headerLeft, { top: insets.top + 18 }]}>
          {backButton}
        </View>
        <Header />
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.title}>Receipts</Text>
        <Text style={styles.subtitle}>every "what are we?" you've been part of</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.white} />
        </View>
      ) : receipts.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No receipts yet</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={function () {
              router.replace('/ask');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyButtonText}>Ask someone →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={receipts}
          keyExtractor={function (item) {
            return item.id;
          }}
          renderItem={renderRow}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 24,
          }}
          ItemSeparatorComponent={function () {
            return <View style={styles.sep} />;
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.white}
            />
          }
        />
      )}
    </LinearGradient>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: { position: 'relative' },
  headerLeft: {
    position: 'absolute',
    left: 16,
    zIndex: 2,
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
  titleWrap: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.brandBold,
    color: Colors.textOnGradient,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts.ui,
    fontStyle: 'italic',
    color: Colors.textOnGradientMuted,
    marginTop: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.uiBold,
    color: Colors.textOnGradient,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: Colors.white,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  emptyButtonText: {
    fontSize: 16,
    fontFamily: Fonts.uiBold,
    color: Colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowBody: {
    flex: 1,
    marginLeft: 12,
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: Fonts.ui,
    color: Colors.textOnGradientMuted,
  },
  rowName: {
    fontFamily: Fonts.uiBold,
    color: Colors.textOnGradient,
  },
  rowAnswer: {
    fontSize: 16,
    fontFamily: Fonts.brandBold,
    color: Colors.white,
    marginTop: 2,
  },
  rowMeta: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  rowDate: {
    fontSize: 12,
    fontFamily: Fonts.ui,
    color: Colors.textOnGradientMuted,
  },
  rowReceipt: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.textOnGradientMuted,
    marginTop: 2,
  },
  sep: {
    height: 1,
    backgroundColor: Colors.frostedBorder,
  },
});
