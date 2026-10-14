// =====================================================================
// PANTALLA · Inicio (pestaña del cliente)
// Ruta: /   ·   Historia: HU-04, HU-05, HU-06
// Quién la ve: visitantes y clientes (no necesita sesión)
// Se llega desde: es la primera pantalla al abrir la app; pestaña "Inicio" del menú inferior
// Lleva a: /menu (botón "Ver menú" cuando no hay promociones)
//
// La pantalla solo ordena las secciones. Cada sección es un componente
// de src/components/:
//   · Portada       (encabezado) → components/SeccionPortada.js  (fija, sin API)
//   · Horario       (HU-04) → components/SeccionHorario.js      (GET /api/horario)
//   · Ubicación     (HU-05) → components/SeccionUbicacion.js    (GET /api/restaurante)
//   · Promociones   (HU-06) → components/SeccionPromociones.js  (GET /api/promociones)
// La portada va de borde a borde; las tarjetas van dentro de un margen.
// =====================================================================
import { ScrollView, View, StyleSheet } from 'react-native';
import SeccionPortada from '../../components/SeccionPortada';
import SeccionHorario from '../../components/SeccionHorario';
import SeccionUbicacion from '../../components/SeccionUbicacion';
import SeccionPromociones from '../../components/SeccionPromociones';
import { COLORES } from '../../config/config';

export default function Inicio() {
  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenido}>
      <SeccionPortada />
      <View style={estilos.tarjetas}>
        <SeccionHorario />
        <SeccionUbicacion />
        <SeccionPromociones />
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: COLORES.crema },
  contenido: { paddingBottom: 32 },
  tarjetas: { padding: 16 },
});
