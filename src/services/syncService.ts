import { addDays, endOfDay, startOfDay } from 'date-fns';
import { fetchLessons, type NormalizedLesson } from '../api/webuntisClient';
import { buildCalendarEvents } from './calendarService';
import { refreshAccessToken, upsertCalendarEvents } from '../api/googleCalendar';
import type { SettingsSnapshot } from '../state/settingsStore';

export interface SyncResult {
  lessons: NormalizedLesson[];
  pushedEvents: number;
}

export interface SyncRequest {
  settings: SettingsSnapshot;
  pushToCalendar?: boolean;
}

export async function runSync({ settings, pushToCalendar = true }: SyncRequest): Promise<SyncResult> {
  if (!settings.webuntisPassword) {
    throw new Error('Kein WebUntis Passwort hinterlegt.');
  }
  const from = startOfDay(new Date());
  const to = endOfDay(addDays(from, settings.futureDays));

  const lessons = await fetchLessons({
    config: settings.webuntisConfig,
    password: settings.webuntisPassword,
    from,
    to
  });

  if (!pushToCalendar) {
    return { lessons, pushedEvents: 0 };
  }

  if (!settings.googleRefreshToken || !settings.googleConfig.clientId) {
    throw new Error('Google Kalender Verbindung ist nicht eingerichtet.');
  }

  const { accessToken } = await refreshAccessToken(settings.googleConfig.clientId, settings.googleRefreshToken);
  const events = buildCalendarEvents(lessons, {
    mode: settings.viewMode,
    gapMinutes: settings.blockGapMinutes
  });
  await upsertCalendarEvents(accessToken, settings.googleConfig.calendarId, events);

  return { lessons, pushedEvents: events.length };
}
