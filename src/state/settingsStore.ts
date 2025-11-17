import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { saveSecret, getSecret } from '../utils/secureStorage';

export type LessonViewMode = 'single' | 'blocks' | 'summary';
export type CalendarProvider = 'google' | 'device';

export interface WebUntisConfig {
  baseUrl: string;
  school: string;
  username: string;
  elementId: number;
  elementType: number;
}

export interface GoogleConfig {
  clientId: string;
  calendarId: string;
}

export interface ExpoCalendarConfig {
  calendarId?: string;
}

export interface SettingsSnapshot {
  viewMode: LessonViewMode;
  futureDays: number;
  blockGapMinutes: number;
  includeBreaks: boolean;
  autoSyncEnabled: boolean;
  autoSyncTime: string;
  calendarProvider: CalendarProvider;
  googleConfig: GoogleConfig;
  expoCalendarConfig: ExpoCalendarConfig;
  webuntisConfig: WebUntisConfig;
  webuntisPassword?: string;
  googleRefreshToken?: string;
}

interface SettingsState extends SettingsSnapshot {
  secretsReady: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: 'success' | 'error';
  lastSyncMessage?: string;
  hydrateSecrets: () => Promise<void>;
  setViewMode: (mode: LessonViewMode) => void;
  setFutureDays: (days: number) => void;
  setBlockGap: (minutes: number) => void;
  setIncludeBreaks: (value: boolean) => void;
  setAutoSync: (enabled: boolean, time?: string) => void;
  setCalendarProvider: (provider: CalendarProvider) => void;
  setGoogleConfig: (config: Partial<GoogleConfig>) => void;
  setExpoCalendarConfig: (config: Partial<ExpoCalendarConfig>) => void;
  setWebUntisConfig: (config: Partial<WebUntisConfig> & { password?: string }) => Promise<void>;
  setGoogleRefreshToken: (token?: string) => Promise<void>;
  setSyncResult: (status: 'success' | 'error', message?: string) => void;
  clearSyncMeta: () => void;
}

const defaultWebUntisConfig: WebUntisConfig = {
  baseUrl: 'https://mese.webuntis.com',
  school: '',
  username: '',
  elementId: 0,
  elementType: 5
};

const defaultGoogleConfig: GoogleConfig = {
  clientId: '',
  calendarId: 'primary'
};

const defaultExpoCalendarConfig: ExpoCalendarConfig = {
  calendarId: undefined
};

const settingsStoreCreator: StateCreator<SettingsState> = (set, get) => ({
      viewMode: 'blocks',
      futureDays: 7,
      blockGapMinutes: 10,
      includeBreaks: true,
      autoSyncEnabled: true,
      autoSyncTime: '06:00',
      calendarProvider: 'google',
      googleConfig: { ...defaultGoogleConfig },
      expoCalendarConfig: { ...defaultExpoCalendarConfig },
      webuntisConfig: { ...defaultWebUntisConfig },
      secretsReady: false,
      webuntisPassword: undefined,
      googleRefreshToken: undefined,
      lastSyncAt: undefined,
      lastSyncStatus: undefined,
      lastSyncMessage: undefined,
      async hydrateSecrets() {
        const [password, token] = await Promise.all([
          getSecret('webuntisPassword'),
          getSecret('googleRefreshToken')
        ]);
        set({
          webuntisPassword: password ?? undefined,
          googleRefreshToken: token ?? undefined,
          secretsReady: true
        });
      },
      setViewMode: (mode: LessonViewMode) => set({ viewMode: mode }),
      setFutureDays: (days: number) => set({ futureDays: Math.min(Math.max(days, 1), 30) }),
      setBlockGap: (minutes: number) => set({ blockGapMinutes: Math.min(Math.max(minutes, 1), 60) }),
      setIncludeBreaks: (value: boolean) => set({ includeBreaks: value }),
      setAutoSync: (enabled: boolean, time?: string) =>
        set({
          autoSyncEnabled: enabled,
          autoSyncTime: time ?? get().autoSyncTime
        }),
      setCalendarProvider: (provider: CalendarProvider) => set({ calendarProvider: provider }),
      setGoogleConfig: (config: Partial<GoogleConfig>) =>
        set({
          googleConfig: { ...get().googleConfig, ...config }
        }),
      setExpoCalendarConfig: (config: Partial<ExpoCalendarConfig>) =>
        set({
          expoCalendarConfig: { ...get().expoCalendarConfig, ...config }
        }),
      setWebUntisConfig: async (config: Partial<WebUntisConfig> & { password?: string }) => {
        const next = { ...get().webuntisConfig, ...config };
        if (typeof config.password === 'string') {
          await saveSecret('webuntisPassword', config.password);
          set({ webuntisPassword: config.password });
        }
        set({ webuntisConfig: next });
      },
      setGoogleRefreshToken: async (token?: string) => {
        await saveSecret('googleRefreshToken', token);
        set({ googleRefreshToken: token });
      },
      setSyncResult: (status: 'success' | 'error', message?: string) =>
        set({
          lastSyncAt: new Date().toISOString(),
          lastSyncStatus: status,
          lastSyncMessage: message
        }),
      clearSyncMeta: () => set({ lastSyncAt: undefined, lastSyncStatus: undefined, lastSyncMessage: undefined })
    });

export const useSettingsStore = create<SettingsState>()(
  persist(settingsStoreCreator, {
    name: 'webuntis-settings-store',
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (state: SettingsState) => ({
      viewMode: state.viewMode,
      futureDays: state.futureDays,
      blockGapMinutes: state.blockGapMinutes,
      includeBreaks: state.includeBreaks,
      autoSyncEnabled: state.autoSyncEnabled,
      autoSyncTime: state.autoSyncTime,
      calendarProvider: state.calendarProvider,
      googleConfig: state.googleConfig,
      expoCalendarConfig: state.expoCalendarConfig,
      webuntisConfig: state.webuntisConfig
    }),
    onRehydrateStorage: () => (state?: SettingsState, error?: unknown) => {
      if (!error) {
        state?.hydrateSecrets?.();
      }
    }
  })
);

export const getSettingsSnapshot = () => useSettingsStore.getState();

export async function getSettingsWithSecrets() {
  const state = useSettingsStore.getState();
  if (!state.secretsReady) {
    await state.hydrateSecrets();
  }
  return useSettingsStore.getState();
}
