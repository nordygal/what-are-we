import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../lib/constants';

export default function Header() {
  var insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientEnd]}
      style={[styles.container, { paddingTop: insets.top + 12 }]}
    >
      <Text style={styles.brand}>what are we?™</Text>
    </LinearGradient>
  );
}

var styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
    alignItems: 'center',
  },
  brand: {
    fontSize: 24,
    fontFamily: Fonts.brandBold,
    color: Colors.white,
  },
});
