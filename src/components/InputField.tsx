import React from 'react';
import { TextInput, Text, View, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';

interface InputFieldProps extends TextInputProps {
  label: string;
  hint?: string;
}

export function InputField({ label, hint, ...props }: InputFieldProps) {
  const palette = useTheme();
  return (
    <View>
      <Text style={[styles.label, { color: palette.mutedText }]}>{label}</Text>
      <TextInput
        placeholderTextColor={palette.mutedText}
        style={[styles.input, { borderColor: palette.border, color: palette.text }]}
        {...props}
      />
      {hint ? <Text style={[styles.hint, { color: palette.mutedText }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '500'
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15
  },
  hint: {
    fontSize: 12,
    marginTop: 4
  }
});
