-- =====================================================================
--  AL FORNO · Base de datos
--  01_tablas.sql  →  Estructura: tablas y llaves
--
--  Versión 2.0 · 8 de octubre de 2026 (versión simplificada)
--  Motor: MySQL 8.0 o superior
--  Basado en: Historias de usuario v2.2
--
--  Orden de ejecución:
--    1. 01_tablas.sql             (este archivo)
--    2. 02_procedimientos.sql     (procedimientos almacenados)
--    3. 03_datos_iniciales.sql    (administrador, menú y agenda)
--
--  ⚠ Este script BORRA y vuelve a crear la base al_forno.
--    Úselo solo en desarrollo o en una instalación nueva.
-- =====================================================================

-- ---------------------------------------------------------------------
--  DECISIONES DE DISEÑO (versión 2.0)
--  · 8 tablas: solo lo que piden las historias de usuario.
--  · El horario y los datos del restaurante NO están aquí: la app no los
--    edita, así que están quemados en la API (api/src/config/restaurante.js).
--  · Las listas fijas (rol, categoría, estados, motivos) son columnas ENUM
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
--  1. USUARIO  (HU-01 Registro, HU-02 Iniciar sesión, HU-14 Administrador)
--  Clientes y administradores en una sola tabla. El administrador no
--  tiene cédula ni teléfono (quedan en NULL).
-- =====================================================================
CREATE TABLE usuario (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  rol              ENUM('CLIENTE', 'ADMIN') NOT NULL DEFAULT 'CLIENTE',
  nombre_completo  VARCHAR(100) NOT NULL,
  cedula           CHAR(9)      NULL,        -- 9 dígitos (lo valida la API)
  telefono         CHAR(8)      NULL,        -- 8 dígitos (lo valida la API)
  correo           VARCHAR(254) NOT NULL,
  contrasena_hash  CHAR(60)     NOT NULL,    -- la API la cifra con bcrypt; nunca la contraseña

  PRIMARY KEY (id),
  UNIQUE (correo),     -- HU-01: no se repite el correo
  UNIQUE (cedula)      -- HU-01: no se repite la cédula (varios NULL sí se permiten)
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
  agotado      BOOLEAN      NOT NULL DEFAULT FALSE,  -- se ve con la etiqueta "Agotado"
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
  -- El orden del ENUM es el orden obligatorio de los estados
  estado            ENUM('Recibido', 'En preparación', 'Listo para recoger', 'Entregado')
                    NOT NULL DEFAULT 'Recibido',
  nota              VARCHAR(200) NULL,                      -- ej. "sin cebolla"
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
  motivo      ENUM('Reserva de mesa', 'Celebración o cumpleaños', 'Evento privado', 'Otro')
              NOT NULL DEFAULT 'Reserva de mesa',
  comentario  VARCHAR(250)     NULL,
  estado      ENUM('Confirmada', 'Cancelada') NOT NULL DEFAULT 'Confirmada',

  PRIMARY KEY (id),
  FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  -- Índice: acelera contar las reservas de una fecha y hora (máximo 3)
  INDEX (fecha, hora)
);


-- =====================================================================
--  6. AGENDA  (HU-12 Agenda, HU-13 Tickets, HU-19 Gestionar agenda)
--  Actividades fijas y eventos especiales en una sola tabla.
--  El día, la fecha y la hora se escriben en la descripción.
--  precio_entrada NULL = entrada gratuita · con precio = cover (se compra ticket)
-- =====================================================================
CREATE TABLE agenda (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(100) NOT NULL,
  descripcion     VARCHAR(500) NOT NULL,
  precio_entrada  INT UNSIGNED NULL,
  activo          BOOLEAN      NOT NULL DEFAULT TRUE,

  PRIMARY KEY (id)
);


-- =====================================================================
--  7. TICKET  (HU-13 Tickets y Mis tickets)
--  total guarda lo que se pagó: si cambia el cover, el ticket no cambia.
-- =====================================================================
CREATE TABLE ticket (
  id                INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  codigo            CHAR(11)         NOT NULL,   -- ej. AF-7K2M9QX4 (lo genera la API; se muestra como QR)
  usuario_id        INT UNSIGNED     NOT NULL,   -- el cliente
  agenda_id         INT UNSIGNED     NOT NULL,   -- el evento
  cantidad          TINYINT UNSIGNED NOT NULL,   -- de 1 a 6 (lo valida la API)
  total             INT UNSIGNED     NOT NULL,
  tarjeta_ultimos4  CHAR(4)          NOT NULL,

  PRIMARY KEY (id),
  UNIQUE (codigo),                               -- cada código es único
  FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  FOREIGN KEY (agenda_id)  REFERENCES agenda (id)
);

-- Fin de 01_tablas.sql
