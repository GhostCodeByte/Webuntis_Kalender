import React, { createContext, useContext, type ReactNode } from 'react';
import { theme, type Theme } from '../theme/colors';

const ThemeContext = createContext<Theme>(theme);

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
