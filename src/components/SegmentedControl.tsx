import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';

interface SegmentedControlProps<T extends string> {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ value, options, onChange }: SegmentedControlProps<T>) {
  const palette = useTheme();
  return (
    <View style={[styles.wrapper, { borderColor: palette.border }]}> 
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: palette.primary }]}
          >
            <Text style={[styles.label, { color: selected ? '#fff' : palette.text }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 999,
    padding: 2
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center'
  },
  label: {
    fontSize: 13,
    fontWeight: '600'
  }
});
