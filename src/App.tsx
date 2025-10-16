// src/App.tsx

import React from 'react';
// RUTA Y EXTENSIÓN FINAL CORRECTAS
import OfflineForm from './components/OfflineForm.tsx'; 

function App() {
  return (
    <div className="App">
      {/* Tu contenido estático que se muestra actualmente */}
      <h1>Mi PWA Rápida</h1> 
      <p>Bienvenido a tu aplicación PWA</p>

      {/* AQUÍ SE RENDERIZA EL FORMULARIO (Si la compilación es exitosa) */}
      <OfflineForm />
    </div>
  );
}

export default App;