import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../lib/constants';

interface HeaderProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Header(props: HeaderProps) {
  var insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.inner}>
        <View style={styles.leftSlot}>
          {props.leftIcon ? props.leftIcon : null}
        </View>
        <Text style={styles.brand}>are we<Text style={styles.tm}>™</Text></Text>
        <View style={styles.spacer}>
          {props.rightIcon ? props.rightIcon : null}
        </View>
      </View>
    </View>
  );
}

var styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  spacer: {
    width: 40,
    alignItems: 'flex-end',
  },
  leftSlot: {
    width: 40,
    alignItems: 'flex-start',
  },
  brand: {
    flex: 1,
    textAlign: 'center',
    fontSize: 26,
    fontFamily: Fonts.brand,
    color: Colors.textOnGradient,
  },
  tm: {
    fontSize: 10,
    position: 'relative',
    top: -14,
  },
});
