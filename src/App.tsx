// src/App.tsx

import React from 'react';
// RUTA Y EXTENSIÓN FINAL CORRECTAS
import OfflineForm from './components/OfflineForm.tsx'; 

function App() {
  return (
    <div className="App">
      {/* Contenido estático */}
      <h1>Mi PWA Rápida</h1> 
      <p>Bienvenido a tu aplicación PWA</p>

      {/* COMPONENTE FUNCIONAL */}
      <OfflineForm />
    </div>
  );
}

export default App;