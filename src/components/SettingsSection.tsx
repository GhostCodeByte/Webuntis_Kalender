import React, { type ReactNode } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  const palette = useTheme();
  return (
    <View style={[styles.wrapper, { backgroundColor: palette.card, borderColor: palette.border }]}> 
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: palette.mutedText }]}>{description}</Text> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '600'
  },
  description: {
    marginTop: 4,
    fontSize: 13
  },
  content: {
    marginTop: 16,
    gap: 12
  }
});
