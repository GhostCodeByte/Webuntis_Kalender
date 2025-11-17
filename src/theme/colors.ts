export const palette = {
  sand: '#F6F1EB',
  clay: '#D8C7B3',
  terracotta: '#B5835A',
  coffee: '#3F2F2B',
  moss: '#4C956C',
  ember: '#C44536',
  accent: '#F1B67F'
};

export const theme = {
  background: palette.sand,
  card: '#FFFFFFEE',
  text: '#2C1F1A',
  mutedText: '#5C4F45',
  border: '#E4D8C9',
  primary: palette.terracotta,
  primarySoft: '#E7C9B5',
  success: palette.moss,
  danger: palette.ember,
  accent: palette.accent
};

export type Theme = typeof theme;
