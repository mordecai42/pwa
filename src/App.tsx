// src/App.tsx

// ELIMINAMOS: import React from 'react';
import OfflineForm from './components/OfflineForm.tsx'; 

function App() {
  return ( 
    <div className="App">
      <h1>Mi PWA Rápida</h1> 
      <p>Bienvenido a tu aplicación PWA</p>

      {/* AQUÍ SE RENDERIZA EL FORMULARIO */}
      <OfflineForm />
    </div>
  );
}

export default App;