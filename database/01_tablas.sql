-- =====================================================================
--  AL FORNO · Base de datos
--  01_tablas.sql  →  Estructura: tablas, llaves, restricciones e índices
--
--  Versión 1.0 · 6 de octubre de 2026
--  Motor: MySQL 8.0.16 o superior (requiere CHECK y columnas generadas)
--  Basado en: Historias de usuario v2.1 y Arquitectura v2.0
--
--  Orden de ejecución:
--    1. 01_tablas.sql             (este archivo)
--    2. 02_procedimientos.sql     (procedimientos almacenados)
--    3. 03_datos_iniciales.sql    (horario, categorías, administrador...)
--
--  ⚠ Este script BORRA y vuelve a crear la base al_forno.
--    Úselo solo en desarrollo o en una instalación nueva.
-- =====================================================================

-- ---------------------------------------------------------------------
--  CÓMO LEER ESTE ARCHIVO
--  · CREATE TABLE nombre ( columnas..., restricciones... ) crea una tabla.
--  · Tipos: INT UNSIGNED (entero sin negativos), TINYINT/SMALLINT (enteros
--    pequeños), VARCHAR(n) (texto de hasta n), CHAR(n) (texto de largo fijo),
--    BOOLEAN (0 o 1), DATE (fecha), TIME (hora), DATETIME (fecha y hora).
--  · NOT NULL: dato obligatorio.  NULL: puede quedar vacío.
--  · DEFAULT: valor que se usa si no se envía uno.
--  · AUTO_INCREMENT: MySQL asigna 1, 2, 3... automáticamente.
--  · Prefijos de las restricciones (así los errores dicen qué regla falló):
--      pk_ llave primaria    fk_ llave foránea    uq_ valor único
--      ck_ CHECK (condición que debe cumplirse)    ix_ índice
--  · Columna "AS (...) STORED": columna generada. MySQL la calcula sola a
--    partir de otras columnas y nunca se escribe a mano.
--  · ON UPDATE CURRENT_TIMESTAMP: la fecha se actualiza sola al modificar la fila.
--  · ENGINE = InnoDB: motor que soporta llaves foráneas y transacciones.
--  · COMMENT: descripción que queda guardada dentro de MySQL.
-- ---------------------------------------------------------------------

-- Los scripts están en UTF-8. SET NAMES evita que las tildes, la ñ y el ₡
-- se guarden dañadas si el cliente de MySQL usa otra codificación.
SET NAMES utf8mb4;

DROP DATABASE IF EXISTS al_forno;

CREATE DATABASE al_forno
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;   -- tildes, ñ y ₡; comparaciones sin distinguir mayúsculas

USE al_forno;

-- Costa Rica no usa horario de verano: UTC-6 todo el año.
-- La API debe abrir cada conexión con esta misma zona (mysql2: timezone '-06:00'
-- y SET time_zone = '-06:00'), así CURRENT_TIMESTAMP y CURDATE() dan la hora local.
SET time_zone = '-06:00';


-- =====================================================================
--  BLOQUE 1 · CATÁLOGOS DEL SISTEMA
--  Valores fijos que usa el código. La llave es un código legible
--  ('RECIBIDO', 'CLIENTE'...) para que las consultas y los procedimientos
--  no dependan de números mágicos.
-- =====================================================================

-- Roles de usuario (HU-01, HU-14)
CREATE TABLE rol (
  codigo  VARCHAR(20) NOT NULL,
  nombre  VARCHAR(40) NOT NULL,
  CONSTRAINT pk_rol PRIMARY KEY (codigo),
  CONSTRAINT uq_rol_nombre UNIQUE (nombre)
) ENGINE = InnoDB COMMENT = 'Roles: CLIENTE y ADMIN';

-- Días de la semana, numeración ISO: 1 = lunes … 7 = domingo.
-- En MySQL se obtiene con WEEKDAY(fecha) + 1 (no usar DAYOFWEEK, que empieza en domingo).
CREATE TABLE dia_semana (
  id      TINYINT UNSIGNED NOT NULL,
  nombre  VARCHAR(10)      NOT NULL,
  CONSTRAINT pk_dia_semana PRIMARY KEY (id),
  CONSTRAINT uq_dia_semana_nombre UNIQUE (nombre),
  CONSTRAINT ck_dia_semana_id CHECK (id BETWEEN 1 AND 7)
) ENGINE = InnoDB COMMENT = 'Días de la semana (ISO 1=lunes … 7=domingo)';

-- Estados del pedido (HU-09, HU-16). "orden" define la secuencia obligatoria.
CREATE TABLE estado_pedido (
  codigo     VARCHAR(20)      NOT NULL,
  nombre     VARCHAR(40)      NOT NULL,
  orden      TINYINT UNSIGNED NOT NULL,
  es_activo  BOOLEAN          NOT NULL COMMENT '1 = aparece en la lista de pedidos activos del administrador',
  CONSTRAINT pk_estado_pedido PRIMARY KEY (codigo),
  CONSTRAINT uq_estado_pedido_nombre UNIQUE (nombre),
  CONSTRAINT uq_estado_pedido_orden UNIQUE (orden)
) ENGINE = InnoDB COMMENT = 'Recibido → En preparación → Listo para recoger → Entregado';

-- Estados de la reserva (HU-10, HU-11, HU-18)
CREATE TABLE estado_reserva (
  codigo         VARCHAR(25) NOT NULL,
  nombre         VARCHAR(40) NOT NULL COMMENT 'Texto que ve el cliente',
  ocupa_espacio  BOOLEAN     NOT NULL COMMENT '1 = cuenta dentro del máximo de 3 por hora',
  CONSTRAINT pk_estado_reserva PRIMARY KEY (codigo),
  CONSTRAINT uq_estado_reserva_nombre UNIQUE (nombre)
) ENGINE = InnoDB;

-- Motivos de reserva (HU-10)
CREATE TABLE motivo_reserva (
  codigo  VARCHAR(20)      NOT NULL,
  nombre  VARCHAR(40)      NOT NULL,
  orden   TINYINT UNSIGNED NOT NULL COMMENT 'Orden en la lista de la app',
  activo  BOOLEAN          NOT NULL DEFAULT TRUE,
  CONSTRAINT pk_motivo_reserva PRIMARY KEY (codigo),
  CONSTRAINT uq_motivo_reserva_nombre UNIQUE (nombre)
) ENGINE = InnoDB;

-- Estados del ticket (HU-13, HU-19)
CREATE TABLE estado_ticket (
  codigo  VARCHAR(20) NOT NULL,
  nombre  VARCHAR(40) NOT NULL,
  CONSTRAINT pk_estado_ticket PRIMARY KEY (codigo),
  CONSTRAINT uq_estado_ticket_nombre UNIQUE (nombre)
) ENGINE = InnoDB;

-- Valores de los catálogos. Son parte de la estructura (el código depende
-- de ellos), por eso se cargan aquí y no en 03_datos_iniciales.sql.
INSERT INTO rol (codigo, nombre) VALUES
  ('CLIENTE', 'Cliente'),
  ('ADMIN',   'Administrador');

INSERT INTO dia_semana (id, nombre) VALUES
  (1, 'Lunes'), (2, 'Martes'), (3, 'Miércoles'), (4, 'Jueves'),
  (5, 'Viernes'), (6, 'Sábado'), (7, 'Domingo');

INSERT INTO estado_pedido (codigo, nombre, orden, es_activo) VALUES
  ('RECIBIDO',       'Recibido',           1, TRUE),
  ('EN_PREPARACION', 'En preparación',     2, TRUE),
  ('LISTO',          'Listo para recoger', 3, TRUE),
  ('ENTREGADO',      'Entregado',          4, FALSE);

INSERT INTO estado_reserva (codigo, nombre, ocupa_espacio) VALUES
  ('CONFIRMADA',            'Confirmada',                   TRUE),
  ('ASISTIO',               'Asistió',                      TRUE),
  ('NO_ASISTIO',            'No asistió',                   TRUE),
  ('CANCELADA_CLIENTE',     'Cancelada',                    FALSE),
  ('CANCELADA_RESTAURANTE', 'Cancelada por el restaurante', FALSE);

INSERT INTO motivo_reserva (codigo, nombre, orden) VALUES
  ('MESA',         'Reserva de mesa',          1),
  ('CELEBRACION',  'Celebración o cumpleaños', 2),
  ('EVENTO',       'Evento privado',           3),
  ('OTRO',         'Otro',                     4);

INSERT INTO estado_ticket (codigo, nombre) VALUES
  ('VALIDO', 'Válido'),
  ('USADO',  'Usado');


-- =====================================================================
--  BLOQUE 2 · MÓDULO CUENTA  (HU-01, HU-02, HU-14)
--  usuario = credenciales y rol (clientes y administradores)
--  cliente = datos que solo tiene un cliente (cédula y teléfono)
-- =====================================================================

CREATE TABLE usuario (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  rol_codigo           VARCHAR(20)  NOT NULL,
  nombre_completo      VARCHAR(100) NOT NULL,
  correo               VARCHAR(254) NOT NULL COMMENT 'Se guarda en minúsculas; único sin distinguir mayúsculas',
  contrasena_hash      CHAR(60)     NOT NULL COMMENT 'Hash bcrypt; nunca la contraseña',
  activo               BOOLEAN      NOT NULL DEFAULT TRUE COMMENT 'Bloqueo de la cuenta sin borrar su historial',
  ultimo_acceso        DATETIME     NULL,
  fecha_creacion       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_usuario PRIMARY KEY (id),
  CONSTRAINT uq_usuario_correo UNIQUE (correo),
  -- Permite que cliente apunte a (id, rol) y así garantizar que solo
  -- un usuario con rol CLIENTE tenga perfil de cliente.
  CONSTRAINT uq_usuario_id_rol UNIQUE (id, rol_codigo),
  CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_codigo) REFERENCES rol (codigo),
  CONSTRAINT ck_usuario_nombre CHECK (CHAR_LENGTH(TRIM(nombre_completo)) >= 3),
  CONSTRAINT ck_usuario_correo CHECK (correo REGEXP '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$'),
  CONSTRAINT ck_usuario_hash   CHECK (contrasena_hash LIKE '$2_$%')
) ENGINE = InnoDB COMMENT = 'Cuentas de acceso (clientes y administradores)';

CREATE TABLE cliente (
  usuario_id      INT UNSIGNED NOT NULL,
  rol_codigo      VARCHAR(20)  NOT NULL DEFAULT 'CLIENTE' COMMENT 'Siempre CLIENTE; amarra el perfil al rol',
  cedula          CHAR(9)      NOT NULL,
  telefono        CHAR(8)      NOT NULL,
  fecha_creacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_cliente PRIMARY KEY (usuario_id),
  CONSTRAINT uq_cliente_cedula UNIQUE (cedula),
  CONSTRAINT fk_cliente_usuario FOREIGN KEY (usuario_id, rol_codigo)
    REFERENCES usuario (id, rol_codigo),
  CONSTRAINT ck_cliente_rol      CHECK (rol_codigo = 'CLIENTE'),
  CONSTRAINT ck_cliente_cedula   CHECK (cedula   REGEXP '^[0-9]{9}$'),
  CONSTRAINT ck_cliente_telefono CHECK (telefono REGEXP '^[0-9]{8}$')
) ENGINE = InnoDB COMMENT = 'Perfil del cliente (1 a 1 con usuario)';


-- =====================================================================
--  BLOQUE 3 · MÓDULO INFORMACIÓN  (HU-04, HU-05, HU-06, HU-17)
-- =====================================================================

-- Datos del local (HU-05). Una sola fila (id = 1).
CREATE TABLE restaurante (
  id                   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  nombre               VARCHAR(60)  NOT NULL,
  direccion            VARCHAR(200) NOT NULL,
  senas                VARCHAR(300) NULL COMMENT 'Señas para llegar',
  telefono             CHAR(8)      NOT NULL,
  whatsapp             CHAR(8)      NULL,
  fecha_actualizacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_restaurante PRIMARY KEY (id),
  CONSTRAINT ck_restaurante_unico   CHECK (id = 1),
  CONSTRAINT ck_restaurante_tel     CHECK (telefono REGEXP '^[0-9]{8}$'),
  CONSTRAINT ck_restaurante_wa      CHECK (whatsapp IS NULL OR whatsapp REGEXP '^[0-9]{8}$')
) ENGINE = InnoDB COMMENT = 'Ubicación y contacto (una sola fila)';

-- Horario de atención (HU-04, HU-07, HU-10). Una fila por día.
-- Si hora_cierre <= hora_apertura, el cierre es al día siguiente
-- (viernes y sábado: 17:00 → 01:00).
CREATE TABLE horario (
  dia_semana_id         TINYINT UNSIGNED NOT NULL,
  abierto               BOOLEAN          NOT NULL,
  hora_apertura         TIME             NULL,
  hora_cierre           TIME             NULL,
  cierra_dia_siguiente  BOOLEAN AS (abierto AND hora_cierre <= hora_apertura) STORED,

  CONSTRAINT pk_horario PRIMARY KEY (dia_semana_id),
  CONSTRAINT fk_horario_dia FOREIGN KEY (dia_semana_id) REFERENCES dia_semana (id),
  CONSTRAINT ck_horario_horas CHECK (
       (abierto = FALSE AND hora_apertura IS NULL AND hora_cierre IS NULL)
    OR (abierto = TRUE  AND hora_apertura IS NOT NULL AND hora_cierre IS NOT NULL
                        AND hora_apertura <> hora_cierre)
  )
) ENGINE = InnoDB COMMENT = 'Horario fijo de atención (no se edita desde la app)';

-- Promociones informativas (HU-06, HU-17)
CREATE TABLE promocion (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo               VARCHAR(80)  NOT NULL,
  descripcion          VARCHAR(500) NOT NULL,
  fecha_inicio         DATE         NOT NULL,
  fecha_fin            DATE         NOT NULL,
  activa               BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_por           INT UNSIGNED NOT NULL,
  actualizado_por      INT UNSIGNED NULL,
  fecha_creacion       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_promocion PRIMARY KEY (id),
  CONSTRAINT fk_promocion_creado      FOREIGN KEY (creado_por)      REFERENCES usuario (id),
  CONSTRAINT fk_promocion_actualizado FOREIGN KEY (actualizado_por) REFERENCES usuario (id),
  CONSTRAINT ck_promocion_fechas CHECK (fecha_fin >= fecha_inicio),
  CONSTRAINT ck_promocion_titulo CHECK (CHAR_LENGTH(TRIM(titulo)) > 0),
  INDEX ix_promocion_vigencia (activa, fecha_inicio, fecha_fin)
) ENGINE = InnoDB;

-- Días en que aplica cada promoción (relación N a N con dia_semana)
CREATE TABLE promocion_dia (
  promocion_id   INT UNSIGNED     NOT NULL,
  dia_semana_id  TINYINT UNSIGNED NOT NULL,

  CONSTRAINT pk_promocion_dia PRIMARY KEY (promocion_id, dia_semana_id),
  CONSTRAINT fk_promocion_dia_promocion FOREIGN KEY (promocion_id)
    REFERENCES promocion (id) ON DELETE CASCADE,
  CONSTRAINT fk_promocion_dia_dia FOREIGN KEY (dia_semana_id) REFERENCES dia_semana (id)
) ENGINE = InnoDB COMMENT = 'Días válidos de cada promoción';


-- =====================================================================
--  BLOQUE 4 · MÓDULO MENÚ  (HU-03, HU-15)
-- =====================================================================

CREATE TABLE categoria (
  id                   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre               VARCHAR(50)       NOT NULL,
  orden                TINYINT UNSIGNED  NOT NULL DEFAULT 0 COMMENT 'Orden en el menú',
  activa               BOOLEAN           NOT NULL DEFAULT TRUE,
  fecha_creacion       DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_categoria PRIMARY KEY (id),
  CONSTRAINT uq_categoria_nombre UNIQUE (nombre)
) ENGINE = InnoDB COMMENT = 'Pizzas, Cucina italiana, Coctelería, Cervezas';

CREATE TABLE producto (
  id                   INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  categoria_id         SMALLINT UNSIGNED NOT NULL,
  nombre               VARCHAR(80)       NOT NULL,
  descripcion          VARCHAR(300)      NOT NULL,
  precio               INT UNSIGNED      NOT NULL COMMENT 'Colones enteros',
  agotado              BOOLEAN           NOT NULL DEFAULT FALSE COMMENT 'Se ve con etiqueta "Agotado" y no se puede pedir',
  activo               BOOLEAN           NOT NULL DEFAULT TRUE  COMMENT '0 = eliminado (borrado lógico)',
  -- Nombre único solo entre productos activos: un producto eliminado
  -- no impide crear otro con el mismo nombre.
  nombre_activo        VARCHAR(80) AS (IF(activo, nombre, NULL)) STORED,
  creado_por           INT UNSIGNED      NOT NULL,
  actualizado_por      INT UNSIGNED      NULL,
  fecha_creacion       DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_producto PRIMARY KEY (id),
  CONSTRAINT uq_producto_nombre_activo UNIQUE (nombre_activo),
  CONSTRAINT fk_producto_categoria   FOREIGN KEY (categoria_id)    REFERENCES categoria (id),
  CONSTRAINT fk_producto_creado      FOREIGN KEY (creado_por)      REFERENCES usuario (id),
  CONSTRAINT fk_producto_actualizado FOREIGN KEY (actualizado_por) REFERENCES usuario (id),
  CONSTRAINT ck_producto_precio      CHECK (precio > 0),
  CONSTRAINT ck_producto_nombre      CHECK (CHAR_LENGTH(TRIM(nombre)) > 0),
  CONSTRAINT ck_producto_descripcion CHECK (CHAR_LENGTH(TRIM(descripcion)) > 0),
  INDEX ix_producto_menu (activo, categoria_id, nombre)
) ENGINE = InnoDB;


-- =====================================================================
--  BLOQUE 5 · MÓDULO PAGOS  (HU-08, HU-13)
--  Solo se guardan pagos APROBADOS por el simulador. Nunca se guarda
--  el número completo, el titular, el vencimiento ni el CVV.
-- =====================================================================

CREATE TABLE pago (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo                 VARCHAR(10)  NOT NULL COMMENT 'PEDIDO o TICKET',
  monto                INT UNSIGNED NOT NULL COMMENT 'Colones',
  ultimos4             CHAR(4)      NOT NULL,
  codigo_autorizacion  VARCHAR(20)  NOT NULL COMMENT 'Ej. SIM-482913',
  fecha_pago           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_pago PRIMARY KEY (id),
  CONSTRAINT uq_pago_autorizacion UNIQUE (codigo_autorizacion),
  -- Permite que pedido y compra_ticket apunten a (id, tipo): un pago
  -- de pedido no puede usarse para tickets y al revés.
  CONSTRAINT uq_pago_id_tipo UNIQUE (id, tipo),
  CONSTRAINT ck_pago_tipo     CHECK (tipo IN ('PEDIDO', 'TICKET')),
  CONSTRAINT ck_pago_monto    CHECK (monto > 0),
  CONSTRAINT ck_pago_ultimos4 CHECK (ultimos4 REGEXP '^[0-9]{4}$'),
  CONSTRAINT ck_pago_codigo   CHECK (codigo_autorizacion LIKE 'SIM-%')
) ENGINE = InnoDB COMMENT = 'Pagos aprobados por el simulador';


-- =====================================================================
--  BLOQUE 6 · MÓDULO PEDIDOS  (HU-07, HU-08, HU-09, HU-16)
--  El carrito NO se guarda en la base: vive en la app hasta que el pago
--  se aprueba (Arquitectura v2.0, sección 6).
-- =====================================================================

CREATE TABLE pedido (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Número de pedido',
  cliente_id           INT UNSIGNED NOT NULL,
  estado_codigo        VARCHAR(20)  NOT NULL DEFAULT 'RECIBIDO',
  nota                 VARCHAR(200) NULL COMMENT 'Ej. "sin cebolla"',
  total                INT UNSIGNED NOT NULL COMMENT 'Suma de pedido_detalle.subtotal; se guarda para el comprobante',
  pago_id              INT UNSIGNED NOT NULL,
  pago_tipo            VARCHAR(10)  NOT NULL DEFAULT 'PEDIDO',
  fecha_pedido         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_pedido PRIMARY KEY (id),
  CONSTRAINT uq_pedido_pago UNIQUE (pago_id),
  CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id)        REFERENCES cliente (usuario_id),
  CONSTRAINT fk_pedido_estado  FOREIGN KEY (estado_codigo)     REFERENCES estado_pedido (codigo),
  CONSTRAINT fk_pedido_pago    FOREIGN KEY (pago_id, pago_tipo) REFERENCES pago (id, tipo),
  CONSTRAINT ck_pedido_pago_tipo CHECK (pago_tipo = 'PEDIDO'),
  CONSTRAINT ck_pedido_total     CHECK (total > 0),
  INDEX ix_pedido_cliente (cliente_id, fecha_pedido),     -- Mis pedidos (HU-09)
  INDEX ix_pedido_estado  (estado_codigo, fecha_pedido),  -- Pedidos activos e historial (HU-16)
  INDEX ix_pedido_fecha   (fecha_pedido)                  -- Historial por fecha (HU-16)
) ENGINE = InnoDB COMMENT = 'Pedidos para llevar, siempre pagados';

CREATE TABLE pedido_detalle (
  pedido_id        INT UNSIGNED     NOT NULL,
  producto_id      INT UNSIGNED     NOT NULL,
  nombre_producto  VARCHAR(80)      NOT NULL COMMENT 'Copia del nombre al momento de la compra',
  precio_unitario  INT UNSIGNED     NOT NULL COMMENT 'Copia del precio al momento de la compra',
  cantidad         TINYINT UNSIGNED NOT NULL,
  subtotal         INT UNSIGNED AS (precio_unitario * cantidad) STORED,

  CONSTRAINT pk_pedido_detalle PRIMARY KEY (pedido_id, producto_id),
  CONSTRAINT fk_detalle_pedido   FOREIGN KEY (pedido_id)   REFERENCES pedido (id),
  CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) REFERENCES producto (id),
  CONSTRAINT ck_detalle_cantidad CHECK (cantidad BETWEEN 1 AND 10),
  CONSTRAINT ck_detalle_precio   CHECK (precio_unitario > 0)
) ENGINE = InnoDB COMMENT = 'Productos de cada pedido';

-- Bitácora de estados: quién cambió el pedido y cuándo (HU-16)
CREATE TABLE pedido_estado_historial (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  pedido_id      INT UNSIGNED    NOT NULL,
  estado_codigo  VARCHAR(20)     NOT NULL,
  usuario_id     INT UNSIGNED    NOT NULL COMMENT 'Cliente (al crear) o administrador (al avanzar)',
  fecha          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_pedido_estado_historial PRIMARY KEY (id),
  CONSTRAINT uq_historial_pedido_estado UNIQUE (pedido_id, estado_codigo), -- cada estado una sola vez
  CONSTRAINT fk_historial_pedido  FOREIGN KEY (pedido_id)     REFERENCES pedido (id),
  CONSTRAINT fk_historial_estado  FOREIGN KEY (estado_codigo) REFERENCES estado_pedido (codigo),
  CONSTRAINT fk_historial_usuario FOREIGN KEY (usuario_id)    REFERENCES usuario (id)
) ENGINE = InnoDB COMMENT = 'Cambios de estado de cada pedido';


-- =====================================================================
--  BLOQUE 7 · MÓDULO RESERVAS  (HU-10, HU-11, HU-18)
-- =====================================================================

-- Contador de reservas por fecha y hora. Existe para poder bloquear la
-- fila con SELECT ... FOR UPDATE y no pasar de 3 reservas (Arquitectura §7).
CREATE TABLE franja_reserva (
  fecha              DATE             NOT NULL,
  hora               TIME             NOT NULL,
  reservas_ocupadas  TINYINT UNSIGNED NOT NULL DEFAULT 0,

  CONSTRAINT pk_franja_reserva PRIMARY KEY (fecha, hora),
  CONSTRAINT ck_franja_maximo    CHECK (reservas_ocupadas BETWEEN 0 AND 3),
  CONSTRAINT ck_franja_hora_exacta CHECK (MINUTE(hora) = 0 AND SECOND(hora) = 0)
) ENGINE = InnoDB COMMENT = 'Espacios ocupados por hora (máximo 3)';

CREATE TABLE reserva (
  id                   INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  cliente_id           INT UNSIGNED     NOT NULL,
  fecha                DATE             NOT NULL,
  hora                 TIME             NOT NULL,
  personas             TINYINT UNSIGNED NOT NULL,
  motivo_codigo        VARCHAR(20)      NOT NULL DEFAULT 'MESA',
  comentario           VARCHAR(250)     NULL,
  estado_codigo        VARCHAR(25)      NOT NULL DEFAULT 'CONFIRMADA',
  -- Una sola reserva no cancelada por cliente y día (HU-10): la columna
  -- vale la fecha mientras la reserva sigue en pie y NULL si se cancela.
  fecha_no_cancelada   DATE AS (
    IF(estado_codigo IN ('CANCELADA_CLIENTE', 'CANCELADA_RESTAURANTE'), NULL, fecha)
  ) STORED,
  fecha_cancelacion    DATETIME         NULL,
  actualizado_por      INT UNSIGNED     NULL COMMENT 'Quién canceló o marcó la asistencia',
  fecha_creacion       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_reserva PRIMARY KEY (id),
  CONSTRAINT uq_reserva_cliente_dia UNIQUE (cliente_id, fecha_no_cancelada),
  CONSTRAINT fk_reserva_cliente FOREIGN KEY (cliente_id)    REFERENCES cliente (usuario_id),
  CONSTRAINT fk_reserva_franja  FOREIGN KEY (fecha, hora)   REFERENCES franja_reserva (fecha, hora),
  CONSTRAINT fk_reserva_motivo  FOREIGN KEY (motivo_codigo) REFERENCES motivo_reserva (codigo),
  CONSTRAINT fk_reserva_estado  FOREIGN KEY (estado_codigo) REFERENCES estado_reserva (codigo),
  CONSTRAINT fk_reserva_actualizado FOREIGN KEY (actualizado_por) REFERENCES usuario (id),
  CONSTRAINT ck_reserva_personas CHECK (personas BETWEEN 1 AND 8),
  CONSTRAINT ck_reserva_cancelacion CHECK (
    (estado_codigo IN ('CANCELADA_CLIENTE', 'CANCELADA_RESTAURANTE')) = (fecha_cancelacion IS NOT NULL)
  ),
  INDEX ix_reserva_dia (fecha, hora, estado_codigo),  -- Reservas del día (HU-18)
  INDEX ix_reserva_cliente (cliente_id, fecha)        -- Mis reservas (HU-11)
) ENGINE = InnoDB;


-- =====================================================================
--  BLOQUE 8 · MÓDULO EVENTOS  (HU-12, HU-13, HU-19)
-- =====================================================================

-- Actividades fijas de la semana: entrada libre con consumo (HU-12)
CREATE TABLE actividad (
  id                   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dia_semana_id        TINYINT UNSIGNED  NOT NULL,
  hora                 TIME              NOT NULL,
  nombre               VARCHAR(80)       NOT NULL,
  descripcion          VARCHAR(300)      NOT NULL,
  activa               BOOLEAN           NOT NULL DEFAULT TRUE,
  creado_por           INT UNSIGNED      NOT NULL,
  actualizado_por      INT UNSIGNED      NULL,
  fecha_creacion       DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_actividad PRIMARY KEY (id),
  CONSTRAINT fk_actividad_dia         FOREIGN KEY (dia_semana_id)   REFERENCES dia_semana (id),
  CONSTRAINT fk_actividad_creado      FOREIGN KEY (creado_por)      REFERENCES usuario (id),
  CONSTRAINT fk_actividad_actualizado FOREIGN KEY (actualizado_por) REFERENCES usuario (id),
  CONSTRAINT ck_actividad_nombre CHECK (CHAR_LENGTH(TRIM(nombre)) > 0),
  INDEX ix_actividad_agenda (activa, dia_semana_id, hora)
) ENGINE = InnoDB COMMENT = 'Agenda semanal fija (entrada libre)';

-- Eventos especiales con venta de entradas (HU-12, HU-13, HU-19)
CREATE TABLE evento (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre               VARCHAR(100) NOT NULL,
  descripcion          VARCHAR(500) NOT NULL,
  fecha                DATE         NOT NULL,
  hora                 TIME         NOT NULL,
  precio_entrada       INT UNSIGNED NOT NULL COMMENT 'Colones',
  cupo_total           SMALLINT     NOT NULL,
  entradas_vendidas    SMALLINT     NOT NULL DEFAULT 0,
  cupo_disponible      SMALLINT AS (cupo_total - entradas_vendidas) STORED,
  activo               BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_por           INT UNSIGNED NOT NULL,
  actualizado_por      INT UNSIGNED NULL,
  fecha_creacion       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_evento PRIMARY KEY (id),
  CONSTRAINT fk_evento_creado      FOREIGN KEY (creado_por)      REFERENCES usuario (id),
  CONSTRAINT fk_evento_actualizado FOREIGN KEY (actualizado_por) REFERENCES usuario (id),
  CONSTRAINT ck_evento_precio  CHECK (precio_entrada > 0),
  CONSTRAINT ck_evento_cupo    CHECK (cupo_total > 0),
  -- Nunca se vende de más y el cupo no puede bajar de lo vendido (HU-19)
  CONSTRAINT ck_evento_vendidas CHECK (entradas_vendidas BETWEEN 0 AND cupo_total),
  CONSTRAINT ck_evento_nombre  CHECK (CHAR_LENGTH(TRIM(nombre)) > 0),
  INDEX ix_evento_agenda (activo, fecha, hora)
) ENGINE = InnoDB;

-- Compra de entradas: una compra = un ticket con un código QR (HU-13)
CREATE TABLE compra_ticket (
  id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  codigo           CHAR(11)         NOT NULL COMMENT 'Ej. AF-7K2M9QX4; se muestra como QR',
  cliente_id       INT UNSIGNED     NOT NULL,
  evento_id        INT UNSIGNED     NOT NULL,
  cantidad         TINYINT UNSIGNED NOT NULL,
  precio_unitario  INT UNSIGNED     NOT NULL COMMENT 'Copia del precio al momento de la compra',
  total            INT UNSIGNED AS (precio_unitario * cantidad) STORED,
  pago_id          INT UNSIGNED     NOT NULL,
  pago_tipo        VARCHAR(10)      NOT NULL DEFAULT 'TICKET',
  estado_codigo    VARCHAR(20)      NOT NULL DEFAULT 'VALIDO',
  fecha_compra     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_uso        DATETIME         NULL,
  validado_por     INT UNSIGNED     NULL COMMENT 'Administrador que lo marcó como usado',

  CONSTRAINT pk_compra_ticket PRIMARY KEY (id),
  CONSTRAINT uq_compra_ticket_codigo UNIQUE (codigo),
  CONSTRAINT uq_compra_ticket_pago   UNIQUE (pago_id),
  CONSTRAINT fk_ticket_cliente  FOREIGN KEY (cliente_id)        REFERENCES cliente (usuario_id),
  CONSTRAINT fk_ticket_evento   FOREIGN KEY (evento_id)         REFERENCES evento (id),
  CONSTRAINT fk_ticket_pago     FOREIGN KEY (pago_id, pago_tipo) REFERENCES pago (id, tipo),
  CONSTRAINT fk_ticket_estado   FOREIGN KEY (estado_codigo)     REFERENCES estado_ticket (codigo),
  CONSTRAINT fk_ticket_validado FOREIGN KEY (validado_por)      REFERENCES usuario (id),
  CONSTRAINT ck_ticket_pago_tipo CHECK (pago_tipo = 'TICKET'),
  CONSTRAINT ck_ticket_cantidad  CHECK (cantidad BETWEEN 1 AND 6),
  CONSTRAINT ck_ticket_precio    CHECK (precio_unitario > 0),
  CONSTRAINT ck_ticket_codigo    CHECK (codigo REGEXP '^AF-[A-Z0-9]{8}$'),
  CONSTRAINT ck_ticket_uso CHECK (
    (estado_codigo = 'USADO') = (fecha_uso IS NOT NULL AND validado_por IS NOT NULL)
  ),
  INDEX ix_ticket_cliente (cliente_id, fecha_compra)   -- Mis tickets (HU-13)
) ENGINE = InnoDB COMMENT = 'Tickets de eventos especiales';

-- Fin de 01_tablas.sql
