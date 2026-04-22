import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Colors, Fonts, ANSWER_OPTIONS, AnswerKey, AnswerOption } from '../lib/constants';

interface AnswerGridProps {
  selected: AnswerKey | null;
  onSelect: (key: AnswerKey) => void;
}

// Interval between ghost-tap highlights rotating across the grid.
var GHOST_INTERVAL = 1600;

// One tile; owns its press-scale + ghost-highlight animations locally so a
// tap on one row doesn't ripple to others.
function AnswerTile(props: {
  option: AnswerOption;
  isSelected: boolean;
  isGhost: boolean;
  onSelect: (key: AnswerKey) => void;
}) {
  var pressScale = useSharedValue(1);
  var ghostScale = useSharedValue(1);
  var ghostBorder = useSharedValue(0);

  // When this tile becomes the "ghost" (the one demoing the tap micro-
  // interaction), play a quick scale + border-glow pulse. When ghost goes
  // false, it naturally rests at 1.
  useEffect(function () {
    if (!props.isGhost) return;
    ghostScale.value = withSequence(
      withTiming(1.08, { duration: 160, easing: Easing.out(Easing.quad) }),
      withTiming(1.02, { duration: 200, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 260, easing: Easing.inOut(Easing.quad) })
    );
    ghostBorder.value = withSequence(
      withTiming(1, { duration: 160 }),
      withTiming(0, { duration: 460 })
    );
  }, [props.isGhost]);

  var animatedStyle = useAnimatedStyle(function () {
    return {
      transform: [{ scale: pressScale.value * ghostScale.value }],
    };
  });

  var animatedBorderStyle = useAnimatedStyle(function () {
    // When ghostBorder is 0, fall back to whatever the selected/unselected
    // base style says. When > 0, overlay a stronger white border to hint at
    // the tap state.
    var g = ghostBorder.value;
    if (g === 0) return {};
    return {
      borderColor:
        'rgba(255,255,255,' + (0.4 + g * 0.4).toFixed(3) + ')',
      backgroundColor:
        'rgba(255,255,255,' + (0.14 + g * 0.14).toFixed(3) + ')',
    };
  });

  function handlePressIn() {
    pressScale.value = withSpring(0.96, { mass: 0.5, damping: 12, stiffness: 250 });
  }
  function handlePressOut() {
    pressScale.value = withSpring(1, { mass: 0.5, damping: 12, stiffness: 200 });
  }

  return (
    <Animated.View style={[styles.pillWrap, animatedStyle]}>
      <Pressable
        onPress={function () {
          props.onSelect(props.option.key);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pillPressable}
      >
        <Animated.View
          style={[
            styles.pill,
            props.isSelected && styles.pillSelected,
            animatedBorderStyle,
          ]}
        >
          <Text style={styles.emoji}>{props.option.emoji}</Text>
          <Text
            style={[styles.label, props.isSelected && styles.labelSelected]}
            numberOfLines={2}
          >
            {props.option.label}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function AnswerGrid(props: AnswerGridProps) {
  var rows: Array<Array<AnswerOption>> = [];
  for (var i = 0; i < ANSWER_OPTIONS.length; i += 2) {
    rows.push(ANSWER_OPTIONS.slice(i, i + 2));
  }

  // Rotate the ghost-tap highlight through every tile. Pauses as soon as the
  // user picks a real answer so the demo doesn't fight with their selection.
  var [ghostIndex, setGhostIndex] = useState<number>(-1);

  useEffect(function () {
    if (props.selected !== null) {
      setGhostIndex(-1);
      return;
    }
    // Kick off with a short initial delay so the screen's mount-stagger has
    // time to finish before the first highlight fires.
    // Initial delay so the screen's mount-stagger finishes first; after that
    // the ghost hops to the next tile on a steady cadence. Each tile's
    // useEffect watches its own isGhost — the false→true transition is what
    // fires the tap animation, so the ghost just needs to advance; no need
    // to blank it out between steps.
    var initial = setTimeout(function () {
      setGhostIndex(0);
    }, 900);
    var interval = setInterval(function () {
      setGhostIndex(function (prev) {
        return (prev + 1) % ANSWER_OPTIONS.length;
      });
    }, GHOST_INTERVAL);
    return function () {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [props.selected]);

  return (
    <View style={styles.container}>
      {rows.map(function (row, rowIndex) {
        return (
          <View key={rowIndex} style={styles.row}>
            {row.map(function (option, colIndex) {
              var flatIndex = rowIndex * 2 + colIndex;
              return (
                <AnswerTile
                  key={option.key}
                  option={option}
                  isSelected={props.selected === option.key}
                  isGhost={ghostIndex === flatIndex && props.selected === null}
                  onSelect={props.onSelect}
                />
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
  pillWrap: {
    flex: 1,
  },
  pillPressable: {
    flex: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.frosted,
    borderWidth: 1,
    borderColor: Colors.frostedBorder,
    gap: 8,
  },
  pillSelected: {
    backgroundColor: 'rgba(255,255,255,0.30)',
    borderColor: 'rgba(255,255,255,0.40)',
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.uiBold,
    color: Colors.textOnGradient,
    flexShrink: 1,
  },
  labelSelected: {
    color: Colors.white,
  },
});
