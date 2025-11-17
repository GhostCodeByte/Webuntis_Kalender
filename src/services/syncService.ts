import { addDays, endOfDay, startOfDay } from 'date-fns';
import { fetchLessons, type NormalizedLesson } from '../api/webuntisClient';
import { buildCalendarEvents } from './calendarService';
import { refreshAccessToken, upsertCalendarEvents as upsertGoogleCalendarEvents } from '../api/googleCalendar';
import { upsertCalendarEvents as upsertExpoCalendarEvents, getOrCreateWebUntisCalendar } from '../api/expoCalendar';
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

  const events = buildCalendarEvents(lessons, {
    mode: settings.viewMode,
    gapMinutes: settings.blockGapMinutes
  });

  // Sync to the selected calendar provider
  if (settings.calendarProvider === 'device') {
    // Use Expo Calendar (device calendar)
    let calendarId = settings.expoCalendarConfig.calendarId;
    if (!calendarId) {
      // Auto-create WebUntis calendar if not specified
      calendarId = await getOrCreateWebUntisCalendar();
    }
    await upsertExpoCalendarEvents(calendarId, events);
  } else {
    // Use Google Calendar (default)
    if (!settings.googleRefreshToken || !settings.googleConfig.clientId) {
      throw new Error('Google Kalender Verbindung ist nicht eingerichtet.');
    }
    const { accessToken } = await refreshAccessToken(settings.googleConfig.clientId, settings.googleRefreshToken);
    await upsertGoogleCalendarEvents(accessToken, settings.googleConfig.calendarId, events);
  }

  return { lessons, pushedEvents: events.length };
}
