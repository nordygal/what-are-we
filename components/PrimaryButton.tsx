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
  variant?: 'filled' | 'outlined';
}

export default function PrimaryButton(props: PrimaryButtonProps) {
  var variant = props.variant || 'filled';
  var isFilled = variant === 'filled';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isFilled ? styles.filled : styles.outlined,
        props.disabled && styles.disabled,
      ]}
      onPress={props.onPress}
      disabled={props.disabled || props.loading}
      activeOpacity={0.8}
    >
      {props.loading ? (
        <ActivityIndicator color={isFilled ? Colors.white : Colors.primary} />
      ) : (
        <Text
          style={[
            styles.text,
            isFilled ? styles.filledText : styles.outlinedText,
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
    backgroundColor: Colors.primary,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  disabled: {
    backgroundColor: Colors.disabled,
    borderColor: Colors.disabled,
  },
  text: {
    fontSize: 17,
    fontFamily: Fonts.uiBold,
  },
  filledText: {
    color: Colors.white,
  },
  outlinedText: {
    color: Colors.primary,
  },
  disabledText: {
    color: Colors.white,
  },
});
