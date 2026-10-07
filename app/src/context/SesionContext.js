// Sesión del usuario: quién está usando la app y con qué rol.
// La navegación (src/app/_layout.js) decide qué pantallas mostrar según
// este estado: visitante, CLIENTE o ADMIN.
//
// PENDIENTE (HU-02): cuando exista el login real con la API, guardar el
// token con expo-secure-store para que la sesión se mantenga al cerrar la app.
import { createContext, useContext, useMemo, useState } from 'react';

const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  // null = visitante sin sesión
  // { id, nombre_completo, correo, rol: 'CLIENTE' | 'ADMIN' } = sesión iniciada
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);

  const valor = useMemo(
    () => ({
      usuario,
      token,
      esCliente: usuario?.rol === 'CLIENTE',
      esAdmin: usuario?.rol === 'ADMIN',
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

export function useSesion() {
  const contexto = useContext(SesionContext);
  if (!contexto) throw new Error('useSesion debe usarse dentro de <SesionProvider>');
  return contexto;
}
