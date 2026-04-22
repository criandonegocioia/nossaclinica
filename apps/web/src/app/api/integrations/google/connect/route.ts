import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    // We get the user ID to pass it as state, so the callback knows who to update
    const userId = authResult.user.sub as string;

    // Fetch Google Calendar settings from database
    const settingsRow = await prisma.settings.findUnique({
      where: { key: 'integrations' },
    });

    if (!settingsRow || !settingsRow.value) {
      return NextResponse.json({ message: 'Integração não configurada nas Configurações' }, { status: 400 });
    }

    const settings = settingsRow.value as Record<string, any>;
    const clientId = settings.googleCalendar?.clientId;
    const clientSecret = settings.googleCalendar?.clientSecret;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ message: 'Client ID e Client Secret do Google não configurados.' }, { status: 400 });
    }

    // Determine the base URL (localhost for dev, vercel domain for prod)
    // The request.nextUrl.origin automatically detects where we are deployed
    const redirectUrl = `${request.nextUrl.origin}/api/integrations/google/callback`;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUrl
    );

    // Generate the url that will be used for authorization
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required to get a refresh token
      prompt: 'consent', // Force consent screen to guarantee refresh token
      scope: [
        'https://www.googleapis.com/auth/calendar', // Read/Write access to Calendars
        'https://www.googleapis.com/auth/calendar.events', // Read/Write access to Events
      ],
      state: userId, // Pass user ID so callback knows who to update
    });

    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    console.error('Google Connect error:', error);
    return NextResponse.json({ message: 'Erro interno ao conectar com Google' }, { status: 500 });
  }
}
