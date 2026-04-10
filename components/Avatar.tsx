import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, getAvatarColor } from '../lib/constants';

interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
}

export default function Avatar(props: AvatarProps) {
  var size = props.size || 48;
  var initial = props.name ? props.name.charAt(0).toUpperCase() : '?';
  var fontSize = size * 0.4;
  var bgColor = props.color || getAvatarColor(props.name);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text style={[styles.initial, { fontSize: fontSize }]}>{initial}</Text>
    </View>
  );
}

var styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: Colors.white,
    fontFamily: Fonts.brandBold,
  },
});
