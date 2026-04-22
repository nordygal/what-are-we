import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { FlatList, Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Fonts, AnswerKey, getAnswerDisplay } from '../lib/constants';
import { getMyReceipts, deleteReceipt } from '../lib/supabase';
import Header from '../components/Header';
import Avatar from '../components/Avatar';

var ROW_STAGGER = 70;  // ms between each row's fade-up
var ROW_FADE_DURATION = 450;
var ROW_MAX_STAGGER_INDEX = 8;  // cap so a long list doesn't drip in for seconds

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
  var openSwipeableRef = useRef<Swipeable | null>(null);

  async function load() {
    var result = await getMyReceipts();
    if (result.data) {
      setReceipts(result.data as Receipt[]);
    }
    setLoading(false);
    setRefreshing(false);
  }

  function confirmDelete(r: Receipt, swipeable: Swipeable | null) {
    Alert.alert(
      'Delete receipt?',
      'This removes the receipt for both of you.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: function () {
            if (swipeable) swipeable.close();
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async function () {
            if (swipeable) swipeable.close();
            var res = await deleteReceipt(r.deep_link_id);
            if (res.error || res.data === false) {
              Alert.alert('Error', "Couldn't delete that receipt.");
              return;
            }
            setReceipts(function (prev) {
              return prev.filter(function (x) { return x.id !== r.id; });
            });
          },
        },
      ]
    );
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

  function renderRow(item: { item: Receipt; index: number }) {
    var r = item.item;
    // Stagger the fade-up on mount. Cap the delay so long lists don't take
    // forever to settle; after N rows, everything arrives together.
    var staggerIndex = Math.min(item.index, ROW_MAX_STAGGER_INDEX);
    var delay = staggerIndex * ROW_STAGGER;
    var otherName =
      r.role === 'asker'
        ? r.recipient_display_name || 'recipient'
        : r.asker_display_name || 'Someone';
    var rolePrefix = r.role === 'asker' ? 'You asked' : 'Asked by';
    var answerDisplay = r.answer ? getAnswerDisplay(r.answer) : null;
    var pending = !r.answer;

    var swipeableRef: Swipeable | null = null;

    function renderRightActions() {
      return (
        <TouchableOpacity
          onPress={function () {
            confirmDelete(r, swipeableRef);
          }}
          activeOpacity={0.8}
          style={styles.deleteAction}
        >
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      );
    }

    return (
      <Animated.View
        entering={FadeInDown.duration(ROW_FADE_DURATION).delay(delay)}
      >
      <Swipeable
        ref={function (ref) {
          swipeableRef = ref;
        }}
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={2}
        rightThreshold={40}
        onSwipeableWillOpen={function () {
          if (openSwipeableRef.current && openSwipeableRef.current !== swipeableRef) {
            openSwipeableRef.current.close();
          }
          openSwipeableRef.current = swipeableRef;
        }}
      >
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
      </Swipeable>
      </Animated.View>
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
    paddingTop: 32,
    paddingBottom: 20,
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
  deleteAction: {
    backgroundColor: '#d0443c',
    justifyContent: 'center',
    alignItems: 'center',
    width: 88,
  },
  deleteActionText: {
    color: Colors.white,
    fontFamily: Fonts.uiBold,
    fontSize: 15,
  },
});
