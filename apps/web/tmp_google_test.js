const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { google } = require('googleapis');

async function listGoogleEvents(userId, timeMin, timeMax) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleAccessToken: true, googleRefreshToken: true },
  });

  if (!user || !user.googleRefreshToken) {
    throw new Error('No refresh token');
  }

  const settingsRow = await prisma.settings.findUnique({
    where: { key: 'integrations' },
  });

  const settings = settingsRow.value;
  const clientId = settings.googleCalendar?.clientId;
  const clientSecret = settings.googleCalendar?.clientSecret;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return res.data.items || [];
}

async function run() {
  try {
    const profs = await prisma.user.findMany({ where: { googleRefreshToken: { not: null } }});
    console.log('Professionals with token:', profs.map(p => p.name));
    
    for (const prof of profs) {
      console.log(`Fetching for ${prof.name}...`);
      const events = await listGoogleEvents(prof.id, new Date('2026-04-01T00:00:00.000Z'), new Date('2026-04-30T23:59:59.999Z'));
      console.log(`Found ${events.length} events for ${prof.name}.`);
      if (events.length > 0) {
        console.log(events.map(e => `${e.start.dateTime || e.start.date} - ${e.summary}`).slice(0, 5));
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
