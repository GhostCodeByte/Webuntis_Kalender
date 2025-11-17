import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export interface CalendarEventPayload {
  id: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
}

export interface ExpoCalendarConfig {
  calendarId?: string;
}

/**
 * Request calendar permissions from the user
 */
export async function requestCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

/**
 * Get the device's calendars
 */
export async function getDeviceCalendars(): Promise<Calendar.Calendar[]> {
  const hasPermission = await requestCalendarPermissions();
  if (!hasPermission) {
    throw new Error('Kalender-Berechtigung wurde nicht erteilt.');
  }
  return await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
}

/**
 * Get or create a calendar for WebUntis events
 */
export async function getOrCreateWebUntisCalendar(): Promise<string> {
  const hasPermission = await requestCalendarPermissions();
  if (!hasPermission) {
    throw new Error('Kalender-Berechtigung wurde nicht erteilt.');
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  
  // Look for existing WebUntis calendar
  const existingCalendar = calendars.find(cal => cal.title === 'WebUntis Stundenplan');
  if (existingCalendar) {
    return existingCalendar.id;
  }

  // Create new calendar
  const defaultCalendarSource = Platform.select({
    ios: calendars.find(cal => cal.source?.name === 'iCloud')?.source || calendars[0]?.source,
    android: { isLocalAccount: true, name: 'WebUntis', type: Calendar.SourceType.LOCAL }
  });

  if (!defaultCalendarSource) {
    throw new Error('Keine geeignete Kalenderquelle gefunden.');
  }

  const newCalendarId = await Calendar.createCalendarAsync({
    title: 'WebUntis Stundenplan',
    color: '#2196F3',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: defaultCalendarSource.id,
    source: defaultCalendarSource,
    name: 'WebUntis Stundenplan',
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER
  });

  return newCalendarId;
}

/**
 * Upsert calendar events to the device calendar
 */
export async function upsertCalendarEvents(
  calendarId: string,
  events: CalendarEventPayload[]
): Promise<void> {
  const hasPermission = await requestCalendarPermissions();
  if (!hasPermission) {
    throw new Error('Kalender-Berechtigung wurde nicht erteilt.');
  }

  if (!calendarId) {
    throw new Error('Bitte gib eine Calendar ID an.');
  }

  // Process events in parallel
  await Promise.all(events.map((event) => upsertCalendarEvent(calendarId, event)));
}

/**
 * Upsert a single calendar event
 */
async function upsertCalendarEvent(
  calendarId: string,
  event: CalendarEventPayload
): Promise<void> {
  try {
    // Check if event already exists by searching for events with matching notes
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    // Search for existing events in the time range
    const existingEvents = await Calendar.getEventsAsync(
      [calendarId],
      new Date(startDate.getTime() - 24 * 60 * 60 * 1000), // 1 day before
      new Date(endDate.getTime() + 24 * 60 * 60 * 1000)   // 1 day after
    );

    // Look for an event with the same notes field (we'll use it as our unique ID)
    const existingEvent = existingEvents.find(e => e.notes?.includes(`WebUntis-ID: ${event.id}`));

    const eventDetails: Calendar.Event = {
      title: event.summary,
      notes: `${event.description || ''}\n\nWebUntis-ID: ${event.id}`,
      location: event.location,
      startDate: event.start,
      endDate: event.end,
      timeZone: 'Europe/Berlin'
    };

    if (existingEvent) {
      // Update existing event
      await Calendar.updateEventAsync(existingEvent.id, eventDetails);
    } else {
      // Create new event
      await Calendar.createEventAsync(calendarId, eventDetails);
    }
  } catch (error) {
    console.warn(`Failed to upsert event ${event.id}:`, error);
    throw new Error(`Kalender Ereignis fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

/**
 * Delete old WebUntis events from the calendar
 * This helps clean up past events that are no longer needed
 */
export async function deleteOldWebUntisEvents(
  calendarId: string,
  beforeDate: Date
): Promise<number> {
  const hasPermission = await requestCalendarPermissions();
  if (!hasPermission) {
    throw new Error('Kalender-Berechtigung wurde nicht erteilt.');
  }

  try {
    // Get events from the past
    const events = await Calendar.getEventsAsync(
      [calendarId],
      new Date(0), // From beginning
      beforeDate
    );

    // Filter for WebUntis events
    const webuntisEvents = events.filter(e => e.notes?.includes('WebUntis-ID:'));

    // Delete them
    await Promise.all(
      webuntisEvents.map(event => Calendar.deleteEventAsync(event.id))
    );

    return webuntisEvents.length;
  } catch (error) {
    console.warn('Failed to delete old events:', error);
    return 0;
  }
}
