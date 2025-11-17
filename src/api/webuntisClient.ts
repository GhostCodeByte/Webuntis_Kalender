import { format } from 'date-fns';
import type { WebUntisConfig } from '@/src/state/settingsStore';

const JSON_RPC_VERSION = '2.0';
const CLIENT_NAME = 'WebUntisKalenderSync';

export interface FetchLessonsParams {
  config: WebUntisConfig;
  password: string;
  from: Date;
  to: Date;
}

export interface RawWebUntisLesson {
  id: number;
  date: number;
  startTime: number;
  endTime: number;
  cancel?: boolean;
  code?: string;
  lsNumber?: number;
  kl?: Array<{ id: number; name: string }>;
  te?: Array<{ id: number; name: string }>;
  su?: Array<{ id: number; name: string }>;
  ro?: Array<{ id: number; name: string }>;
}

export interface NormalizedLesson {
  id: string;
  start: Date;
  end: Date;
  dateKey: string;
  subject: string;
  teachers: string[];
  rooms: string[];
  classes: string[];
  isCancelled: boolean;
}

interface JsonRpcResponse<T> {
  jsonrpc: string;
  id: string;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

async function callJsonRpc<T>(url: string, body: Record<string, unknown>, sessionId?: string) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(sessionId ? { Cookie: `JSESSIONID=${sessionId}` } : {})
    },
    body: JSON.stringify({ jsonrpc: JSON_RPC_VERSION, id: CLIENT_NAME, ...body })
  });

  if (!response.ok) {
    throw new Error(`WebUntis request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as JsonRpcResponse<T>;
  if (payload.error) {
    throw new Error(payload.error.message);
  }

  return payload.result as T;
}

function buildEndpoint(config: WebUntisConfig) {
  const trimmedBase = config.baseUrl.replace(/\/$/, '');
  return `${trimmedBase}/${config.school}/jsonrpc.do?school=${config.school}`;
}

function formatUntisDate(date: Date) {
  return Number(format(date, 'yyyyMMdd'));
}

function untisTimeToDate(date: number, time: number) {
  const dateStr = date.toString();
  const timeStr = time.toString().padStart(4, '0');
  const iso = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}T${timeStr.substring(0, 2)}:${timeStr.substring(2)}:00`;
  return new Date(iso);
}

export async function fetchLessons({ config, password, from, to }: FetchLessonsParams) {
  if (!config.school || !config.username || !password || !config.elementId) {
    throw new Error('Bitte vervollständige die WebUntis Einstellungen.');
  }

  const endpoint = buildEndpoint(config);
  const auth = await callJsonRpc<{ sessionId: string }>(endpoint, {
    method: 'authenticate',
    params: {
      user: config.username,
      password,
      client: CLIENT_NAME
    }
  });

  try {
    const lessons = await callJsonRpc<RawWebUntisLesson[]>(
      endpoint,
      {
        method: 'getTimetable',
        params: {
          options: {
            element: {
              id: config.elementId,
              type: config.elementType
            },
            startDate: formatUntisDate(from),
            endDate: formatUntisDate(to),
            showLsText: true,
            onlySubjects: false
          }
        }
      },
      auth.sessionId
    );

    return lessons.map((lesson) => normalizeLesson(lesson));
  } finally {
    await callJsonRpc(endpoint, { method: 'logout' }, auth.sessionId).catch(() => undefined);
  }
}

function normalizeLesson(lesson: RawWebUntisLesson): NormalizedLesson {
  const start = untisTimeToDate(lesson.date, lesson.startTime);
  const end = untisTimeToDate(lesson.date, lesson.endTime);
  const dateKey = format(start, 'yyyy-MM-dd');

  return {
    id: `${lesson.id}-${lesson.date}`,
    start,
    end,
    dateKey,
    subject: lesson.su?.map((subject) => subject.name).join(', ') ?? 'Unbekannt',
    teachers: lesson.te?.map((teacher) => teacher.name) ?? [],
    rooms: lesson.ro?.map((room) => room.name) ?? [],
    classes: lesson.kl?.map((klass) => klass.name) ?? [],
    isCancelled: Boolean(lesson.cancel || lesson.code === 'cancelled')
  };
}
```}