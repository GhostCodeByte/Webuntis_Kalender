import { differenceInMinutes, format } from 'date-fns';
import type { NormalizedLesson } from '../api/webuntisClient';
import type { LessonViewMode } from '../state/settingsStore';

export type LessonViewModel =
  | { type: 'lesson'; lesson: NormalizedLesson }
  | { type: 'block'; block: LessonBlock }
  | { type: 'summary'; summary: DaySummary };

export interface LessonBlock {
  id: string;
  start: Date;
  end: Date;
  subjects: string[];
  rooms: string[];
  teachers: string[];
  lessonCount: number;
}

export interface DaySummary {
  id: string;
  dateKey: string;
  start: Date;
  end: Date;
  lessonCount: number;
  totalBreakMinutes: number;
}

export interface TransformerOptions {
  mode: LessonViewMode;
  gapMinutes: number;
  includeCancelled?: boolean;
}

    | { type: 'break'; pause: BreakInfo };
export function buildViewModel(lessons: NormalizedLesson[], options: TransformerOptions): LessonViewModel[] {
  const filtered = lessons
    .filter((lesson) => options.includeCancelled || !lesson.isCancelled)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

    includeBreaks?: boolean;
  if (options.mode === 'single') {
    return filtered.map((lesson) => ({ type: 'lesson', lesson }));
  }

  if (options.mode === 'blocks') {
    return groupIntoBlocks(filtered, options.gapMinutes).map((block) => ({ type: 'block', block }));
  }

      const entries = filtered.map((lesson) => ({ type: 'lesson', lesson }) as LessonViewModel);
      return options.includeBreaks ? injectBreaks(entries, options.gapMinutes) : entries;
}

export function groupIntoBlocks(lessons: NormalizedLesson[], gapMinutes: number) {
      const entries = groupIntoBlocks(filtered, options.gapMinutes).map((block) => ({ type: 'block', block }) as LessonViewModel);
      return options.includeBreaks ? injectBreaks(entries, options.gapMinutes) : entries;
    return [] as LessonBlock[];
  }

  const maxGap = Math.max(gapMinutes, 1);
  const blocks: LessonBlock[] = [];

  let current = createBlockFromLesson(lessons[0]);
  blocks.push(current);

  for (let index = 1; index < lessons.length; index += 1) {
    const lesson = lessons[index];
    const gap = differenceInMinutes(lesson.start, current.end);
    if (gap <= maxGap) {
      current = {
  export interface BreakInfo {
    id: string;
    start: Date;
    end: Date;
    durationMinutes: number;
  }
        ...current,
        end: new Date(Math.max(current.end.getTime(), lesson.end.getTime())),
        lessonCount: current.lessonCount + 1,
        subjects: Array.from(new Set([...current.subjects, lesson.subject])),
        rooms: Array.from(new Set([...current.rooms, ...lesson.rooms])),
        teachers: Array.from(new Set([...current.teachers, ...lesson.teachers]))
      };
      blocks[blocks.length - 1] = current;
    } else {
      current = createBlockFromLesson(lesson);
      blocks.push(current);
    }
  }

  return blocks;
}

function createBlockFromLesson(lesson: NormalizedLesson): LessonBlock {
  return {
    id: `block-${lesson.id}`,
    start: lesson.start,
    end: lesson.end,
    subjects: [lesson.subject],
    rooms: [...lesson.rooms],
    teachers: [...lesson.teachers],
    lessonCount: 1
  };
}

export function summarizeDays(lessons: NormalizedLesson[]) {
  const summaryMap = new Map<string, DaySummary>();


  function injectBreaks(items: LessonViewModel[], minGap: number) {
    if (items.length <= 1) {
      return items;
    }
    const result: LessonViewModel[] = [];
    const threshold = Math.max(minGap, 1);
    for (let index = 0; index < items.length; index += 1) {
      const current = items[index];
      result.push(current);
      const next = items[index + 1];
      if (!next) {
        continue;
      }
      import { differenceInMinutes, format } from 'date-fns';
      import type { NormalizedLesson } from '../api/webuntisClient';
      import type { LessonViewMode } from '../state/settingsStore';

      export type LessonViewModel =
        | { type: 'lesson'; lesson: NormalizedLesson }
        | { type: 'block'; block: LessonBlock }
        | { type: 'summary'; summary: DaySummary }
        | { type: 'break'; pause: BreakInfo };

      export interface LessonBlock {
        id: string;
        start: Date;
        end: Date;
        subjects: string[];
        rooms: string[];
        teachers: string[];
        lessonCount: number;
      }

      export interface DaySummary {
        id: string;
        dateKey: string;
        start: Date;
        end: Date;
        lessonCount: number;
        totalBreakMinutes: number;
      }

      export interface BreakInfo {
        id: string;
        start: Date;
        end: Date;
        durationMinutes: number;
      }

      export interface TransformerOptions {
        mode: LessonViewMode;
        gapMinutes: number;
        includeCancelled?: boolean;
        includeBreaks?: boolean;
      }

      export function buildViewModel(lessons: NormalizedLesson[], options: TransformerOptions): LessonViewModel[] {
        const filtered = lessons
          .filter((lesson) => options.includeCancelled || !lesson.isCancelled)
          .sort((a, b) => a.start.getTime() - b.start.getTime());

        if (options.mode === 'single') {
          const entries = filtered.map((lesson) => ({ type: 'lesson', lesson }) as LessonViewModel);
          return options.includeBreaks ? injectBreaks(entries, options.gapMinutes) : entries;
        }

        if (options.mode === 'blocks') {
          const entries = groupIntoBlocks(filtered, options.gapMinutes).map((block) => ({ type: 'block', block }) as LessonViewModel);
          return options.includeBreaks ? injectBreaks(entries, options.gapMinutes) : entries;
        }

        return summarizeDays(filtered).map((summary) => ({ type: 'summary', summary }));
      }

      export function groupIntoBlocks(lessons: NormalizedLesson[], gapMinutes: number) {
        if (lessons.length === 0) {
          return [] as LessonBlock[];
        }

        const maxGap = Math.max(gapMinutes, 1);
        const blocks: LessonBlock[] = [];

        let current = createBlockFromLesson(lessons[0]);
        blocks.push(current);

        for (let index = 1; index < lessons.length; index += 1) {
          const lesson = lessons[index];
          const gap = differenceInMinutes(lesson.start, current.end);
          if (gap <= maxGap) {
            current = {
              ...current,
              end: new Date(Math.max(current.end.getTime(), lesson.end.getTime())),
              lessonCount: current.lessonCount + 1,
              subjects: Array.from(new Set([...current.subjects, lesson.subject])),
              rooms: Array.from(new Set([...current.rooms, ...lesson.rooms])),
              teachers: Array.from(new Set([...current.teachers, ...lesson.teachers]))
            };
            blocks[blocks.length - 1] = current;
          } else {
            current = createBlockFromLesson(lesson);
            blocks.push(current);
          }
        }

        return blocks;
      }

      function createBlockFromLesson(lesson: NormalizedLesson): LessonBlock {
        return {
          id: `block-${lesson.id}`,
          start: lesson.start,
          end: lesson.end,
          subjects: [lesson.subject],
          rooms: [...lesson.rooms],
          teachers: [...lesson.teachers],
          lessonCount: 1
        };
      }

      export function summarizeDays(lessons: NormalizedLesson[]) {
        const summaryMap = new Map<string, DaySummary>();

        lessons.forEach((lesson) => {
          if (!summaryMap.has(lesson.dateKey)) {
            summaryMap.set(lesson.dateKey, {
              id: `summary-${lesson.dateKey}`,
              dateKey: lesson.dateKey,
              start: lesson.start,
              end: lesson.end,
              lessonCount: 1,
              totalBreakMinutes: 0
            });
            return;
          }

          const summary = summaryMap.get(lesson.dateKey)!;
          const gap = differenceInMinutes(lesson.start, summary.end);
          if (gap > 0) {
            summary.totalBreakMinutes += gap;
          }
          summary.end = lesson.end;
          summary.lessonCount += 1;
        });

        return Array.from(summaryMap.values()).sort((a, b) => (a.start.getTime() > b.start.getTime() ? 1 : -1));
      }

      export function formatLessonTimeRange(start: Date, end: Date) {
        return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
      }

      function injectBreaks(items: LessonViewModel[], minGap: number) {
        if (items.length <= 1) {
          return items;
        }
        const result: LessonViewModel[] = [];
        const threshold = Math.max(minGap, 1);
        for (let index = 0; index < items.length; index += 1) {
          const current = items[index];
          result.push(current);
          const next = items[index + 1];
          if (!next) {
            continue;
          }
          const currentEnd = getEndDate(current);
          const nextStart = getStartDate(next);
          const gap = differenceInMinutes(nextStart, currentEnd);
          if (gap > threshold) {
            result.push({
              type: 'break',
              pause: {
                id: `break-${currentEnd.getTime()}-${nextStart.getTime()}`,
                start: currentEnd,
                end: nextStart,
                durationMinutes: gap
              }
            });
          }
        }
        return result;
      }

      function getStartDate(item: LessonViewModel) {
        if (item.type === 'lesson') {
          return item.lesson.start;
        }
        if (item.type === 'block') {
          return item.block.start;
        }
        if (item.type === 'summary') {
          return item.summary.start;
        }
        return item.pause.start;
      }

      function getEndDate(item: LessonViewModel) {
        if (item.type === 'lesson') {
          return item.lesson.end;
        }
        if (item.type === 'block') {
          return item.block.end;
        }
        if (item.type === 'summary') {
          return item.summary.end;
        }
        return item.pause.end;
      }
