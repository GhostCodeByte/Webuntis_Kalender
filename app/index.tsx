import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Text, RefreshControl, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { Card } from '../src/components/Card';
import { useTheme } from '../src/providers/ThemeProvider';
import { useSettingsStore, getSettingsSnapshot } from '../src/state/settingsStore';
import { useSettingsHydration } from '../src/hooks/useSettingsHydration';
import { runSync } from '../src/services/syncService';
import { buildViewModel, formatLessonTimeRange, type LessonViewModel } from '../src/services/lessonTransformer';
import { registerBackgroundSync } from '../src/tasks/backgroundSync';

export default function DashboardScreen() {
  const palette = useTheme();
  const hydrated = useSettingsHydration();
  const secretsReady = useSettingsStore((state) => state.secretsReady);
  const autoSyncEnabled = useSettingsStore((state) => state.autoSyncEnabled);
  const hasGoogleRefresh = useSettingsStore((state) => Boolean(state.googleRefreshToken));
  const lastSyncAt = useSettingsStore((state) => state.lastSyncAt);
  const lastSyncStatus = useSettingsStore((state) => state.lastSyncStatus);
  const lastSyncMessage = useSettingsStore((state) => state.lastSyncMessage);

  const [viewModel, setViewModel] = useState<LessonViewModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !secretsReady) {
      useSettingsStore.getState().hydrateSecrets();
    }
  }, [hydrated, secretsReady]);

  useEffect(() => {
    if (hydrated && autoSyncEnabled && hasGoogleRefresh) {
      registerBackgroundSync().catch((error) => console.warn('Background sync failed', error));
    }
  }, [hydrated, autoSyncEnabled, hasGoogleRefresh]);

  const handleSync = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const snapshot = getSettingsSnapshot();
      const pushToCalendar = Boolean(snapshot.googleRefreshToken && snapshot.googleConfig.clientId);
      const result = await runSync({ settings: snapshot, pushToCalendar });
      const items = buildViewModel(result.lessons, {
        mode: snapshot.viewMode,
        gapMinutes: snapshot.blockGapMinutes,
        includeCancelled: false,
        includeBreaks: snapshot.includeBreaks
      });
      setViewModel(items);
      useSettingsStore.getState().setSyncResult('success', `Kalendereinträge aktualisiert: ${result.pushedEvents}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(message);
      useSettingsStore.getState().setSyncResult('error', message);
    } finally {
      setLoading(false);
    }
  }, []);

  const ready = hydrated && secretsReady;

  useEffect(() => {
    if (ready && viewModel.length === 0 && !loading) {
      handleSync().catch((error: unknown) => console.warn('Initial sync failed', error));
    }
  }, [ready, viewModel.length, loading, handleSync]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={handleSync} />}
    >
      <Text style={[styles.heading, { color: palette.text }]}>Dein Stundenplan</Text>
      <Text style={[styles.subtitle, { color: palette.mutedText }]}>Synchronisiere WebUntis automatisch mit Google Kalender.</Text>

      <PrimaryButton label={ready ? 'Jetzt synchronisieren' : 'Lade Einstellungen...'} onPress={handleSync} disabled={!ready} loading={loading} />

      <Card>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Letzte Synchronisation</Text>
          <Link href="/settings" style={{ color: palette.primary, fontWeight: '600' }}>
            Einstellungen
          </Link>
        </View>
        <Text style={{ color: palette.mutedText, marginTop: 8 }}>
          {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : 'Noch keine Synchronisation durchgeführt.'}
        </Text>
        {lastSyncStatus ? (
          <Text
            style={{
              marginTop: 4,
              color: lastSyncStatus === 'success' ? palette.success : palette.danger,
              fontWeight: '500'
            }}
          >
            {lastSyncMessage}
          </Text>
        ) : null}
        {error ? <Text style={{ color: palette.danger, marginTop: 8 }}>{error}</Text> : null}
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Ausgewählte Ansicht</Text>
        {!ready && <Text style={{ color: palette.mutedText }}>Bitte Einstellungen laden...</Text>}
        {ready && viewModel.length === 0 ? (
          <Text style={{ color: palette.mutedText }}>Noch keine Daten geladen.</Text>
        ) : null}
        {viewModel.map((item: LessonViewModel) => (
          <View key={getItemKey(item)} style={styles.lessonRow}>
            <Text style={[styles.lessonTitle, { color: palette.text }]}>{renderTitle(item)}</Text>
            <Text style={{ color: palette.mutedText }}>{renderTime(item)}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

function getItemKey(item: LessonViewModel) {
  if (item.type === 'lesson') {
    return item.lesson.id;
  }
  if (item.type === 'block') {
    return item.block.id;
  }
  if (item.type === 'summary') {
    return item.summary.id;
  }
  return item.pause.id;
}

function renderTitle(item: LessonViewModel) {
  if (item.type === 'lesson') {
    return `${item.lesson.subject} · ${item.lesson.rooms.join(', ')}`;
  }
  if (item.type === 'block') {
    return `${item.block.subjects.join(' / ')} (${item.block.lessonCount} Std.)`;
  }
  if (item.type === 'summary') {
    return `${item.summary.dateKey} (${item.summary.lessonCount} Std.)`;
  }
  return `Pause (${item.pause.durationMinutes} min)`;
}

function renderTime(item: LessonViewModel) {
  if (item.type === 'lesson') {
    return formatLessonTimeRange(item.lesson.start, item.lesson.end);
  }
  if (item.type === 'block') {
    return formatLessonTimeRange(item.block.start, item.block.end);
  }
  if (item.type === 'summary') {
    return `${formatLessonTimeRange(item.summary.start, item.summary.end)} · Pausen: ${item.summary.totalBreakMinutes} min`;
  }
  return formatLessonTimeRange(item.pause.start, item.pause.end);
}

const styles = StyleSheet.create({
  container: {
    padding: 20
  },
  heading: {
    fontSize: 28,
    fontWeight: '700'
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    marginBottom: 16
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  lessonRow: {
    marginTop: 12
  },
  lessonTitle: {
    fontWeight: '600',
    fontSize: 15
  }
});
