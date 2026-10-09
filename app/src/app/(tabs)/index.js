// =====================================================================
// PANTALLA · Inicio (pestaña del cliente)
// Ruta: /   ·   Historia: HU-04, HU-05, HU-06
// Quién la ve: visitantes y clientes (no necesita sesión)
// Se llega desde: es la primera pantalla al abrir la app; pestaña "Inicio" del menú inferior
// Lleva a: /menu (botón "Ver menú" cuando no hay promociones)
//
// La pantalla solo ordena las secciones. Cada sección es un componente
// de src/components/ que pide sus propios datos a la API:
//   · Horario       (HU-04) → components/SeccionHorario.js      (GET /api/horario)
//   · Ubicación     (HU-05) → components/SeccionUbicacion.js    (GET /api/restaurante)
//   · Promociones   (HU-06) → components/SeccionPromociones.js  (GET /api/promociones)
// =====================================================================
import { ScrollView, StyleSheet } from 'react-native';
import SeccionHorario from '../../components/SeccionHorario';
import SeccionUbicacion from '../../components/SeccionUbicacion';
import SeccionPromociones from '../../components/SeccionPromociones';
import { COLORES } from '../../config/config';

export default function Inicio() {
  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenedor}>
      <SeccionHorario />
      <SeccionUbicacion />
      <SeccionPromociones />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: COLORES.crema },
  contenedor: { padding: 16, paddingBottom: 32 },
});
