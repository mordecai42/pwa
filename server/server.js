// server/server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// VAPID keys (genera con web-push)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn('No VAPID keys found. Genera con: npx web-push generate-vapid-keys');
}

webpush.setVapidDetails(
  'mailto:tu@correo.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

let subscriptions = []; // en memoria para pruebas

app.get('/api/vapidPublicKey', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

app.post('/api/subscribe', (req, res) => {
  const sub = req.body;
  subscriptions.push(sub);
  console.log('Nueva suscripción:', sub.endpoint ? sub.endpoint.slice(0,60) : sub);
  res.status(201).json({ ok: true });
});

// sync endpoint que consumirá el SW
app.post('/api/sync-entries', (req, res) => {
  const entry = req.body;
  console.log('[SYNC-ENTRIES] recibido:', entry);
  // aquí guardarías en BD real
  res.status(201).json({ ok: true });
});

// endpoint para enviar notificación a todas suscripciones (prueba)
app.post('/api/send-notification', async (req, res) => {
  const payload = req.body || { title:'Prueba', body:'Notificación de prueba', url:'/' };
  const results = [];
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
      results.push({ status: 'ok' });
    } catch (err) {
      console.error('Failed to send to subscription', err);
      results.push({ status: 'fail', error: err.message });
    }
  }
  res.json({ results });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
