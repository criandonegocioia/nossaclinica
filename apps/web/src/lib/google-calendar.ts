import { google } from 'googleapis';
import { prisma } from './prisma';

export async function getGoogleCalendarClient(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleAccessToken: true, googleRefreshToken: true },
  });

  if (!user || !user.googleRefreshToken) {
    throw new Error('Usuário não possui credenciais do Google Agenda');
  }

  const settingsRow = await prisma.settings.findUnique({
    where: { key: 'integrations' },
  });

  if (!settingsRow || !settingsRow.value) {
    throw new Error('Integração não configurada nas Configurações');
  }

  const settings = settingsRow.value as Record<string, any>;
  const clientId = settings.googleCalendar?.clientId;
  const clientSecret = settings.googleCalendar?.clientSecret;

  if (!clientId || !clientSecret) {
    throw new Error('Client ID e Client Secret do Google não configurados.');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  });

  // Automatically fetch a new access token if the current one is expired
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: tokens.access_token,
        },
      });
    }
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function createGoogleEvent(userId: string, eventData: {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  colorId?: string;
}) {
  try {
    const calendar = await getGoogleCalendarClient(userId);

    const event = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.start.toISOString(),
      },
      end: {
        dateTime: eventData.end.toISOString(),
      },
      colorId: eventData.colorId || '1', // 1=Blue, default
    };

    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return res.data;
  } catch (error) {
    console.error('Failed to create Google Calendar event:', error);
    throw error;
  }
}
