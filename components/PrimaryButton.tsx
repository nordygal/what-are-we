import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors, Fonts } from '../lib/constants';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'filled' | 'outlined' | 'frosted';
}

export default function PrimaryButton(props: PrimaryButtonProps) {
  var variant = props.variant || 'filled';

  var buttonStyle = variant === 'frosted'
    ? styles.frosted
    : variant === 'outlined'
    ? styles.outlined
    : styles.filled;

  var textColor = variant === 'filled'
    ? Colors.primary
    : variant === 'frosted'
    ? Colors.textOnGradient
    : Colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyle,
        props.disabled && styles.disabled,
      ]}
      onPress={props.onPress}
      disabled={props.disabled || props.loading}
      activeOpacity={0.8}
    >
      {props.loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: textColor },
            props.disabled && styles.disabledText,
          ]}
        >
          {props.title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

var styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  filled: {
    backgroundColor: Colors.white,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  frosted: {
    backgroundColor: Colors.frosted,
    borderWidth: 1,
    borderColor: Colors.frostedBorder,
  },
  disabled: {
    backgroundColor: Colors.frosted,
    borderColor: Colors.frostedBorder,
    opacity: 0.5,
  },
  text: {
    fontSize: 17,
    fontFamily: Fonts.uiBold,
  },
  disabledText: {
    color: Colors.textOnGradientMuted,
  },
});
