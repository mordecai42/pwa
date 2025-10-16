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
