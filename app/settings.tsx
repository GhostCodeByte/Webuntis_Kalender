import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Text, Alert, StyleSheet } from 'react-native';
import { useTheme } from '../src/providers/ThemeProvider';
import { SettingsSection } from '../src/components/SettingsSection';
import { InputField } from '../src/components/InputField';
import { ToggleRow } from '../src/components/ToggleRow';
import { SegmentedControl } from '../src/components/SegmentedControl';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { useSettingsStore, type LessonViewMode } from '../src/state/settingsStore';
import { startGoogleAuthFlow } from '../src/api/googleCalendar';

export default function SettingsScreen() {
  const palette = useTheme();
  const webuntisConfig = useSettingsStore((state) => state.webuntisConfig);
  const setWebUntisConfig = useSettingsStore((state) => state.setWebUntisConfig);
  const setViewMode = useSettingsStore((state) => state.setViewMode);
  const viewMode = useSettingsStore((state) => state.viewMode);
  const futureDays = useSettingsStore((state) => state.futureDays);
  const setFutureDays = useSettingsStore((state) => state.setFutureDays);
  const blockGapMinutes = useSettingsStore((state) => state.blockGapMinutes);
  const setBlockGap = useSettingsStore((state) => state.setBlockGap);
  const includeBreaks = useSettingsStore((state) => state.includeBreaks);
  const setIncludeBreaks = useSettingsStore((state) => state.setIncludeBreaks);
  const autoSyncEnabled = useSettingsStore((state) => state.autoSyncEnabled);
  const autoSyncTime = useSettingsStore((state) => state.autoSyncTime);
  const setAutoSync = useSettingsStore((state) => state.setAutoSync);
  const googleConfig = useSettingsStore((state) => state.googleConfig);
  const setGoogleConfig = useSettingsStore((state) => state.setGoogleConfig);
  const googleRefreshToken = useSettingsStore((state) => state.googleRefreshToken);
  const setGoogleRefreshToken = useSettingsStore((state) => state.setGoogleRefreshToken);
  const webuntisPassword = useSettingsStore((state) => state.webuntisPassword);

  const [passwordInput, setPasswordInput] = useState(webuntisPassword ?? '');
  useEffect(() => {
    setPasswordInput(webuntisPassword ?? '');
  }, [webuntisPassword]);

  const handlePasswordBlur = useCallback(() => {
    void setWebUntisConfig({ password: passwordInput });
  }, [passwordInput, setWebUntisConfig]);

  const handleGoogleConnect = useCallback(async () => {
    try {
      const tokens = await startGoogleAuthFlow({ clientId: googleConfig.clientId });
      if (tokens.refreshToken) {
        await setGoogleRefreshToken(tokens.refreshToken);
        Alert.alert('Erfolg', 'Google Kalender verbunden.');
      } else {
        Alert.alert('Hinweis', 'Google hat kein Refresh Token geliefert. Bitte prüfe deinen OAuth Client.');
      }
    } catch (error) {
      Alert.alert('Google Anmeldung fehlgeschlagen', error instanceof Error ? error.message : 'Unbekannter Fehler');
    }
  }, [googleConfig.clientId, setGoogleRefreshToken]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.heading, { color: palette.text }]}>Einstellungen</Text>
      <Text style={[styles.subtitle, { color: palette.mutedText }]}>Passe deine Datenquellen und Automationen an.</Text>

      <SettingsSection title="WebUntis" description="Login & Filter für deine persönlichen Stunden.">
        <InputField label="Basis URL" value={webuntisConfig.baseUrl} onChangeText={(text: string) => void setWebUntisConfig({ baseUrl: text })} autoCapitalize="none" />
        <InputField label="Schul-Kürzel" value={webuntisConfig.school} onChangeText={(text: string) => void setWebUntisConfig({ school: text })} autoCapitalize="none" />
        <InputField label="Benutzername" value={webuntisConfig.username} onChangeText={(text: string) => void setWebUntisConfig({ username: text })} autoCapitalize="none" />
        <InputField
          label="Passwort"
          value={passwordInput}
          onChangeText={setPasswordInput}
          secureTextEntry
          onBlur={handlePasswordBlur}
        />
        <InputField
          label="Element ID"
          keyboardType="numeric"
          value={String(webuntisConfig.elementId || '')}
          onChangeText={(text: string) => void setWebUntisConfig({ elementId: Number(text) })}
        />
        <InputField
          label="Element Typ"
          keyboardType="numeric"
          value={String(webuntisConfig.elementType)}
          onChangeText={(text: string) => void setWebUntisConfig({ elementType: Number(text) })}
          hint="5 = Schüler, 2 = Lehrer, 1 = Klasse"
        />
      </SettingsSection>

      <SettingsSection title="Anzeige" description="Steuere wie deine Stunden gruppiert werden.">
        <SegmentedControl<LessonViewMode>
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: 'single', label: 'Einzeln' },
            { value: 'blocks', label: 'Blöcke' },
            { value: 'summary', label: 'Tagesüberblick' }
          ]}
        />
        <InputField
          label="Tage in die Zukunft"
          keyboardType="numeric"
          value={String(futureDays)}
          onChangeText={(text: string) => setFutureDays(Number(text) || 1)}
        />
        <InputField
          label="Block-Lücke (Minuten)"
          keyboardType="numeric"
          value={String(blockGapMinutes)}
          onChangeText={(text: string) => setBlockGap(Number(text) || 5)}
        />
        <ToggleRow label="Pausen berücksichtigen" value={includeBreaks} onChange={setIncludeBreaks} />
      </SettingsSection>

      <SettingsSection title="Google Kalender" description="OAuth Client & Zielkalender festlegen.">
        <InputField label="OAuth Client ID" value={googleConfig.clientId} onChangeText={(text: string) => setGoogleConfig({ clientId: text })} autoCapitalize="none" />
        <InputField label="Kalender ID" value={googleConfig.calendarId} onChangeText={(text: string) => setGoogleConfig({ calendarId: text })} autoCapitalize="none" />
        <PrimaryButton
          label={googleRefreshToken ? 'Verbindung erneuern' : 'Mit Google verbinden'}
          onPress={handleGoogleConnect}
          disabled={!googleConfig.clientId}
        />
        {googleRefreshToken ? (
          <View style={{ gap: 6 }}>
            <Text style={{ color: palette.success }}>Google Refresh Token gespeichert.</Text>
            <Text
              style={{ color: palette.danger, fontWeight: '600' }}
              onPress={() => void setGoogleRefreshToken(undefined)}
            >
              Verbindung trennen
            </Text>
          </View>
        ) : (
          <Text style={{ color: palette.mutedText }}>Noch keine Google Verbindung aktiv.</Text>
        )}
      </SettingsSection>

      <SettingsSection title="Automatische Aktualisierung" description="Stelle Zeitpunkt & Aktivierung ein.">
        <ToggleRow label="Aktiv" value={autoSyncEnabled} onChange={(value) => setAutoSync(value, autoSyncTime)} />
        <InputField
          label="Uhrzeit (HH:MM)"
          keyboardType="numbers-and-punctuation"
          value={autoSyncTime}
          onChangeText={(text: string) => setAutoSync(autoSyncEnabled, sanitizeTime(text))}
        />
      </SettingsSection>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function sanitizeTime(value: string) {
  const cleaned = value.replace(/[^0-9]/g, '');
  if (cleaned.length < 3) {
    return value;
  }
  const hours = Math.min(parseInt(cleaned.slice(0, 2), 10), 23)
    .toString()
    .padStart(2, '0');
  const minutes = Math.min(parseInt(cleaned.slice(2, 4) || '0', 10), 59)
    .toString()
    .padStart(2, '0');
  return `${hours}:${minutes}`;
}

const styles = StyleSheet.create({
  container: {
    padding: 20
  },
  heading: {
    fontSize: 26,
    fontWeight: '700'
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    fontSize: 15
  }
});
