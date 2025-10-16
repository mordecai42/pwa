// src/App.tsx
import React from 'react';

// RUTA CORREGIDA: Asumiendo que App.tsx y la carpeta components están en 'src'
import OfflineForm from './components/OfflineForm.tsx';
function App() {
  return (
    <div className="App">
      {/* Tu contenido estático */}
      <h1>Mi PWA Rápida</h1> 
      <p>Bienvenido a tu aplicación PWA</p>

      {/* AÑADE ESTO: */}
      <OfflineForm />
    </div>
  );
}

export default App;