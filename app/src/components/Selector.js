// =====================================================================
// COMPONENTE · Selector (caja que se despliega)
// Lo usa Registro para elegir país, provincia, cantón y distrito.
// Se ve como un CampoFormulario; al tocarlo se abre una ventana (Modal)
// con la lista y, al elegir una opción, se cierra.
//
// Props:
//   etiqueta      → texto de arriba, ej. 'PAÍS'
//   opciones      → [{ id, nombre }]
//   valor         → id de la opción elegida (null = ninguna)
//   onCambiar     → función que recibe el id elegido
//   placeholder   → texto cuando no hay nada elegido
//   deshabilitado → no se puede abrir (ej. provincia antes de elegir país)
//   cargando      → muestra "Cargando…" mientras llega la lista de la API
//   error         → mensaje en rojo debajo (si no hay, no se muestra)
// =====================================================================
import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORES } from '../config/config';

export default function Selector({ etiqueta, opciones, valor, onCambiar, placeholder, deshabilitado, cargando, error }) {
  const [abierto, setAbierto] = useState(false);

  // find() busca la opción elegida para mostrar su nombre en la caja
  const elegida = opciones.find((o) => o.id === valor);
  const bloqueado = deshabilitado || cargando;
  const texto = cargando ? 'Cargando…' : elegida ? elegida.nombre : placeholder;

  function elegir(id) {
    setAbierto(false);
    onCambiar(id);
  }

  return (
    <View>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>

      {/* La caja: al tocarla se abre la lista */}
      <Pressable
        onPress={() => setAbierto(true)}
        disabled={bloqueado}
        style={[estilos.caja, error && estilos.cajaError, bloqueado && estilos.cajaBloqueada]}
      >
        <Text style={[estilos.texto, !elegida && estilos.textoVacio]}>{texto}</Text>
        <Ionicons name="chevron-down" size={20} color={COLORES.texto} />
      </Pressable>
      {error ? <Text style={estilos.error}>{error}</Text> : null}

      {/* La lista: ventana encima de la pantalla. Tocar afuera la cierra. */}
      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <Pressable style={estilos.fondo} onPress={() => setAbierto(false)}>
          <View style={estilos.ventana}>
            <Text style={estilos.titulo}>{etiqueta}</Text>
            <ScrollView>
              {opciones.map((o) => (
                <Pressable key={o.id} onPress={() => elegir(o.id)} style={estilos.opcion}>
                  <Text style={[estilos.opcionTexto, o.id === valor && estilos.opcionElegida]}>{o.nombre}</Text>
                  {o.id === valor ? <Ionicons name="checkmark" size={20} color={COLORES.terracota} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, color: COLORES.texto, marginTop: 16, marginBottom: 8 },
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CFC4B8',
    borderRadius: 8,
    backgroundColor: COLORES.cremaClara,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cajaError: { borderColor: COLORES.terracota, borderWidth: 2 },
  cajaBloqueada: { opacity: 0.5 },
  texto: { flex: 1, fontSize: 16, color: COLORES.texto },
  textoVacio: { color: COLORES.textoSuave },
  error: { color: COLORES.terracotaOscuro, marginTop: 6, fontSize: 13 },
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  ventana: { backgroundColor: COLORES.cremaClara, borderRadius: 12, paddingVertical: 12, maxHeight: '70%' },
  titulo: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, color: COLORES.terracota, paddingHorizontal: 18, paddingBottom: 8 },
  opcion: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderTopWidth: 1, borderTopColor: COLORES.crema },
  opcionTexto: { flex: 1, fontSize: 16, color: COLORES.texto },
  opcionElegida: { fontWeight: 'bold', color: COLORES.terracota },
});
