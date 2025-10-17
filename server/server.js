// server/server.js

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import webpush from 'web-push';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// VAPID keys (genera con web-push)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn('⚠️ No VAPID keys found. Genera con: npx web-push generate-vapid-keys');
}

webpush.setVapidDetails(
  'mailto:tu@correo.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Almacenamiento temporal de suscripciones
let subscriptions = [];

// --- Endpoints ---

// 1️⃣ Obtener clave pública VAPID
app.get('/api/vapidPublicKey', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// 2️⃣ Registrar una nueva suscripción de Push
app.post('/api/subscribe', (req, res) => {
  const sub = req.body;
  subscriptions.push(sub);
  console.log('📩 Nueva suscripción:', sub.endpoint ? sub.endpoint.slice(0, 60) + '...' : sub);
  res.status(201).json({ ok: true });
});

// 3️⃣ Endpoint para sincronización offline (Background Sync)
app.post('/api/sync-entries', (req, res) => {
  const entries = req.body;
  console.log('[SYNC-ENTRIES] recibido. Número de entradas:', Array.isArray(entries) ? entries.length : 1);

  res.status(201).json({ ok: true, received: Array.isArray(entries) ? entries.length : 1 });
});

// 4️⃣ Endpoint para enviar notificación manualmente
app.post('/api/send-notification', async (req, res) => {
  const payload = req.body.data || {
    title: 'Prueba PWA',
    body: 'Notificación enviada desde el servidor.',
    url: '/'
  };

  const results = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
      results.push({ status: 'ok', endpoint: sub.endpoint.slice(0, 20) + '...' });
    } catch (err) {
      console.error('❌ Error al enviar notificación:', err.statusCode, err.message);

      // Eliminar suscripciones expiradas
      if (err.statusCode === 410) {
        console.log('🗑️ Suscripción expirada eliminada.');
        subscriptions = subscriptions.filter(s => s !== sub);
      }

      results.push({
        status: 'fail',
        error: err.message,
        endpoint: sub.endpoint.slice(0, 20) + '...'
      });
    }
  }

  res.json({ results, totalSubscriptions: subscriptions.length });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
