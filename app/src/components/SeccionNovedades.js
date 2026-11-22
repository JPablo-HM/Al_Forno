// =====================================================================
// SECCIÓN · Novedades de la cervecería (dentro de la pantalla Inicio)
// Datos: GET /api/novedades (services/informacion.js)
//
// La cervecería artesanal (socio comercial, servicio aparte) le vende a
// AL FORNO la "Cerveza artesanal costarricense" del menú. Aquí se muestran
// las cervezas que tiene disponibles esta semana.
// Si la cervecería no responde o no hay novedades, la sección no se
// muestra: no es información indispensable para el cliente.
// =====================================================================
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { listarNovedades } from '../services/informacion';
import { COLORES } from '../config/config';

export default function SeccionNovedades() {
  const [cervezas, setCervezas] = useState([]);

  // Se ejecuta una sola vez, cuando la sección aparece. Si falla, queda vacía.
  useEffect(() => {
    listarNovedades().then(setCervezas).catch(() => {});
  }, []);

  if (cervezas.length === 0) return null;

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>NOVEDADES DE LA CERVECERÍA</Text>
      {/* Una fila por cerveza; key identifica cada fila */}
      {cervezas.map((c) => (
        <View key={c.id} style={estilos.fila}>
          <Text style={estilos.nombre}>{c.nombre}</Text>
          <Text style={estilos.estilo}>{c.estilo}</Text>
          <Text style={estilos.descripcion}>{c.descripcion}</Text>
        </View>
      ))}
      <Text style={estilos.nota}>Cervezas artesanales de nuestra cervecería aliada.</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: COLORES.cremaClara, borderRadius: 8, padding: 16, marginBottom: 16 },
  titulo: { color: COLORES.terracota, fontWeight: 'bold', letterSpacing: 2, marginBottom: 4 },
  fila: { paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORES.crema },
  nombre: { fontSize: 16, fontWeight: 'bold', color: COLORES.texto },
  estilo: { color: COLORES.terracota, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  descripcion: { color: COLORES.textoSuave, marginTop: 4, lineHeight: 20 },
  nota: { color: COLORES.textoSuave, fontSize: 12, marginTop: 8, paddingHorizontal: 8 },
});
