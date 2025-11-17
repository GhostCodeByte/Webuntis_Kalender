import { format } from 'date-fns';
import type { CalendarEventPayload } from '../api/googleCalendar';
import type { NormalizedLesson } from '../api/webuntisClient';
import type { LessonViewMode } from '../state/settingsStore';
import { groupIntoBlocks, summarizeDays } from './lessonTransformer';

export interface CalendarBuildOptions {
  mode: LessonViewMode;
  gapMinutes: number;
}

export function buildCalendarEvents(lessons: NormalizedLesson[], options: CalendarBuildOptions): CalendarEventPayload[] {
  if (options.mode === 'summary') {
    return summarizeDays(lessons).map((summary) => ({
      id: sanitizeEventId(summary.id),
      summary: `Unterricht ${format(summary.start, 'dd.MM.yyyy')}`,
      description: `Gesamtunterricht: ${summary.lessonCount} Stunden\nPausen: ${summary.totalBreakMinutes} Minuten`,
      start: summary.start,
      end: summary.end
    }));
  }

  if (options.mode === 'blocks') {
    return groupIntoBlocks(lessons, options.gapMinutes).map((block) => ({
      id: sanitizeEventId(block.id),
      summary: block.subjects.join(' / '),
      description: `Lehrkräfte: ${block.teachers.join(', ') || 'k.A.'}\nRäume: ${block.rooms.join(', ') || 'k.A.'}`,
      start: block.start,
      end: block.end,
      location: block.rooms.join(', ')
    }));
  }

  return lessons.map((lesson) => ({
    id: sanitizeEventId(lesson.id),
    summary: lesson.subject,
    description: `Lehrkräfte: ${lesson.teachers.join(', ') || 'k.A.'}\nKlassen: ${lesson.classes.join(', ') || 'k.A.'}`,
    start: lesson.start,
    end: lesson.end,
    location: lesson.rooms.join(', ')
  }));
}

function sanitizeEventId(id: string) {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}
