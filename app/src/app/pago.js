// =====================================================================
// PANTALLA · Pago con tarjeta (simulado)
// Ruta: /pago   ·   Historia: HU-07, HU-08
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Resumen del pedido → "Confirmar y pagar"
// Lleva a: /mis-pedidos/[id] (comprobante del pedido nuevo)
//
// Pide los datos de la tarjeta y envía carrito + tarjeta a POST /api/pedidos.
// El pago es SIMULADO en la API (no se cobra dinero real):
//   · Aprobado  → se vacía el carrito y se abre el comprobante.
//   · Rechazado → se muestra el motivo y el carrito se conserva (HU-08).
// La tarjeta nunca se guarda: la API solo guarda los últimos 4 dígitos.
// Tarjeta de prueba que siempre se rechaza: cualquiera que termine en 0000.
// =====================================================================
import { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCarrito } from '../context/CarritoContext';
import { useSesion } from '../context/SesionContext';
import { crearPedido } from '../services/pedidos';
import CampoFormulario from '../components/CampoFormulario';
import Boton from '../components/Boton';
import { formatearColones } from '../utils/formato';
import { COLORES } from '../config/config';

const VACIO = { numero: '', titular: '', vencimiento: '', cvv: '' };

// Revisa la tarjeta antes de enviarla. Devuelve { campo: 'mensaje' }.
// La API vuelve a revisar todo: esto es solo para avisar rápido.
function validarTarjeta(t) {
  const errores = {};
  if (!/^\d{16}$/.test(t.numero.replace(/\s/g, ''))) errores.numero = 'El número debe tener 16 dígitos';
  if (!t.titular.trim()) errores.titular = 'Escribe el nombre del titular';
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(t.vencimiento)) errores.vencimiento = 'Usa el formato MM/AA';
  if (!/^\d{3}$/.test(t.cvv)) errores.cvv = 'El CVV tiene 3 dígitos';
  return errores;
}

// La API responde el campo como 'tarjeta.numero' → aquí se usa 'numero'.
const nombreCampo = (campo) => (campo || '').replace('tarjeta.', '');

export default function Pago() {
  const router = useRouter();
  const { token } = useSesion();
  const { productos, total, vaciar } = useCarrito();

  const [tarjeta, setTarjeta] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [rechazo, setRechazo] = useState(null); // motivo del rechazo o error general
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (texto) => {
    setTarjeta((actual) => ({ ...actual, [campo]: texto }));
    setErrores((actual) => ({ ...actual, [campo]: null }));
  };

  // Al escribir el vencimiento, pone la "/" sola: '1228' → '12/28'
  function cambiarVencimiento(texto) {
    const digitos = texto.replace(/\D/g, '').slice(0, 4);
    cambiar('vencimiento')(digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos);
  }

  async function alPagar() {
    if (enviando) return;
    setRechazo(null);
    const encontrados = validarTarjeta(tarjeta);
    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados);
      return;
    }

    setEnviando(true);
    try {
      // Solo se mandan id y cantidad: el precio lo pone la base de datos.
      const carrito = productos.map((p) => ({ producto_id: p.id, cantidad: p.cantidad }));
      const comprobante = await crearPedido(token, carrito, tarjeta);

      vaciar();
      // Se cierran Carrito, Resumen y Pago, y se abre el comprobante.
      // Así la flecha "atrás" vuelve al Menú y no a un pago ya hecho.
      if (router.canDismiss()) router.dismissAll();
      router.push(`/mis-pedidos/${comprobante.id}`);
    } catch (e) {
      // Error de un campo → se marca ese campo. Rechazo del pago u otro
      // error → recuadro arriba. En ambos casos el carrito se conserva.
      if (e.campo && e.campo.startsWith('tarjeta.')) setErrores({ [nombreCampo(e.campo)]: e.message });
      else setRechazo(e.message);
      setEnviando(false);
    }
  }

  // Si se llega aquí con el carrito vacío (ej. volviendo atrás), no hay nada que pagar.
  if (productos.length === 0) {
    return (
      <View style={estilos.vacio}>
        <Ionicons name="cart-outline" size={48} color={COLORES.textoSuave} />
        <Text style={estilos.vacioTexto}>No hay nada que pagar</Text>
        <Boton texto="Ver menú" href="/menu" variante="secundario" />
      </View>
    );
  }

  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
      <View style={estilos.totalCaja}>
        <Text style={estilos.totalEtiqueta}>TOTAL A PAGAR</Text>
        <Text style={estilos.totalMonto}>{formatearColones(total)}</Text>
      </View>

      {rechazo ? (
        <View style={estilos.rechazo}>
          <Ionicons name="close-circle-outline" size={22} color={COLORES.terracotaOscuro} />
          <Text style={estilos.rechazoTexto}>{rechazo}</Text>
        </View>
      ) : null}

      <CampoFormulario
        etiqueta="NÚMERO DE TARJETA"
        icono="card-outline"
        value={tarjeta.numero}
        onChangeText={cambiar('numero')}
        placeholder="16 dígitos"
        keyboardType="number-pad"
        maxLength={19}
        error={errores.numero}
      />
      <CampoFormulario
        etiqueta="NOMBRE DEL TITULAR"
        value={tarjeta.titular}
        onChangeText={cambiar('titular')}
        placeholder="Como aparece en la tarjeta"
        autoCapitalize="characters"
        error={errores.titular}
      />
      {/* Vencimiento y CVV en la misma fila */}
      <View style={estilos.fila}>
        <View style={estilos.mitad}>
          <CampoFormulario
            etiqueta="VENCE"
            value={tarjeta.vencimiento}
            onChangeText={cambiarVencimiento}
            placeholder="MM/AA"
            keyboardType="number-pad"
            maxLength={5}
            error={errores.vencimiento}
          />
        </View>
        <View style={estilos.mitad}>
          <CampoFormulario
            etiqueta="CVV"
            value={tarjeta.cvv}
            onChangeText={cambiar('cvv')}
            placeholder="123"
            keyboardType="number-pad"
            maxLength={3}
            secureTextEntry
            error={errores.cvv}
          />
        </View>
      </View>

      <Pressable
        onPress={alPagar}
        disabled={enviando}
        style={({ pressed }) => [estilos.boton, (pressed || enviando) && { opacity: 0.7 }]}
      >
        <Text style={estilos.botonTexto}>{enviando ? 'PROCESANDO…' : `PAGAR ${formatearColones(total)}`}</Text>
      </Pressable>

      <View style={estilos.aviso}>
        <Ionicons name="shield-checkmark-outline" size={16} color={COLORES.textoSuave} />
        <Text style={estilos.avisoTexto}>Pago simulado: no se cobra dinero real y la tarjeta no se guarda.</Text>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: COLORES.crema },
  contenedor: { padding: 20, paddingBottom: 40 },
  totalCaja: { backgroundColor: COLORES.negro, borderRadius: 8, padding: 16, alignItems: 'center' },
  totalEtiqueta: { color: COLORES.terracotaClaro, fontWeight: 'bold', letterSpacing: 2, fontSize: 12 },
  totalMonto: { color: COLORES.crema, fontSize: 30, fontWeight: 'bold', marginTop: 4 },
  rechazo: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16,
    backgroundColor: '#F3DCD2', borderRadius: 10, padding: 14,
  },
  rechazoTexto: { flex: 1, color: COLORES.terracotaOscuro, fontSize: 15, fontWeight: 'bold' },
  fila: { flexDirection: 'row', gap: 12 },
  mitad: { flex: 1 },
  boton: { backgroundColor: COLORES.terracota, borderRadius: 8, paddingVertical: 16, marginTop: 28 },
  botonTexto: { color: '#FFFFFF', fontWeight: 'bold', letterSpacing: 1.5, textAlign: 'center', fontSize: 15 },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 14 },
  avisoTexto: { color: COLORES.textoSuave, fontSize: 12, flexShrink: 1 },
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: COLORES.crema },
  vacioTexto: { fontSize: 18, fontWeight: 'bold', color: COLORES.texto, marginTop: 12 },
});
