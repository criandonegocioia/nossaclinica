const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('https://nossaclinica-api.vercel.app/api/schedules', {
      headers: {
        'Cookie': 'auth-token=clinica-odontoface-jwt-secret-prod-2026' // I don't have the real token!
      }
    });
    console.log(res.data);
  } catch(e) {
    console.log(e.response?.status, e.response?.data);
  }
}
test();
