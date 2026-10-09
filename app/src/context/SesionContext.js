// Sesión del usuario: quién está usando la app y con qué rol.
// La navegación (src/app/_layout.js) decide qué pantallas mostrar según
// este estado: visitante, CLIENTE o ADMIN.
//
// PENDIENTE (HU-02): cuando exista el login real con la API, guardar el
// token con expo-secure-store para que la sesión se mantenga al cerrar la app.
import { createContext, useContext, useMemo, useState } from 'react';

// createContext crea un "canal" para compartir datos con toda la app sin
// pasarlos de pantalla en pantalla.
const SesionContext = createContext(null);

// El Provider guarda el estado y lo pone a disposición de todo lo que
// envuelve. En _layout.js envuelve la app completa.
export function SesionProvider({ children }) {
  // null = visitante sin sesión
  // { id, nombre_completo, correo, rol: 'CLIENTE' | 'ADMIN' } = sesión iniciada
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);

  // useMemo arma este objeto solo cuando cambian usuario o token, así las
  // pantallas no se vuelven a dibujar sin necesidad.
  const valor = useMemo(
    () => ({
      usuario,
      token,
      // ?. (encadenamiento opcional): si usuario es null no falla, da undefined.
      esCliente: usuario?.rol === 'CLIENTE',
      esAdmin: usuario?.rol === 'ADMIN',
      // Al cambiar el usuario, _layout.js recalcula qué pantallas se permiten.
      iniciarSesion: (datosUsuario, nuevoToken = null) => {
        setUsuario(datosUsuario);
        setToken(nuevoToken);
      },
      cerrarSesion: () => {
        setUsuario(null);
        setToken(null);
      },
    }),
    [usuario, token]
  );

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

// Hook para leer la sesión desde cualquier pantalla, por ejemplo:
//   const { usuario, esAdmin, cerrarSesion } = useSesion();
// Si se usa fuera del Provider, avisa con un error claro.
export function useSesion() {
  const contexto = useContext(SesionContext);
  if (!contexto) throw new Error('useSesion debe usarse dentro de <SesionProvider>');
  return contexto;
}
