import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../lib/constants';

interface AvatarProps {
  name: string;
  size?: number;
}

export default function Avatar(props: AvatarProps) {
  var size = props.size || 48;
  var initial = props.name ? props.name.charAt(0).toUpperCase() : '?';
  var fontSize = size * 0.4;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.initial, { fontSize: fontSize }]}>{initial}</Text>
    </View>
  );
}

var styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: Colors.white,
    fontFamily: Fonts.brandBold,
  },
});
