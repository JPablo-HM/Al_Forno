-- =====================================================================
--  AL FORNO · Base de datos
--  01_tablas.sql  →  Estructura: tablas y llaves
--
--  Versión 2.1 · 22 de octubre de 2026 (seguridad de la cuenta)
--  Motor: MySQL 8.0 o superior
--  Basado en: Historias de usuario v2.5
--
--  Orden de ejecución:
--    1. 01_tablas.sql             (este archivo)
--    2. 02_procedimientos.sql     (procedimientos almacenados)
--    3. 03_datos_iniciales.sql    (administrador, preguntas y menú)
--
--  ⚠ Este script BORRA y vuelve a crear la base al_forno.
--    Úselo solo en desarrollo o en una instalación nueva.
-- =====================================================================

-- ---------------------------------------------------------------------
--  DECISIONES DE DISEÑO (versión 2.0)
--  · 11 tablas: solo lo que piden las historias de usuario.
--  · 22 oct 2026 (v2.1): seguridad de la cuenta (HU-01, HU-02, HU-20 a
--    HU-24). Columnas nuevas en usuario y 5 tablas nuevas:
--    pregunta_seguridad, usuario_respuesta, contrasena_historial, token
--    y auditoria. Los datos sensibles llegan YA cifrados desde la API
--    (la llave está en el .env de la API, nunca en la base).
--  · 21 oct 2026: se quitaron la tabla ticket y las columnas que la app
--    no usa (producto.agotado, pedido.estado, pedido.nota,
--    reserva.motivo y reserva.comentario).
--  · El horario y los datos del restaurante NO están aquí: la app no los
--    edita, así que están quemados en la API (api/src/config/restaurante.js).
--  · 22 oct 2026: se quitó la tabla agenda. La agenda es informativa y
--    fija: está quemada en la API (api/src/config/agenda.js).
--  · Las listas fijas (rol, categoría, estado de la reserva) son columnas ENUM
--    en lugar de tablas aparte.
--  · Las validaciones de formato (cédula, teléfono, precio, cantidades...)
--    las hace la API. La base solo garantiza: datos obligatorios (NOT NULL),
--    valores únicos (UNIQUE) y relaciones entre tablas (FOREIGN KEY).
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
--  CÓMO LEER ESTE ARCHIVO
--  · CREATE TABLE nombre ( columnas..., llaves... ) crea una tabla.
--  · Tipos: INT (entero), VARCHAR(n) (texto de hasta n), CHAR(n) (texto de
--    largo fijo), BOOLEAN (0 o 1), DATE (fecha), TIME (hora),
--    DATETIME (fecha y hora), ENUM('a','b') (solo uno de esos valores).
--  · UNSIGNED: sin números negativos.
--  · NOT NULL: dato obligatorio.  NULL: puede quedar vacío.
--  · DEFAULT: valor que se usa si no se envía uno.
--  · AUTO_INCREMENT: MySQL asigna 1, 2, 3... automáticamente.
--  · PRIMARY KEY: identifica cada fila.  UNIQUE: no se puede repetir.
--  · FOREIGN KEY ... REFERENCES: la fila debe existir en la otra tabla.
-- ---------------------------------------------------------------------

-- Los scripts están en UTF-8. SET NAMES evita que las tildes, la ñ y el ₡
-- se guarden dañadas si el cliente de MySQL usa otra codificación.
SET NAMES utf8mb4;

DROP DATABASE IF EXISTS al_forno;

CREATE DATABASE al_forno
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;   -- tildes, ñ y ₡; comparaciones sin distinguir mayúsculas

USE al_forno;

-- Hora de Costa Rica (UTC-6, sin horario de verano). La API abre cada
-- conexión con esta misma zona, así NOW() y CURDATE() dan la hora local.
SET time_zone = '-06:00';


-- =====================================================================
--  1. USUARIO  (HU-01 Registro, HU-02 Iniciar sesión, HU-14 Administrador,
--               HU-20 Contraseñas, HU-21 Doble factor, HU-23 Datos sensibles)
--  Clientes y administradores en una sola tabla. El administrador no
--  tiene cédula ni teléfono (quedan en NULL).
--
--  HU-23 · Cómo se protege cada dato (lo hace la API antes de guardar):
--    · contrasena_hash        → hash bcrypt (no se puede volver atrás)
--    · cedula, telefono,
--      authenticator_secreto  → cifrado AES-256 (la API los puede leer)
--    · cedula_hash            → huella HMAC-SHA256 de la cédula.
--      ¿Por qué? El cifrado AES usa un valor al azar (IV): la misma
--      cédula cifrada dos veces da dos textos distintos, así que UNIQUE
--      no detectaría la repetida. La huella siempre es igual para la
--      misma cédula: "cifrado para leer, huella para buscar".
-- =====================================================================
CREATE TABLE usuario (
  id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  rol                    ENUM('CLIENTE', 'ADMIN') NOT NULL DEFAULT 'CLIENTE',
  nombre_completo        VARCHAR(100) NOT NULL,
  cedula                 VARCHAR(100) NULL,      -- cifrada con AES (9 dígitos, lo valida la API)
  cedula_hash            CHAR(64)     NULL,      -- huella de la cédula, para no repetirla
  telefono               VARCHAR(100) NULL,      -- cifrado con AES (8 dígitos, lo valida la API)
  correo                 VARCHAR(254) NOT NULL,
  contrasena_hash        CHAR(60)     NOT NULL,  -- bcrypt; nunca la contraseña

  -- HU-01 · La cuenta no puede entrar hasta confirmar el correo
  estado                 ENUM('PENDIENTE', 'ACTIVO') NOT NULL DEFAULT 'PENDIENTE',
  -- HU-20 · Fecha del último cambio de contraseña (vence a los 90 días)
  contrasena_fecha       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- HU-02 · Intentos fallidos seguidos y hasta cuándo dura el bloqueo
  intentos_fallidos      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  bloqueado_hasta        DATETIME     NULL,      -- NULL = no está bloqueado
  -- HU-21 · Google Authenticator (opcional)
  authenticator_secreto  VARCHAR(200) NULL,      -- clave cifrada con AES; NULL = no vinculado
  authenticator_activo   BOOLEAN      NOT NULL DEFAULT FALSE,  -- TRUE cuando confirmó el primer código

  PRIMARY KEY (id),
  UNIQUE (correo),       -- HU-01: no se repite el correo
  UNIQUE (cedula_hash)   -- HU-01: no se repite la cédula (varios NULL sí se permiten)
);


-- =====================================================================
--  2. PRODUCTO  (HU-03 Menú, HU-15 Gestionar menú)
-- =====================================================================
CREATE TABLE producto (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(80)  NOT NULL,
  descripcion  VARCHAR(300) NOT NULL,
  -- El orden del ENUM es el orden en que salen las categorías en el menú
  categoria    ENUM('Pizzas', 'Cucina italiana', 'Coctelería', 'Cervezas') NOT NULL,
  precio       INT UNSIGNED NOT NULL,          -- colones enteros
  activo       BOOLEAN      NOT NULL DEFAULT TRUE,   -- "eliminar" lo desactiva (no se borra)

  PRIMARY KEY (id)
);


-- =====================================================================
--  3. PROMOCION  (HU-06 Promociones, HU-17 Gestionar promociones)
--  Los días y las fechas de la promoción se escriben en la descripción,
--  por ejemplo: "Válido martes y jueves hasta el 31 de octubre".
-- =====================================================================
CREATE TABLE promocion (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo       VARCHAR(80)  NOT NULL,
  descripcion  VARCHAR(500) NOT NULL,
  activa       BOOLEAN      NOT NULL DEFAULT TRUE,  -- desactivada = no se muestra

  PRIMARY KEY (id)
);


-- =====================================================================
--  4. PEDIDO  (HU-07 Pedido, HU-08 Pago, HU-09 Mis pedidos, HU-16 Gestionar)
-- =====================================================================
CREATE TABLE pedido (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,   -- número de pedido
  usuario_id        INT UNSIGNED NOT NULL,                  -- el cliente
  total             INT UNSIGNED NOT NULL,                  -- lo que se pagó
  tarjeta_ultimos4  CHAR(4)      NOT NULL,                  -- se muestra en el comprobante
  fecha             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  FOREIGN KEY (usuario_id) REFERENCES usuario (id)
);

-- Productos de cada pedido. precio_unitario guarda el precio que se pagó:
-- si el administrador cambia el precio después, el comprobante no cambia.
-- El nombre NO se copia: siempre se muestra el nombre actual del producto.
CREATE TABLE pedido_detalle (
  pedido_id        INT UNSIGNED     NOT NULL,
  producto_id      INT UNSIGNED     NOT NULL,
  cantidad         TINYINT UNSIGNED NOT NULL,   -- de 1 a 10 (lo valida la API)
  precio_unitario  INT UNSIGNED     NOT NULL,

  PRIMARY KEY (pedido_id, producto_id),         -- un producto una sola vez por pedido
  FOREIGN KEY (pedido_id)   REFERENCES pedido (id),
  FOREIGN KEY (producto_id) REFERENCES producto (id)
);


-- =====================================================================
--  5. RESERVA  (HU-10 Reservas, HU-11 Cancelar, HU-18 Gestionar reservas)
-- =====================================================================
CREATE TABLE reserva (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED     NOT NULL,        -- el cliente
  fecha       DATE             NOT NULL,
  hora        TIME             NOT NULL,        -- hora exacta (lo valida la API)
  personas    TINYINT UNSIGNED NOT NULL,        -- de 1 a 8 (lo valida la API)
  estado      ENUM('Confirmada', 'Cancelada') NOT NULL DEFAULT 'Confirmada',

  PRIMARY KEY (id),
  FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  -- Índice: acelera contar las reservas de una fecha y hora (máximo 3)
  INDEX (fecha, hora)
);


-- =====================================================================
--  6. PREGUNTA_SEGURIDAD  (HU-01 Registro, HU-22 Recuperar contraseña)
--  La lista de preguntas para elegir. Se cargan en 03_datos_iniciales.sql.
-- =====================================================================
CREATE TABLE pregunta_seguridad (
  id     TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  texto  VARCHAR(150)     NOT NULL,

  PRIMARY KEY (id)
);

-- Las 3 respuestas de cada cliente. La respuesta se guarda con bcrypt,
-- igual que una contraseña (la API la pasa a minúsculas y le quita los
-- espacios del inicio y del final antes de cifrarla).
CREATE TABLE usuario_respuesta (
  usuario_id      INT UNSIGNED     NOT NULL,
  pregunta_id     TINYINT UNSIGNED NOT NULL,
  respuesta_hash  CHAR(60)         NOT NULL,

  PRIMARY KEY (usuario_id, pregunta_id),        -- la misma pregunta una sola vez por cliente
  FOREIGN KEY (usuario_id)  REFERENCES usuario (id),
  FOREIGN KEY (pregunta_id) REFERENCES pregunta_seguridad (id)
);


-- =====================================================================
--  7. CONTRASENA_HISTORIAL  (HU-20 Política de contraseñas)
--  Cada contraseña que ha tenido el cliente (bcrypt), incluida la actual.
--  La API compara la nueva con las últimas 5 para no repetirlas.
-- =====================================================================
CREATE TABLE contrasena_historial (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id       INT UNSIGNED NOT NULL,
  contrasena_hash  CHAR(60)     NOT NULL,
  fecha            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  FOREIGN KEY (usuario_id) REFERENCES usuario (id)
);


-- =====================================================================
--  8. TOKEN  (HU-01 Verificar correo, HU-21 Doble factor)
--  Códigos de un solo uso que se envían por correo:
--    · VERIFICACION  → el link "¿Eres vos?" (vence en 24 horas)
--    · DOBLE_FACTOR  → el código de 6 dígitos (vence en 2 minutos)
--  Se guarda el hash SHA-256 del código, nunca el código (HU-23).
-- =====================================================================
CREATE TABLE token (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NOT NULL,
  tipo        ENUM('VERIFICACION', 'DOBLE_FACTOR') NOT NULL,
  token_hash  CHAR(64)     NOT NULL,
  vence       DATETIME     NOT NULL,
  usado       BOOLEAN      NOT NULL DEFAULT FALSE,  -- TRUE = ya no sirve

  PRIMARY KEY (id),
  FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  INDEX (token_hash)       -- acelera buscar el código que escribió el cliente
);


-- =====================================================================
--  9. AUDITORIA  (HU-24 Auditoría de accesos)
--  Historial de la actividad de seguridad de cada cuenta. Solo se
--  agregan filas: la app no tiene forma de editarlas ni borrarlas.
--  Nunca guarda contraseñas, respuestas ni códigos.
-- =====================================================================
CREATE TABLE auditoria (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id   INT UNSIGNED NULL,            -- NULL si el correo no existe
  correo       VARCHAR(254) NOT NULL,        -- el correo que se escribió
  fecha        DATE         NOT NULL DEFAULT (CURRENT_DATE),   -- hora de Costa Rica
  hora         TIME         NOT NULL DEFAULT (CURRENT_TIME),
  actividad    ENUM('REGISTRO', 'LOGIN_EXITOSO', 'LOGIN_FALLIDO', 'BLOQUEO',
                    'CAMBIO_CONTRASENA', 'RECUPERACION') NOT NULL,
  resultado    ENUM('EXITO', 'FALLO') NOT NULL,
  ip           VARCHAR(45)  NULL,            -- 45 = largo máximo de una IPv6
  dispositivo  VARCHAR(200) NULL,            -- el "User-Agent" que envía la app

  PRIMARY KEY (id),
  FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  INDEX (fecha, hora)      -- acelera consultar por fecha
);


-- Fin de 01_tablas.sql
