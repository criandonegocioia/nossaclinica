import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const userId = searchParams.get('state'); // We passed userId in the state parameter
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${request.nextUrl.origin}/configuracoes?error=${error}`);
    }

    if (!code || !userId) {
      return NextResponse.json({ message: 'Missing code or state parameter' }, { status: 400 });
    }

    // Fetch Google Calendar settings from database to get Client ID and Secret
    const settingsRow = await prisma.settings.findUnique({
      where: { key: 'integrations' },
    });

    if (!settingsRow || !settingsRow.value) {
      return NextResponse.json({ message: 'Integração não configurada' }, { status: 400 });
    }

    const settings = settingsRow.value as Record<string, any>;
    const clientId = settings.googleCalendar?.clientId;
    const clientSecret = settings.googleCalendar?.clientSecret;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ message: 'Client ID ou Secret ausente' }, { status: 400 });
    }

    const redirectUrl = `${request.nextUrl.origin}/api/integrations/google/callback`;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUrl
    );

    // Exchange the authorization code for an access token and a refresh token
    const { tokens } = await oauth2Client.getToken(code);

    // Update the user's tokens in the database
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token, // This will only be present on the first authorization
      },
    });

    // Redirect the user back to the settings page with a success flag
    return NextResponse.redirect(`${request.nextUrl.origin}/configuracoes?tab=integrations&google_sync=success`);

  } catch (error) {
    console.error('Google Callback error:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/configuracoes?tab=integrations&google_sync=error`);
  }
}
