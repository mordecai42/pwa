// snippet para src/index.js (al final del archivo)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado', reg);
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  });
}
// src/index.js