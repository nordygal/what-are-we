import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, ANSWER_OPTIONS, AnswerKey } from '../lib/constants';

interface AnswerGridProps {
  selected: AnswerKey | null;
  onSelect: (key: AnswerKey) => void;
}

export default function AnswerGrid(props: AnswerGridProps) {
  var rows: Array<Array<typeof ANSWER_OPTIONS[0]>> = [];
  for (var i = 0; i < ANSWER_OPTIONS.length; i += 2) {
    rows.push(ANSWER_OPTIONS.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      {rows.map(function (row, rowIndex) {
        return (
          <View key={rowIndex} style={styles.row}>
            {row.map(function (option) {
              var isSelected = props.selected === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.pill, isSelected && styles.pillSelected]}
                  onPress={function () {
                    props.onSelect(option.key);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.label,
                      isSelected && styles.labelSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

var styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 25,
    backgroundColor: Colors.warmWhite,
    borderWidth: 1,
    borderColor: Colors.sand,
    gap: 6,
  },
  pillSelected: {
    backgroundColor: Colors.cream,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.ui,
    color: Colors.dark,
    flexShrink: 1,
  },
  labelSelected: {
    fontFamily: Fonts.uiBold,
    color: Colors.primaryDark,
  },
});
