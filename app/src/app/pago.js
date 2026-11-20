// =====================================================================
// PANTALLA · Pago con tarjeta o SINPE Móvil
// Ruta: /pago   ·   Historia: HU-07, HU-08
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Resumen del pedido → "Confirmar y pagar"
// Lleva a: /mis-pedidos/[id] (comprobante del pedido nuevo)
//
// El cliente elige cómo pagar y la app envía carrito + datos de pago a
// POST /api/pedidos. La API le pide el cobro al socio Banco Simulado
// (servicio aparte, con su propia base de datos):
//   · Tarjeta     → número, vencimiento y CVV. El banco saca la marca
//                   (Visa, MasterCard, American Express), revisa que la
//                   tarjeta exista, que no esté vencida y que tenga saldo.
//   · SINPE Móvil → teléfono. El banco revisa que esté asociado a una
//                   cuenta con saldo.
//   · Aprobado  → se vacía el carrito y se abre el comprobante.
//   · Rechazado → se muestra el motivo del banco y el carrito se conserva.
// La tarjeta nunca se guarda en AL FORNO: solo la marca y los últimos 4.
// =====================================================================
import { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCarrito } from '../context/CarritoContext';
import { useSesion } from '../context/SesionContext';
import { crearPedido } from '../services/pedidos';
import CampoFormulario from '../components/CampoFormulario';
import Opcion from '../components/Opcion';
import Boton from '../components/Boton';
import { formatearColones } from '../utils/formato';
import { COLORES } from '../config/config';

const METODOS = ['Tarjeta', 'SINPE Móvil'];
const VACIO = { numero: '', vencimiento: '', cvv: '', telefono: '' };

// Marca según los primeros dígitos (solo para mostrarla mientras se
// escribe; quien decide de verdad es el banco).
function marcaDe(numero) {
  if (/^3[47]/.test(numero)) return 'American Express';
  if (/^4/.test(numero)) return 'Visa';
  if (/^5[1-5]/.test(numero)) return 'MasterCard';
  const cuatro = Number(numero.slice(0, 4));
  if (numero.length >= 4 && cuatro >= 2221 && cuatro <= 2720) return 'MasterCard';
  return null;
}

// Revisa el formato antes de enviar. Devuelve { campo: 'mensaje' }.
// La API vuelve a revisar todo: esto es solo para avisar rápido.
function validar(metodo, d) {
  const errores = {};
  if (metodo === 'Tarjeta') {
    const numero = d.numero.replace(/\s/g, '');
    const amex = marcaDe(numero) === 'American Express';
    if (!/^\d{15,16}$/.test(numero)) errores.numero = 'El número debe tener 15 o 16 dígitos';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(d.vencimiento)) errores.vencimiento = 'Usa el formato MM/AA';
    if (!(amex ? /^\d{4}$/ : /^\d{3}$/).test(d.cvv)) errores.cvv = amex ? 'Tiene 4 dígitos' : 'Tiene 3 dígitos';
  } else if (!/^\d{8}$/.test(d.telefono.replace(/[\s-]/g, ''))) {
    errores.telefono = 'El teléfono debe tener 8 dígitos';
  }
  return errores;
}

// La API responde el campo como 'tarjeta.numero' → aquí se usa 'numero'.
const nombreCampo = (campo) => (campo || '').replace('tarjeta.', '');

export default function Pago() {
  const router = useRouter();
  const { token } = useSesion();
  const { productos, total, vaciar } = useCarrito();

  const [metodo, setMetodo] = useState('Tarjeta');
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [rechazo, setRechazo] = useState(null); // motivo del rechazo o error general
  const [enviando, setEnviando] = useState(false);

  const marca = marcaDe(datos.numero.replace(/\s/g, ''));

  const cambiar = (campo) => (texto) => {
    setDatos((actual) => ({ ...actual, [campo]: texto }));
    setErrores((actual) => ({ ...actual, [campo]: null }));
  };

  function elegirMetodo(nuevo) {
    setMetodo(nuevo);
    setErrores({});
    setRechazo(null);
  }

  // Al escribir el vencimiento, pone la "/" sola: '1228' → '12/28'
  function cambiarVencimiento(texto) {
    const digitos = texto.replace(/\D/g, '').slice(0, 4);
    cambiar('vencimiento')(digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos);
  }

  async function alPagar() {
    if (enviando) return;
    setRechazo(null);
    const encontrados = validar(metodo, datos);
    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados);
      return;
    }

    setEnviando(true);
    try {
      // Solo se mandan id y cantidad: el precio lo pone la base de datos.
      const carrito = productos.map((p) => ({ producto_id: p.id, cantidad: p.cantidad }));
      const pago = metodo === 'Tarjeta'
        ? { metodo_pago: metodo, tarjeta: { numero: datos.numero, vencimiento: datos.vencimiento, cvv: datos.cvv } }
        : { metodo_pago: metodo, telefono: datos.telefono };
      const comprobante = await crearPedido(token, carrito, pago);

      vaciar();
      // Se cierran Carrito, Resumen y Pago, y se abre el comprobante.
      // Así la flecha "atrás" vuelve al Menú y no a un pago ya hecho.
      if (router.canDismiss()) router.dismissAll();
      router.push(`/mis-pedidos/${comprobante.id}`);
    } catch (e) {
      // Error de un campo → se marca ese campo. Rechazo del banco u otro
      // error → recuadro arriba. En ambos casos el carrito se conserva.
      const campo = nombreCampo(e.campo);
      if (campo && campo in VACIO) setErrores({ [campo]: e.message });
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

      {/* Forma de pago */}
      <Text style={estilos.etiqueta}>¿CÓMO QUERÉS PAGAR?</Text>
      <View style={estilos.metodos}>
        {METODOS.map((m) => (
          <View key={m} style={estilos.mitad}>
            <Opcion texto={m} seleccionada={metodo === m} onPress={() => elegirMetodo(m)} />
          </View>
        ))}
      </View>

      {rechazo ? (
        <View style={estilos.rechazo}>
          <Ionicons name="close-circle-outline" size={22} color={COLORES.terracotaOscuro} />
          <Text style={estilos.rechazoTexto}>{rechazo}</Text>
        </View>
      ) : null}

      {metodo === 'Tarjeta' ? (
        <>
          <CampoFormulario
            etiqueta="NÚMERO DE TARJETA"
            icono="card-outline"
            value={datos.numero}
            onChangeText={cambiar('numero')}
            placeholder="15 o 16 dígitos"
            keyboardType="number-pad"
            maxLength={19}
            error={errores.numero}
          />
          {marca ? <Text style={estilos.marca}>{marca}</Text> : null}
          {/* Vencimiento y CVV en la misma fila */}
          <View style={estilos.fila}>
            <View style={estilos.mitad}>
              <CampoFormulario
                etiqueta="VENCE"
                value={datos.vencimiento}
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
                value={datos.cvv}
                onChangeText={cambiar('cvv')}
                placeholder={marca === 'American Express' ? '1234' : '123'}
                keyboardType="number-pad"
                maxLength={marca === 'American Express' ? 4 : 3}
                secureTextEntry
                error={errores.cvv}
              />
            </View>
          </View>
        </>
      ) : (
        <>
          <CampoFormulario
            etiqueta="TELÉFONO CON SINPE MÓVIL"
            icono="phone-portrait-outline"
            value={datos.telefono}
            onChangeText={cambiar('telefono')}
            placeholder="8 dígitos"
            keyboardType="number-pad"
            maxLength={9}
            error={errores.telefono}
          />
          <Text style={estilos.ayuda}>El monto se rebaja de la cuenta asociada a ese número.</Text>
        </>
      )}

      <Pressable
        onPress={alPagar}
        disabled={enviando}
        style={({ pressed }) => [estilos.boton, (pressed || enviando) && { opacity: 0.7 }]}
      >
        <Text style={estilos.botonTexto}>{enviando ? 'PROCESANDO…' : `PAGAR ${formatearColones(total)}`}</Text>
      </Pressable>

      <View style={estilos.aviso}>
        <Ionicons name="shield-checkmark-outline" size={16} color={COLORES.textoSuave} />
        <Text style={estilos.avisoTexto}>Pago simulado con el Banco Simulado: no se cobra dinero real.</Text>
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
  etiqueta: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, color: COLORES.texto, marginTop: 20, marginBottom: 8 },
  metodos: { flexDirection: 'row', gap: 12 },
  rechazo: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16,
    backgroundColor: '#F3DCD2', borderRadius: 10, padding: 14,
  },
  rechazoTexto: { flex: 1, color: COLORES.terracotaOscuro, fontSize: 15, fontWeight: 'bold' },
  marca: { color: COLORES.terracota, fontWeight: 'bold', marginTop: 6 },
  ayuda: { color: COLORES.textoSuave, fontSize: 13, marginTop: 6 },
  fila: { flexDirection: 'row', gap: 12 },
  mitad: { flex: 1 },
  boton: { backgroundColor: COLORES.terracota, borderRadius: 8, paddingVertical: 16, marginTop: 28 },
  botonTexto: { color: '#FFFFFF', fontWeight: 'bold', letterSpacing: 1.5, textAlign: 'center', fontSize: 15 },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 14 },
  avisoTexto: { color: COLORES.textoSuave, fontSize: 12, flexShrink: 1 },
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: COLORES.crema },
  vacioTexto: { fontSize: 18, fontWeight: 'bold', color: COLORES.texto, marginTop: 12 },
});
