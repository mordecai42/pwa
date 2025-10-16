// server/server.js

// Importación de dotenv y configuración inmediata
import dotenv from 'dotenv';
dotenv.config();

// Importaciones de ES Modules
import express from 'express';

import webpush from 'web-push';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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

let subscriptions = []; 

// --- Endpoints ---

// 1. Obtener clave pública VAPID
app.get('/api/vapidPublicKey', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// 2. Registrar una nueva suscripción de Push
app.post('/api/subscribe', (req, res) => {
  const sub = req.body;
  subscriptions.push(sub);
  console.log('Nueva suscripción:', sub.endpoint ? sub.endpoint.slice(0, 60) + '...' : sub);
  res.status(201).json({ ok: true });
});

// 3. Endpoint para sincronización offline (Background Sync)
app.post('/api/sync-entries', (req, res) => {
  const entries = req.body; // Cambié 'entry' a 'entries' ya que usualmente se envían varios
  console.log('[SYNC-ENTRIES] recibido. Número de entradas:', Array.isArray(entries) ? entries.length : 1);
 
  res.status(201).json({ ok: true, received: Array.isArray(entries) ? entries.length : 1 });
});

// 4. Endpoint para enviar notificación (para pruebas manuales)
app.post('/api/send-notification', async (req, res) => {
  // Recibe un payload opcional o usa uno por defecto
  const payload = req.body.data || { title: 'Prueba PWA', body: 'Notificación enviada desde el servidor.', url: '/' };
  
  const results = [];
  // Itera sobre todas las suscripciones guardadas en memoria
  for (const sub of subscriptions) {
    try {
      // Envía la notificación. El Service Worker la recibirá.
      await webpush.sendNotification(sub, JSON.stringify(payload));
      results.push({ status: 'ok', endpoint: sub.endpoint.slice(0, 20) + '...' });
    } catch (err) {
      console.error('Failed to send to subscription:', err.statusCode, err.message);
      
      // Manejo de suscripciones expiradas (código 410)
      if (err.statusCode === 410) {
        console.log('Suscripción expirada. Eliminando...');
        subscriptions = subscriptions.filter(s => s !== sub);
      }
      
      results.push({ status: 'fail', error: err.message, endpoint: sub.endpoint.slice(0, 20) + '...' });
    }
  }
  
  res.json({ results, totalSubscriptions: subscriptions.length });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
// server.js (versión con módulos ES)
import express from 'express';
import webpush from 'web-push';
import dotenv from 'dotenv';
import cors from 'cors';

// Cargar variables del .env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Claves VAPID (desde el archivo .env)
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  'mailto:example@yourdomain.org',
  publicVapidKey,
  privateVapidKey
);

// Endpoint para registrar suscripción del cliente
app.post('/subscribe', async (req, res) => {
  const subscription = req.body;

  // Responder con estado 201 (creado)
  res.status(201).json({ message: 'Suscripción recibida correctamente' });

  // Notificación de prueba
  const payload = JSON.stringify({ title: 'Notificación de prueba desde el servidor' });

  try {
    await webpush.sendNotification(subscription, payload);
    console.log('✅ Notificación enviada correctamente');
  } catch (error) {
    console.error('❌ Error al enviar la notificación:', error);
  }
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
