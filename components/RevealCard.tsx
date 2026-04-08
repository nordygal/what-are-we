import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, AnswerKey, getAnswerDisplay } from '../lib/constants';
import Avatar from './Avatar';

interface RevealCardProps {
  name: string;
  answer: AnswerKey;
  timestamp: string;
}

var RevealCard = React.forwardRef(function RevealCardInner(
  props: RevealCardProps,
  ref: React.Ref<View>
) {
  var display = getAnswerDisplay(props.answer);

  var formattedDate = '';
  try {
    var d = new Date(props.timestamp);
    formattedDate = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) + ' · ' + d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (e) {
    formattedDate = props.timestamp;
  }

  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      <Avatar name={props.name} size={72} />
      <View style={styles.answerBubble}>
        <Text style={styles.answerText}>
          {display ? display.label + ' ' + display.emoji : props.answer}
        </Text>
      </View>
      <Text style={styles.timestamp}>{formattedDate}</Text>
      <Text style={styles.watermark}>what are we?™</Text>
    </View>
  );
});

export default RevealCard;

var styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.warmWhite,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  answerBubble: {
    backgroundColor: Colors.cream,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
  answerText: {
    fontSize: 24,
    fontFamily: Fonts.brandBold,
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  timestamp: {
    fontSize: 13,
    fontFamily: Fonts.ui,
    color: Colors.gray,
  },
  watermark: {
    fontSize: 12,
    fontFamily: Fonts.brand,
    color: Colors.sand,
    marginTop: 8,
  },
});
