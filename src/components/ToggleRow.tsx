import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}

export function ToggleRow({ label, value, onChange, description }: ToggleRowProps) {
  const palette = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
        {description ? <Text style={[styles.description, { color: palette.mutedText }]}>{description}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} thumbColor="#fff" trackColor={{ false: palette.border, true: palette.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  copy: {
    flex: 1,
    marginRight: 12
  },
  label: {
    fontSize: 15,
    fontWeight: '500'
  },
  description: {
    fontSize: 12,
    marginTop: 2
  }
});
