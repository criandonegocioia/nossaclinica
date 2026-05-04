import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getGoogleCalendarClient } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/google/status
 *
 * Returns the real-time Google Calendar connection status for the
 * currently authenticated user.  It checks:
 *   1. Whether googleRefreshToken exists in DB
 *   2. Whether the token is actually usable (a lightweight API call)
 *
 * Response: { connected: boolean }
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const userId = authResult.user.sub as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleRefreshToken: true },
    });

    if (!user?.googleRefreshToken) {
      return NextResponse.json({ connected: false });
    }

    // Attempt a lightweight API call to validate the token is still valid
    try {
      const calendar = await getGoogleCalendarClient(userId);
      // Fetch a single event just to prove the token works
      await calendar.events.list({
        calendarId: 'primary',
        maxResults: 1,
        timeMin: new Date().toISOString(),
      });
      return NextResponse.json({ connected: true });
    } catch (err: any) {
      // If TOKEN_REVOKED was thrown, the tokens were already cleaned up
      if (err?.message === 'TOKEN_REVOKED') {
        return NextResponse.json({ connected: false });
      }
      // Other transient errors — token exists but API is temporarily unavailable
      // Still report as connected since the credentials are in the DB
      console.error('[Google Status] Transient error:', err?.message);
      return NextResponse.json({ connected: true });
    }
  } catch (error) {
    console.error('Google status error:', error);
    return NextResponse.json({ connected: false });
  }
}
