import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token'
};

const calendarEndpoint = 'https://www.googleapis.com/calendar/v3/calendars';

export interface GoogleAuthOptions {
  clientId: string;
  scopes?: string[];
}

export interface GoogleAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface CalendarEventPayload {
  id: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
}

export async function startGoogleAuthFlow({ clientId, scopes = ['https://www.googleapis.com/auth/calendar'] }: GoogleAuthOptions) {
  if (!clientId) {
    throw new Error('Bitte hinterlege eine Google OAuth Client ID.');
  }

  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: false,
    native: `${Constants.expoConfig?.scheme ?? 'webuntisKal'}:/oauthredirect`
  });

  const request = new AuthSession.AuthRequest({
    clientId,
    scopes,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    extraParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  });

  await request.makeAuthUrlAsync(discovery);
  const result = await request.promptAsync(discovery);

  if (result.type !== 'success' || !result.params.code) {
    throw new Error('Google Anmeldung wurde abgebrochen.');
  }

  return exchangeCodeForToken({
    clientId,
    code: result.params.code,
    redirectUri,
    codeVerifier: request.codeVerifier
  });
}

export async function exchangeCodeForToken({
  clientId,
  code,
  redirectUri,
  codeVerifier
}: {
  clientId: string;
  code: string;
  redirectUri: string;
  codeVerifier?: string | null;
}): Promise<GoogleAuthTokens> {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
  });

  if (codeVerifier) {
    body.append('code_verifier', codeVerifier);
  }

  const response = await fetch(discovery.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error('Google Token konnte nicht erstellt werden.');
  }

  const payload = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresIn: payload.expires_in
  };
}

export async function refreshAccessToken(clientId: string, refreshToken: string) {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    grant_type: 'refresh_token'
  });

  const response = await fetch(discovery.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error('Google Token konnte nicht aktualisiert werden.');
  }

  const payload = (await response.json()) as {
    access_token: string;
    expires_in?: number;
  };

  return {
    accessToken: payload.access_token,
    expiresIn: payload.expires_in
  } satisfies GoogleAuthTokens;
}

export async function upsertCalendarEvents(accessToken: string, calendarId: string, events: CalendarEventPayload[]) {
  if (!calendarId) {
    throw new Error('Bitte gib eine Calendar ID an (z.B. "primary").');
  }
  await Promise.all(events.map((event) => putCalendarEvent(accessToken, calendarId, event)));
}

async function putCalendarEvent(accessToken: string, calendarId: string, event: CalendarEventPayload) {
  const response = await fetch(`${calendarEndpoint}/${encodeURIComponent(calendarId)}/events/${event.id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: event.id,
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.start.toISOString()
      },
      end: {
        dateTime: event.end.toISOString()
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Kalender Ereignis fehlgeschlagen: ${text}`);
  }
}
