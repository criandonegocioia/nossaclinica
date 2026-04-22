const { listGoogleEvents } = require('./src/lib/google-calendar');

async function test() {
  try {
    const profId = 'cmoa6dy5n001i33qyc5wvo20a';
    const start = new Date('2026-04-01');
    const end = new Date('2026-04-30');
    console.log('Fetching...');
    const events = await listGoogleEvents(profId, start, end);
    console.log('Events:', events.length);
  } catch(e) {
    console.error('ERROR:', e);
  }
}
test();
