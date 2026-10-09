// Configuración general de la app.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------
// Dirección de la API (detección automática)
// ---------------------------------------------------------------------
// La API corre en la misma computadora que Expo. Cuando Expo manda la app
// al emulador o al teléfono, guarda en Constants.expoConfig.hostUri la
// dirección de esa computadora, por ejemplo '192.168.1.25:8081'
// (8081 es el puerto de Expo). Se toma la IP y se cambia el puerto por
// el de la API (3000). Así funciona en el emulador y en el iPhone, en
// cualquier red, sin escribir la IP a mano.
const PUERTO_API = 3000;

function direccionComputadora() {
  const hostUri = Constants.expoConfig?.hostUri;      // '192.168.1.25:8081'
  const ip = hostUri ? hostUri.split(':')[0] : null;  // '192.168.1.25'

  // Si Expo no da una IP de la red (o da "localhost"), se usa la dirección
  // especial del emulador de Android: 10.0.2.2 significa "mi computadora".
  if (!ip || ip === 'localhost' || ip === '127.0.0.1') {
    return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  }
  return ip;
}

export const API_URL = `http://${direccionComputadora()}:${PUERTO_API}/api`;
// En el servidor final se reemplaza por la dirección que asigne el profesor.
// Nota: con "npx expo start --tunnel" Expo da una dirección de internet, no
// la de la computadora, y la API no se alcanza; para probar la API usar el
// modo normal (iPhone y computadora en la misma Wi-Fi).

// Colores de AL FORNO (los mismos de la página web).
// Se usan así: import { COLORES } from '../config/config';  →  COLORES.terracota
export const COLORES = {
  terracota: '#B0512F',
  terracotaOscuro: '#8A3C21',
  terracotaClaro: '#D4855C',
  crema: '#F4ECE0',
  cremaClara: '#FBF6EE',
  negro: '#141110',
  texto: '#1C1815',
  textoSuave: '#6D6159',
};
