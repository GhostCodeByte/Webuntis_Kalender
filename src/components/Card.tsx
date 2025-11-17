import React, { type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';

interface CardProps {
  children: ReactNode;
}

export function Card({ children }: CardProps) {
  const palette = useTheme();
  return <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1
  }
});
