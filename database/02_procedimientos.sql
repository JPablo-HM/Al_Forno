-- =====================================================================
--  AL FORNO · Base de datos
--  02_procedimientos.sql  →  Funciones y procedimientos almacenados
--
--  Versión 1.0 · 6 de octubre de 2026
--  Ejecutar después de 01_tablas.sql. Se puede volver a ejecutar sin
--  borrar datos (cada rutina se elimina y se vuelve a crear).
--
--  ---------------------------------------------------------------
--  REPARTO DE VALIDACIONES (Arquitectura v2.0, "Dónde vive cada regla")
--    · API (express-validator): formato de los datos.
--    · Service (Node + dayjs): reglas que dependen del RELOJ o del
--      CALENDARIO: pedidos hasta 30 min antes del cierre; reservas sin
--      lunes, sin fechas pasadas, hasta 30 días y dentro del horario;
--      cancelar hasta 2 h antes; eventos sin fecha pasada.
--    · Procedimientos (este archivo): reglas que dependen del ESTADO DE
--      LOS DATOS y deben ser atómicas: existencia, estados, cupos,
--      duplicados, productos agotados, permisos de administrador.
--    · Tablas (01_tablas.sql): última barrera con FK, UNIQUE y CHECK.
--
--  ---------------------------------------------------------------
--  CÓDIGOS DE ERROR
--  Todo error de negocio sale con SQLSTATE '45000', un MYSQL_ERRNO y
--  un mensaje listo para mostrar al usuario (máximo 128 caracteres).
--  El errno - 5000 es el código HTTP que debe responder la API:
--
--    5400 → 400  Datos inválidos
--    5403 → 403  Sin permiso (usuario no es administrador, cuenta inactiva)
--    5404 → 404  No existe (o no pertenece al usuario)
--    5409 → 409  Conflicto: duplicado, sin espacio, agotado, estado no válido
--
--  En Node (middleware central de errores):
--    if (err.sqlState === '45000') status = err.errno - 5000; mensaje = err.sqlMessage
--    cualquier otro error → 500 "Ocurrió un error, intente de nuevo" (sin detalles)
--
--  ---------------------------------------------------------------
--  FECHAS: todas las reglas usan fn_ahora() / fn_hoy(), que devuelven la
--  hora de Costa Rica (UTC-6) sin importar la zona del servidor.
-- =====================================================================

-- ---------------------------------------------------------------------
--  CÓMO LEER UN PROCEDIMIENTO
--  · DELIMITER $$ cambia el fin de instrucción de ";" a "$$" para que MySQL
--    no corte el procedimiento en el primer ";" que tiene adentro.
--  · DROP ... IF EXISTS + CREATE: permite volver a ejecutar el archivo.
--  · p_... = parámetro que envía la API.  v_... = variable local.
--  · DECLARE: declara variables y manejadores (siempre al inicio del BEGIN).
--  · DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
--    → si ocurre cualquier error: deshace la transacción y reenvía el error.
--  · DECLARE EXIT HANDLER FOR 1062 → 1062 es "valor duplicado" (un UNIQUE).
--  · SELECT ... INTO v_x: guarda el resultado de la consulta en una variable.
--  · CALL sp_error(5409, 'mensaje'): corta con un error de negocio que la
--    API convierte en HTTP 409 (código - 5000).
--  · START TRANSACTION ... COMMIT: todo lo de adentro se guarda junto o nada.
--  · SELECT ... FOR UPDATE: bloquea las filas leídas hasta el COMMIT; otra
--    transacción que quiera esas filas espera su turno (control de cupos).
--  · FOR SHARE: bloqueo de lectura (se puede leer, pero no modificar).
--  · JSON_TABLE(...): convierte un arreglo JSON (el carrito) en filas.
--  · LAST_INSERT_ID(): el id que AUTO_INCREMENT le dio a la última fila.
--  · El último SELECT de cada procedimiento es lo que recibe la API.
-- ---------------------------------------------------------------------

-- Los scripts están en UTF-8. SET NAMES evita que las tildes, la ñ y el ₡
-- se guarden dañadas si el cliente de MySQL usa otra codificación.
SET NAMES utf8mb4;

USE al_forno;

DELIMITER $$

-- =====================================================================
--  BLOQUE 0 · UTILIDADES
-- =====================================================================

-- Hora actual de Costa Rica (UTC-6 todo el año, sin horario de verano)
DROP FUNCTION IF EXISTS fn_ahora $$
CREATE FUNCTION fn_ahora() RETURNS DATETIME
  NOT DETERMINISTIC NO SQL
  COMMENT 'Fecha y hora actual en Costa Rica'
BEGIN
  RETURN CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '-06:00');
END $$

DROP FUNCTION IF EXISTS fn_hoy $$
CREATE FUNCTION fn_hoy() RETURNS DATE
  NOT DETERMINISTIC NO SQL
  COMMENT 'Fecha actual en Costa Rica'
BEGIN
  RETURN DATE(fn_ahora());
END $$

-- Código de ticket aleatorio y seguro: AF- + 8 caracteres.
-- Usa un alfabeto sin 0, 1, I ni O para que no se confundan al escribirlo.
DROP FUNCTION IF EXISTS fn_generar_codigo_ticket $$
CREATE FUNCTION fn_generar_codigo_ticket() RETURNS CHAR(11)
  NOT DETERMINISTIC NO SQL
  COMMENT 'Genera un código AF-XXXXXXXX con RANDOM_BYTES'
BEGIN
  DECLARE v_alfabeto CHAR(32) DEFAULT '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  DECLARE v_bytes    VARBINARY(8) DEFAULT RANDOM_BYTES(8);
  DECLARE v_codigo   VARCHAR(8) DEFAULT '';
  DECLARE i          TINYINT DEFAULT 1;
  WHILE i <= 8 DO
    SET v_codigo = CONCAT(v_codigo,
          SUBSTRING(v_alfabeto, (ASCII(SUBSTRING(v_bytes, i, 1)) % 32) + 1, 1));
    SET i = i + 1;
  END WHILE;
  RETURN CONCAT('AF-', v_codigo);
END $$

-- Lanza un error de negocio con código y mensaje
DROP PROCEDURE IF EXISTS sp_error $$
CREATE PROCEDURE sp_error(IN p_codigo SMALLINT UNSIGNED, IN p_mensaje VARCHAR(128))
  COMMENT 'Lanza SQLSTATE 45000 con MYSQL_ERRNO = p_codigo'
BEGIN
  SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = p_codigo, MESSAGE_TEXT = p_mensaje;
END $$

-- Verifica que el usuario sea un administrador activo (defensa adicional
-- al middleware de roles de la API)
DROP PROCEDURE IF EXISTS sp_validar_admin $$
CREATE PROCEDURE sp_validar_admin(IN p_usuario_id INT UNSIGNED)
  COMMENT 'Error 5403 si el usuario no es ADMIN activo'
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuario
                  WHERE id = p_usuario_id AND rol_codigo = 'ADMIN' AND activo) THEN
    CALL sp_error(5403, 'No tiene permiso para realizar esta acción');
  END IF;
END $$

-- Verifica que el usuario sea un cliente con la cuenta activa
DROP PROCEDURE IF EXISTS sp_validar_cliente $$
CREATE PROCEDURE sp_validar_cliente(IN p_cliente_id INT UNSIGNED)
  COMMENT 'Error 5403 si el usuario no es CLIENTE activo'
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cliente c JOIN usuario u ON u.id = c.usuario_id
                  WHERE c.usuario_id = p_cliente_id AND u.activo) THEN
    CALL sp_error(5403, 'Debe iniciar sesión con una cuenta de cliente');
  END IF;
END $$


-- =====================================================================
--  BLOQUE 1 · MÓDULO CUENTA  (HU-01, HU-02, HU-14)
-- =====================================================================

-- HU-01 · Registro público. Siempre crea el rol CLIENTE.
-- p_contrasena_hash: hash bcrypt generado por la API (nunca la contraseña).
DROP PROCEDURE IF EXISTS sp_RegistrarUsuario $$
CREATE PROCEDURE sp_RegistrarUsuario(
  IN p_nombre_completo VARCHAR(100),
  IN p_cedula          CHAR(9),
  IN p_telefono        CHAR(8),
  IN p_correo          VARCHAR(254),
  IN p_contrasena_hash CHAR(60)
)
  COMMENT 'HU-01 · Crea usuario + cliente y devuelve el perfil'
BEGIN
  DECLARE v_correo VARCHAR(254) DEFAULT LOWER(TRIM(p_correo));
  DECLARE v_id     INT UNSIGNED;

  -- Si dos registros iguales llegan al mismo tiempo, el UNIQUE lo detecta
  DECLARE EXIT HANDLER FOR 1062
  BEGIN
    ROLLBACK;
    CALL sp_error(5409, 'El correo o la cédula ya están registrados');
  END;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  IF EXISTS (SELECT 1 FROM usuario WHERE correo = v_correo) THEN
    CALL sp_error(5409, 'Ese correo ya está registrado');
  END IF;
  IF EXISTS (SELECT 1 FROM cliente WHERE cedula = p_cedula) THEN
    CALL sp_error(5409, 'Esa cédula ya está registrada');
  END IF;

  START TRANSACTION;
    INSERT INTO usuario (rol_codigo, nombre_completo, correo, contrasena_hash, ultimo_acceso)
    VALUES ('CLIENTE', TRIM(p_nombre_completo), v_correo, p_contrasena_hash, fn_ahora());
    SET v_id = LAST_INSERT_ID();

    INSERT INTO cliente (usuario_id, cedula, telefono)
    VALUES (v_id, p_cedula, p_telefono);
  COMMIT;

  -- El cliente queda con la sesión iniciada: la API firma el JWT con este perfil
  CALL sp_ObtenerPerfil(v_id);
END $$

-- HU-02 / HU-14 · Datos para iniciar sesión. La API compara el hash con
-- bcrypt. Si no hay fila, está inactiva o el hash no coincide, responde
-- siempre "Correo o contraseña incorrectos".
DROP PROCEDURE IF EXISTS sp_ObtenerUsuarioPorCorreo $$
CREATE PROCEDURE sp_ObtenerUsuarioPorCorreo(IN p_correo VARCHAR(254))
  COMMENT 'HU-02, HU-14 · Devuelve id, rol, hash y estado para el login'
BEGIN
  SELECT id, rol_codigo AS rol, nombre_completo, correo, contrasena_hash, activo
    FROM usuario
   WHERE correo = LOWER(TRIM(p_correo));
END $$

-- HU-02 / HU-14 · Se llama después de un inicio de sesión correcto
DROP PROCEDURE IF EXISTS sp_RegistrarAcceso $$
CREATE PROCEDURE sp_RegistrarAcceso(IN p_usuario_id INT UNSIGNED)
  COMMENT 'Actualiza ultimo_acceso'
BEGIN
  UPDATE usuario SET ultimo_acceso = fn_ahora() WHERE id = p_usuario_id;
END $$

-- Perfil del usuario (pantalla de perfil y respuesta del registro/login)
DROP PROCEDURE IF EXISTS sp_ObtenerPerfil $$
CREATE PROCEDURE sp_ObtenerPerfil(IN p_usuario_id INT UNSIGNED)
  COMMENT 'Perfil sin el hash de la contraseña'
BEGIN
  SELECT u.id, u.rol_codigo AS rol, u.nombre_completo, u.correo,
         c.cedula, c.telefono, u.fecha_creacion
    FROM usuario u
    LEFT JOIN cliente c ON c.usuario_id = u.id
   WHERE u.id = p_usuario_id AND u.activo;
END $$


-- =====================================================================
--  BLOQUE 2 · MÓDULO INFORMACIÓN  (HU-04, HU-05, HU-06, HU-17)
-- =====================================================================

-- HU-04 · Horario de la semana. El indicador "Abierto ahora" lo calcula
-- utils/tiempo.js con estas filas (considera cierra_dia_siguiente).
DROP PROCEDURE IF EXISTS sp_ObtenerHorario $$
CREATE PROCEDURE sp_ObtenerHorario()
  COMMENT 'HU-04 · Horario de lunes a domingo'
BEGIN
  SELECT h.dia_semana_id, d.nombre AS dia, h.abierto,
         h.hora_apertura, h.hora_cierre, h.cierra_dia_siguiente
    FROM horario h
    JOIN dia_semana d ON d.id = h.dia_semana_id
   ORDER BY h.dia_semana_id;
END $$

-- HU-05 · Ubicación y contacto
DROP PROCEDURE IF EXISTS sp_ObtenerRestaurante $$
CREATE PROCEDURE sp_ObtenerRestaurante()
  COMMENT 'HU-05 · Dirección, señas, teléfono y WhatsApp'
BEGIN
  SELECT nombre, direccion, senas, telefono, whatsapp FROM restaurante WHERE id = 1;
END $$

-- HU-06 · Promociones activas y vigentes hoy. Lista vacía → la app
-- muestra "No hay promociones por el momento".
DROP PROCEDURE IF EXISTS sp_ListarPromocionesVigentes $$
CREATE PROCEDURE sp_ListarPromocionesVigentes()
  COMMENT 'HU-06 · Promociones visibles para el cliente'
BEGIN
  DECLARE v_hoy DATE DEFAULT fn_hoy();

  SELECT p.id, p.titulo, p.descripcion, p.fecha_inicio, p.fecha_fin,
         (SELECT GROUP_CONCAT(d.nombre ORDER BY d.id SEPARATOR ', ')
            FROM promocion_dia pd JOIN dia_semana d ON d.id = pd.dia_semana_id
           WHERE pd.promocion_id = p.id) AS dias_validos
    FROM promocion p
   WHERE p.activa AND v_hoy BETWEEN p.fecha_inicio AND p.fecha_fin
   ORDER BY p.fecha_fin, p.id;
END $$

-- HU-17 · Todas las promociones (administrador)
DROP PROCEDURE IF EXISTS sp_ListarPromociones $$
CREATE PROCEDURE sp_ListarPromociones()
  COMMENT 'HU-17 · Lista completa para el panel'
BEGIN
  DECLARE v_hoy DATE DEFAULT fn_hoy();

  SELECT p.id, p.titulo, p.descripcion, p.fecha_inicio, p.fecha_fin, p.activa,
         (p.activa AND v_hoy BETWEEN p.fecha_inicio AND p.fecha_fin) AS visible_hoy,
         (SELECT JSON_ARRAYAGG(pd.dia_semana_id)
            FROM promocion_dia pd WHERE pd.promocion_id = p.id) AS dias,
         (SELECT GROUP_CONCAT(d.nombre ORDER BY d.id SEPARATOR ', ')
            FROM promocion_dia pd JOIN dia_semana d ON d.id = pd.dia_semana_id
           WHERE pd.promocion_id = p.id) AS dias_validos
    FROM promocion p
   ORDER BY p.activa DESC, p.fecha_fin DESC, p.id DESC;
END $$

-- HU-17 · Crear (p_id NULL) o editar una promoción.
-- p_dias: arreglo JSON con los días válidos, ej. '[2,3]' (1 = lunes … 7 = domingo).
DROP PROCEDURE IF EXISTS sp_GuardarPromocion $$
CREATE PROCEDURE sp_GuardarPromocion(
  IN p_id           INT UNSIGNED,
  IN p_titulo       VARCHAR(80),
  IN p_descripcion  VARCHAR(500),
  IN p_fecha_inicio DATE,
  IN p_fecha_fin    DATE,
  IN p_dias         JSON,
  IN p_admin_id     INT UNSIGNED
)
  COMMENT 'HU-17 · Crea o edita una promoción y sus días'
BEGIN
  DECLARE v_id INT UNSIGNED DEFAULT p_id;
  DECLARE v_dias_invalidos INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  CALL sp_validar_admin(p_admin_id);

  IF p_fecha_inicio IS NULL OR p_fecha_fin IS NULL OR p_fecha_fin < p_fecha_inicio THEN
    CALL sp_error(5400, 'La fecha de fin no puede ser anterior a la fecha de inicio');
  END IF;
  IF p_dias IS NULL OR JSON_TYPE(p_dias) <> 'ARRAY' OR JSON_LENGTH(p_dias) = 0 THEN
    CALL sp_error(5400, 'Seleccione al menos un día válido');
  END IF;
  SELECT COUNT(*) INTO v_dias_invalidos
    FROM JSON_TABLE(p_dias, '$[*]' COLUMNS (dia INT PATH '$' NULL ON ERROR)) j
   WHERE j.dia IS NULL OR j.dia NOT BETWEEN 1 AND 7;
  IF v_dias_invalidos > 0 THEN
    CALL sp_error(5400, 'Los días deben ser números del 1 (lunes) al 7 (domingo)');
  END IF;

  START TRANSACTION;
    IF v_id IS NULL THEN
      INSERT INTO promocion (titulo, descripcion, fecha_inicio, fecha_fin, creado_por)
      VALUES (TRIM(p_titulo), TRIM(p_descripcion), p_fecha_inicio, p_fecha_fin, p_admin_id);
      SET v_id = LAST_INSERT_ID();
    ELSE
      UPDATE promocion
         SET titulo = TRIM(p_titulo), descripcion = TRIM(p_descripcion),
             fecha_inicio = p_fecha_inicio, fecha_fin = p_fecha_fin,
             actualizado_por = p_admin_id
       WHERE id = v_id;
      IF ROW_COUNT() = 0 AND NOT EXISTS (SELECT 1 FROM promocion WHERE id = v_id) THEN
        CALL sp_error(5404, 'La promoción no existe');
      END IF;
      DELETE FROM promocion_dia WHERE promocion_id = v_id;
    END IF;

    INSERT INTO promocion_dia (promocion_id, dia_semana_id)
    SELECT DISTINCT v_id, j.dia
      FROM JSON_TABLE(p_dias, '$[*]' COLUMNS (dia TINYINT UNSIGNED PATH '$')) j;
  COMMIT;

  SELECT v_id AS id;
END $$

-- HU-17 · Activar o desactivar (una promoción desactivada no se muestra)
DROP PROCEDURE IF EXISTS sp_CambiarEstadoPromocion $$
CREATE PROCEDURE sp_CambiarEstadoPromocion(
  IN p_id INT UNSIGNED, IN p_activa BOOLEAN, IN p_admin_id INT UNSIGNED)
  COMMENT 'HU-17 · Activa o desactiva una promoción'
BEGIN
  CALL sp_validar_admin(p_admin_id);
  UPDATE promocion SET activa = p_activa, actualizado_por = p_admin_id WHERE id = p_id;
  IF NOT EXISTS (SELECT 1 FROM promocion WHERE id = p_id) THEN
    CALL sp_error(5404, 'La promoción no existe');
  END IF;
END $$


-- =====================================================================
--  BLOQUE 3 · MÓDULO MENÚ  (HU-03, HU-15)
-- =====================================================================

-- HU-03 · Menú del cliente: solo categorías y productos activos.
-- Los agotados sí aparecen (con agotado = 1) para mostrar la etiqueta.
DROP PROCEDURE IF EXISTS sp_ListarMenu $$
CREATE PROCEDURE sp_ListarMenu()
  COMMENT 'HU-03 · Menú público por categorías'
BEGIN
  SELECT c.id AS categoria_id, c.nombre AS categoria,
         p.id, p.nombre, p.descripcion, p.precio, p.agotado
    FROM producto p
    JOIN categoria c ON c.id = p.categoria_id
   WHERE p.activo AND c.activa
   ORDER BY c.orden, c.nombre, p.nombre;
END $$

-- HU-15 · Categorías para el formulario de productos
DROP PROCEDURE IF EXISTS sp_ListarCategorias $$
CREATE PROCEDURE sp_ListarCategorias()
  COMMENT 'HU-15 · Categorías activas'
BEGIN
  SELECT id, nombre FROM categoria WHERE activa ORDER BY orden, nombre;
END $$

-- HU-15 · Productos del panel (los eliminados no se muestran)
DROP PROCEDURE IF EXISTS sp_ListarProductosAdmin $$
CREATE PROCEDURE sp_ListarProductosAdmin()
  COMMENT 'HU-15 · Productos activos con su categoría'
BEGIN
  SELECT p.id, p.categoria_id, c.nombre AS categoria, p.nombre, p.descripcion,
         p.precio, p.agotado, p.fecha_actualizacion
    FROM producto p
    JOIN categoria c ON c.id = p.categoria_id
   WHERE p.activo
   ORDER BY c.orden, p.nombre;
END $$

-- HU-15 · Crear (p_id NULL) o editar un producto
DROP PROCEDURE IF EXISTS sp_GuardarProducto $$
CREATE PROCEDURE sp_GuardarProducto(
  IN p_id           INT UNSIGNED,
  IN p_categoria_id SMALLINT UNSIGNED,
  IN p_nombre       VARCHAR(80),
  IN p_descripcion  VARCHAR(300),
  IN p_precio       INT,
  IN p_admin_id     INT UNSIGNED
)
  COMMENT 'HU-15 · Crea o edita un producto'
BEGIN
  DECLARE v_id INT UNSIGNED DEFAULT p_id;

  DECLARE EXIT HANDLER FOR 1062
    CALL sp_error(5409, 'Ya existe un producto con ese nombre');

  CALL sp_validar_admin(p_admin_id);

  IF p_precio IS NULL OR p_precio <= 0 THEN
    CALL sp_error(5400, 'El precio debe ser un número entero mayor a cero');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM categoria WHERE id = p_categoria_id AND activa) THEN
    CALL sp_error(5400, 'La categoría no existe');
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO producto (categoria_id, nombre, descripcion, precio, creado_por)
    VALUES (p_categoria_id, TRIM(p_nombre), TRIM(p_descripcion), p_precio, p_admin_id);
    SET v_id = LAST_INSERT_ID();
  ELSE
    IF NOT EXISTS (SELECT 1 FROM producto WHERE id = v_id AND activo) THEN
      CALL sp_error(5404, 'El producto no existe');
    END IF;
    UPDATE producto
       SET categoria_id = p_categoria_id, nombre = TRIM(p_nombre),
           descripcion = TRIM(p_descripcion), precio = p_precio,
           actualizado_por = p_admin_id
     WHERE id = v_id;
  END IF;

  SELECT v_id AS id;
END $$

-- HU-15 · Marcar o desmarcar "Agotado"
DROP PROCEDURE IF EXISTS sp_CambiarDisponibilidad $$
CREATE PROCEDURE sp_CambiarDisponibilidad(
  IN p_id INT UNSIGNED, IN p_agotado BOOLEAN, IN p_admin_id INT UNSIGNED)
  COMMENT 'HU-15 · Cambia el indicador agotado'
BEGIN
  CALL sp_validar_admin(p_admin_id);
  IF NOT EXISTS (SELECT 1 FROM producto WHERE id = p_id AND activo) THEN
    CALL sp_error(5404, 'El producto no existe');
  END IF;
  UPDATE producto SET agotado = p_agotado, actualizado_por = p_admin_id WHERE id = p_id;
END $$

-- HU-15 · Eliminar = desactivar (los pedidos anteriores lo conservan)
DROP PROCEDURE IF EXISTS sp_EliminarProducto $$
CREATE PROCEDURE sp_EliminarProducto(IN p_id INT UNSIGNED, IN p_admin_id INT UNSIGNED)
  COMMENT 'HU-15 · Borrado lógico'
BEGIN
  CALL sp_validar_admin(p_admin_id);
  IF NOT EXISTS (SELECT 1 FROM producto WHERE id = p_id AND activo) THEN
    CALL sp_error(5404, 'El producto no existe');
  END IF;
  UPDATE producto SET activo = FALSE, actualizado_por = p_admin_id WHERE id = p_id;
END $$


-- =====================================================================
--  BLOQUE 4 · MÓDULO PEDIDOS  (HU-07, HU-08, HU-09, HU-16)
-- =====================================================================

-- HU-07 / HU-08 · Guarda un pedido YA PAGADO en una sola transacción.
-- Antes de llamarlo, la API valida el horario (hasta 30 min antes del
-- cierre) y PagoSimuladoService aprueba el pago.
--
-- p_items: arreglo JSON del carrito, ej. '[{"producto_id":1,"cantidad":2}]'
-- Los precios se toman de la base, nunca del teléfono.
-- Si un producto se agotó entre el pago y este llamado, el pedido se
-- rechaza (5409) y el pago simulado se descarta: no hubo cobro real.
DROP PROCEDURE IF EXISTS sp_CrearPedidoPagado $$
CREATE PROCEDURE sp_CrearPedidoPagado(
  IN p_cliente_id          INT UNSIGNED,
  IN p_nota                VARCHAR(200),
  IN p_items               JSON,
  IN p_ultimos4            CHAR(4),
  IN p_codigo_autorizacion VARCHAR(20)
)
  COMMENT 'HU-07, HU-08 · Pedido + detalle + pago + historial'
BEGIN
  DECLARE v_items        INT;
  DECLARE v_distintos    INT;
  DECLARE v_invalidos    INT;
  DECLARE v_encontrados  INT;
  DECLARE v_no_disponible VARCHAR(80);
  DECLARE v_total        INT UNSIGNED;
  DECLARE v_pago_id      INT UNSIGNED;
  DECLARE v_pedido_id    INT UNSIGNED;

  DECLARE EXIT HANDLER FOR 1062
  BEGIN
    ROLLBACK;
    CALL sp_error(5409, 'Este pago ya fue registrado');
  END;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  CALL sp_validar_cliente(p_cliente_id);

  -- 1. Validar el carrito
  IF p_items IS NULL OR JSON_TYPE(p_items) <> 'ARRAY' OR JSON_LENGTH(p_items) = 0 THEN
    CALL sp_error(5400, 'El carrito está vacío');
  END IF;
  IF JSON_LENGTH(p_items) > 30 THEN
    CALL sp_error(5400, 'El carrito tiene demasiados productos');
  END IF;

  SELECT COUNT(*), COUNT(DISTINCT j.producto_id),
         SUM(j.producto_id IS NULL OR j.cantidad IS NULL OR j.cantidad NOT BETWEEN 1 AND 10)
    INTO v_items, v_distintos, v_invalidos
    FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
           producto_id INT UNSIGNED PATH '$.producto_id' NULL ON EMPTY NULL ON ERROR,
           cantidad    INT          PATH '$.cantidad'    NULL ON EMPTY NULL ON ERROR)) j;

  IF v_invalidos > 0 THEN
    CALL sp_error(5400, 'La cantidad de cada producto debe ser de 1 a 10');
  END IF;
  IF v_distintos <> v_items THEN
    CALL sp_error(5400, 'Hay productos repetidos en el carrito');
  END IF;
  IF p_ultimos4 IS NULL OR p_ultimos4 NOT REGEXP '^[0-9]{4}$'
     OR p_codigo_autorizacion IS NULL OR p_codigo_autorizacion NOT LIKE 'SIM-%' THEN
    CALL sp_error(5400, 'Los datos del pago no son válidos');
  END IF;

  START TRANSACTION;
    -- 2. Bloquear los productos (lectura compartida): si el administrador
    --    los marca como agotados en este instante, espera a que termine el pedido.
    SELECT COUNT(*) INTO v_encontrados
      FROM producto p
     WHERE p.id IN (SELECT j.producto_id
                      FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
                             producto_id INT UNSIGNED PATH '$.producto_id')) j)
       FOR SHARE;

    IF v_encontrados <> v_items THEN
      CALL sp_error(5409, 'Uno de los productos ya no está disponible');
    END IF;

    SELECT p.nombre INTO v_no_disponible
      FROM producto p
      JOIN JSON_TABLE(p_items, '$[*]' COLUMNS (
             producto_id INT UNSIGNED PATH '$.producto_id')) j ON j.producto_id = p.id
     WHERE NOT p.activo OR p.agotado
     LIMIT 1;

    IF v_no_disponible IS NOT NULL THEN
      CALL sp_error(5409, CONCAT(v_no_disponible, ' ya no está disponible'));
    END IF;

    -- 3. Total con los precios actuales de la base
    SELECT SUM(p.precio * j.cantidad) INTO v_total
      FROM producto p
      JOIN JSON_TABLE(p_items, '$[*]' COLUMNS (
             producto_id INT UNSIGNED PATH '$.producto_id',
             cantidad    INT          PATH '$.cantidad')) j ON j.producto_id = p.id;

    -- 4. Pago, pedido, detalle e historial
    INSERT INTO pago (tipo, monto, ultimos4, codigo_autorizacion, fecha_pago)
    VALUES ('PEDIDO', v_total, p_ultimos4, p_codigo_autorizacion, fn_ahora());
    SET v_pago_id = LAST_INSERT_ID();

    INSERT INTO pedido (cliente_id, estado_codigo, nota, total, pago_id, fecha_pedido)
    VALUES (p_cliente_id, 'RECIBIDO', NULLIF(TRIM(p_nota), ''), v_total, v_pago_id, fn_ahora());
    SET v_pedido_id = LAST_INSERT_ID();

    INSERT INTO pedido_detalle (pedido_id, producto_id, nombre_producto, precio_unitario, cantidad)
    SELECT v_pedido_id, p.id, p.nombre, p.precio, j.cantidad
      FROM producto p
      JOIN JSON_TABLE(p_items, '$[*]' COLUMNS (
             producto_id INT UNSIGNED PATH '$.producto_id',
             cantidad    INT          PATH '$.cantidad')) j ON j.producto_id = p.id;

    INSERT INTO pedido_estado_historial (pedido_id, estado_codigo, usuario_id, fecha)
    VALUES (v_pedido_id, 'RECIBIDO', p_cliente_id, fn_ahora());
  COMMIT;

  -- 5. Comprobante (HU-08)
  CALL sp_ObtenerPedido(v_pedido_id, p_cliente_id);
END $$

-- HU-08 / HU-09 / HU-16 · Detalle y comprobante de un pedido.
-- p_cliente_id: el del cliente que consulta (solo ve sus pedidos);
--               NULL cuando consulta el administrador.
DROP PROCEDURE IF EXISTS sp_ObtenerPedido $$
CREATE PROCEDURE sp_ObtenerPedido(IN p_pedido_id INT UNSIGNED, IN p_cliente_id INT UNSIGNED)
  COMMENT 'HU-08, HU-09, HU-16 · Comprobante con productos en JSON'
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pedido
                  WHERE id = p_pedido_id
                    AND (p_cliente_id IS NULL OR cliente_id = p_cliente_id)) THEN
    CALL sp_error(5404, 'El pedido no existe');
  END IF;

  SELECT pe.id AS numero_pedido, pe.fecha_pedido, pe.estado_codigo, ep.nombre AS estado,
         pe.nota, pe.total, pa.ultimos4, pa.codigo_autorizacion,
         u.nombre_completo AS cliente, c.telefono,
         (SELECT JSON_ARRAYAGG(JSON_OBJECT(
                   'producto_id', d.producto_id, 'nombre', d.nombre_producto,
                   'cantidad', d.cantidad, 'precio_unitario', d.precio_unitario,
                   'subtotal', d.subtotal))
            FROM pedido_detalle d WHERE d.pedido_id = pe.id) AS productos
    FROM pedido pe
    JOIN estado_pedido ep ON ep.codigo = pe.estado_codigo
    JOIN pago pa          ON pa.id = pe.pago_id
    JOIN cliente c        ON c.usuario_id = pe.cliente_id
    JOIN usuario u        ON u.id = pe.cliente_id
   WHERE pe.id = p_pedido_id;
END $$

-- HU-09 · Mis pedidos, del más reciente al más antiguo
DROP PROCEDURE IF EXISTS sp_ListarPedidosCliente $$
CREATE PROCEDURE sp_ListarPedidosCliente(IN p_cliente_id INT UNSIGNED)
  COMMENT 'HU-09 · Pedidos del cliente'
BEGIN
  SELECT pe.id AS numero_pedido, pe.fecha_pedido, pe.total,
         pe.estado_codigo, ep.nombre AS estado
    FROM pedido pe
    JOIN estado_pedido ep ON ep.codigo = pe.estado_codigo
   WHERE pe.cliente_id = p_cliente_id
   ORDER BY pe.fecha_pedido DESC, pe.id DESC;
END $$

-- HU-16 · Pedidos activos, del más antiguo al más reciente
DROP PROCEDURE IF EXISTS sp_ListarPedidosActivos $$
CREATE PROCEDURE sp_ListarPedidosActivos(IN p_admin_id INT UNSIGNED)
  COMMENT 'HU-16 · Recibido, En preparación y Listo para recoger'
BEGIN
  CALL sp_validar_admin(p_admin_id);

  SELECT pe.id AS numero_pedido, pe.fecha_pedido, pe.estado_codigo, ep.nombre AS estado,
         (SELECT siguiente.codigo FROM estado_pedido siguiente
           WHERE siguiente.orden = ep.orden + 1) AS siguiente_estado,
         u.nombre_completo AS cliente, c.telefono, pe.nota, pe.total,
         (SELECT JSON_ARRAYAGG(JSON_OBJECT(
                   'nombre', d.nombre_producto, 'cantidad', d.cantidad))
            FROM pedido_detalle d WHERE d.pedido_id = pe.id) AS productos
    FROM pedido pe
    JOIN estado_pedido ep ON ep.codigo = pe.estado_codigo
    JOIN cliente c        ON c.usuario_id = pe.cliente_id
    JOIN usuario u        ON u.id = pe.cliente_id
   WHERE ep.es_activo
   ORDER BY pe.fecha_pedido, pe.id;
END $$

-- HU-16 · Historial con filtros opcionales y paginación.
-- Devuelve 2 resultados: (1) la página de pedidos, (2) el total de filas.
DROP PROCEDURE IF EXISTS sp_ListarHistorialPedidos $$
CREATE PROCEDURE sp_ListarHistorialPedidos(
  IN p_admin_id INT UNSIGNED,
  IN p_estado   VARCHAR(20),   -- NULL = todos
  IN p_desde    DATE,          -- NULL = sin límite
  IN p_hasta    DATE,          -- NULL = sin límite
  IN p_limite   INT,           -- por defecto 50, máximo 200
  IN p_offset   INT
)
  COMMENT 'HU-16 · Historial filtrable por estado y fecha'
BEGIN
  DECLARE v_limite INT DEFAULT LEAST(GREATEST(IFNULL(p_limite, 50), 1), 200);
  DECLARE v_offset INT DEFAULT GREATEST(IFNULL(p_offset, 0), 0);

  CALL sp_validar_admin(p_admin_id);

  SELECT pe.id AS numero_pedido, pe.fecha_pedido, pe.estado_codigo, ep.nombre AS estado,
         u.nombre_completo AS cliente, c.telefono, pe.total
    FROM pedido pe
    JOIN estado_pedido ep ON ep.codigo = pe.estado_codigo
    JOIN cliente c        ON c.usuario_id = pe.cliente_id
    JOIN usuario u        ON u.id = pe.cliente_id
   WHERE (p_estado IS NULL OR pe.estado_codigo = p_estado)
     AND (p_desde  IS NULL OR pe.fecha_pedido >= p_desde)
     AND (p_hasta  IS NULL OR pe.fecha_pedido <  p_hasta + INTERVAL 1 DAY)
   ORDER BY pe.fecha_pedido DESC, pe.id DESC
   LIMIT v_limite OFFSET v_offset;

  SELECT COUNT(*) AS total
    FROM pedido pe
   WHERE (p_estado IS NULL OR pe.estado_codigo = p_estado)
     AND (p_desde  IS NULL OR pe.fecha_pedido >= p_desde)
     AND (p_hasta  IS NULL OR pe.fecha_pedido <  p_hasta + INTERVAL 1 DAY);
END $$

-- HU-16 · Cambiar el estado, solo al siguiente en orden:
-- Recibido → En preparación → Listo para recoger → Entregado
DROP PROCEDURE IF EXISTS sp_ActualizarEstadoPedido $$
CREATE PROCEDURE sp_ActualizarEstadoPedido(
  IN p_pedido_id    INT UNSIGNED,
  IN p_estado_nuevo VARCHAR(20),
  IN p_admin_id     INT UNSIGNED
)
  COMMENT 'HU-16 · Avanza el estado y lo registra en el historial'
BEGIN
  DECLARE v_orden_actual TINYINT UNSIGNED;
  DECLARE v_orden_nuevo  TINYINT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  CALL sp_validar_admin(p_admin_id);

  SELECT orden INTO v_orden_nuevo FROM estado_pedido WHERE codigo = p_estado_nuevo;
  IF v_orden_nuevo IS NULL THEN
    CALL sp_error(5400, 'El estado no es válido');
  END IF;

  START TRANSACTION;
    -- Bloquea el pedido: dos administradores no pueden avanzarlo a la vez
    SELECT ep.orden INTO v_orden_actual
      FROM pedido pe JOIN estado_pedido ep ON ep.codigo = pe.estado_codigo
     WHERE pe.id = p_pedido_id
       FOR UPDATE;

    IF v_orden_actual IS NULL THEN
      CALL sp_error(5404, 'El pedido no existe');
    END IF;
    -- Solo se avanza un paso a la vez: el orden nuevo debe ser el actual + 1.
    IF v_orden_nuevo <> v_orden_actual + 1 THEN
      CALL sp_error(5409, 'El estado debe cambiar en orden (el pedido ya cambió o el paso no es válido)');
    END IF;

    UPDATE pedido SET estado_codigo = p_estado_nuevo WHERE id = p_pedido_id;

    INSERT INTO pedido_estado_historial (pedido_id, estado_codigo, usuario_id, fecha)
    VALUES (p_pedido_id, p_estado_nuevo, p_admin_id, fn_ahora());
  COMMIT;

  SELECT p_pedido_id AS numero_pedido, p_estado_nuevo AS estado_codigo;
END $$


-- =====================================================================
--  BLOQUE 5 · MÓDULO RESERVAS  (HU-10, HU-11, HU-18)
-- =====================================================================

-- HU-10 · Espacios ocupados en un rango de fechas. El service genera las
-- horas posibles según el horario y marca "Sin espacio" donde ocupadas = 3.
-- (Rango de fechas porque la franja de 12:00 a.m. de viernes y sábado se
--  guarda con la fecha del día siguiente.)
DROP PROCEDURE IF EXISTS sp_ListarEspaciosReserva $$
CREATE PROCEDURE sp_ListarEspaciosReserva(IN p_desde DATE, IN p_hasta DATE)
  COMMENT 'HU-10, HU-18 · Reservas ocupadas por fecha y hora'
BEGIN
  SELECT fecha, hora, reservas_ocupadas, 3 - reservas_ocupadas AS espacios_libres
    FROM franja_reserva
   WHERE fecha BETWEEN p_desde AND IFNULL(p_hasta, p_desde)
     AND reservas_ocupadas > 0
   ORDER BY fecha, hora;
END $$

-- HU-10 · Crear una reserva. Antes, el service valida: no lunes, no
-- fecha pasada, máximo 30 días y hora exacta dentro del horario.
-- Si dos clientes toman el último espacio a la vez, el FOR UPDATE hace
-- que el segundo espere y reciba "Sin espacio".
DROP PROCEDURE IF EXISTS sp_CrearReserva $$
CREATE PROCEDURE sp_CrearReserva(
  IN p_cliente_id    INT UNSIGNED,
  IN p_fecha         DATE,
  IN p_hora          TIME,
  IN p_personas      TINYINT UNSIGNED,
  IN p_motivo_codigo VARCHAR(20),
  IN p_comentario    VARCHAR(250)
)
  COMMENT 'HU-10 · Reserva con control de cupo (máximo 3 por hora)'
BEGIN
  DECLARE v_ocupadas  TINYINT UNSIGNED;
  DECLARE v_reserva_id INT UNSIGNED;

  DECLARE EXIT HANDLER FOR 1062
  BEGIN
    ROLLBACK;
    CALL sp_error(5409, 'Ya tiene una reserva para ese día');
  END;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  CALL sp_validar_cliente(p_cliente_id);

  IF p_personas IS NULL OR p_personas NOT BETWEEN 1 AND 8 THEN
    CALL sp_error(5400, 'De 1 a 8 personas. Para grupos más grandes, llame o escriba por WhatsApp');
  END IF;
  IF p_hora IS NULL OR MINUTE(p_hora) <> 0 OR SECOND(p_hora) <> 0 THEN
    CALL sp_error(5400, 'Las reservas son por hora exacta');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM motivo_reserva
                  WHERE codigo = IFNULL(p_motivo_codigo, 'MESA') AND activo) THEN
    CALL sp_error(5400, 'El motivo no es válido');
  END IF;
  IF EXISTS (SELECT 1 FROM reserva
              WHERE cliente_id = p_cliente_id AND fecha_no_cancelada = p_fecha) THEN
    CALL sp_error(5409, 'Ya tiene una reserva para ese día');
  END IF;

  START TRANSACTION;
    -- Crea la franja si no existe (sin IGNORE, que ocultaría errores)
    INSERT INTO franja_reserva (fecha, hora) VALUES (p_fecha, p_hora)
      ON DUPLICATE KEY UPDATE fecha = fecha;

    SELECT reservas_ocupadas INTO v_ocupadas
      FROM franja_reserva
     WHERE fecha = p_fecha AND hora = p_hora
       FOR UPDATE;

    IF v_ocupadas >= 3 THEN
      CALL sp_error(5409, 'Sin espacio: esa hora ya tiene 3 reservas. Escoja otra hora');
    END IF;

    INSERT INTO reserva (cliente_id, fecha, hora, personas, motivo_codigo, comentario,
                         estado_codigo, fecha_creacion)
    VALUES (p_cliente_id, p_fecha, p_hora, p_personas, IFNULL(p_motivo_codigo, 'MESA'),
            NULLIF(TRIM(p_comentario), ''), 'CONFIRMADA', fn_ahora());
    SET v_reserva_id = LAST_INSERT_ID();

    UPDATE franja_reserva
       SET reservas_ocupadas = reservas_ocupadas + 1
     WHERE fecha = p_fecha AND hora = p_hora;
  COMMIT;

  CALL sp_ObtenerReserva(v_reserva_id, p_cliente_id);
END $$

-- HU-10 / HU-11 · Una reserva (resumen al confirmar y antes de cancelar).
-- p_cliente_id NULL = consulta del administrador.
DROP PROCEDURE IF EXISTS sp_ObtenerReserva $$
CREATE PROCEDURE sp_ObtenerReserva(IN p_reserva_id INT UNSIGNED, IN p_cliente_id INT UNSIGNED)
  COMMENT 'HU-10, HU-11 · Detalle de una reserva'
BEGIN
  IF NOT EXISTS (SELECT 1 FROM reserva
                  WHERE id = p_reserva_id
                    AND (p_cliente_id IS NULL OR cliente_id = p_cliente_id)) THEN
    CALL sp_error(5404, 'La reserva no existe');
  END IF;

  SELECT r.id, r.fecha, r.hora, TIMESTAMP(r.fecha, r.hora) AS fecha_hora,
         r.personas, r.motivo_codigo, m.nombre AS motivo, r.comentario,
         r.estado_codigo, er.nombre AS estado, r.fecha_creacion
    FROM reserva r
    JOIN motivo_reserva m  ON m.codigo  = r.motivo_codigo
    JOIN estado_reserva er ON er.codigo = r.estado_codigo
   WHERE r.id = p_reserva_id;
END $$

-- HU-11 · Mis reservas: próximas (desde hoy), de la más cercana a la más lejana
DROP PROCEDURE IF EXISTS sp_ListarReservasCliente $$
CREATE PROCEDURE sp_ListarReservasCliente(IN p_cliente_id INT UNSIGNED)
  COMMENT 'HU-11 · Reservas próximas del cliente'
BEGIN
  SELECT r.id, r.fecha, r.hora, TIMESTAMP(r.fecha, r.hora) AS fecha_hora,
         r.personas, m.nombre AS motivo, r.comentario,
         r.estado_codigo, er.nombre AS estado
    FROM reserva r
    JOIN motivo_reserva m  ON m.codigo  = r.motivo_codigo
    JOIN estado_reserva er ON er.codigo = r.estado_codigo
   WHERE r.cliente_id = p_cliente_id
     AND r.fecha >= fn_hoy()
   ORDER BY r.fecha, r.hora;
END $$

-- HU-11 / HU-18 · Cancelar. Libera el espacio en la misma transacción.
--   p_por_restaurante = FALSE → cancela el cliente (el service ya validó
--                               que faltan más de 2 horas)
--   p_por_restaurante = TRUE  → cancela el administrador
--                               ("Cancelada por el restaurante")
DROP PROCEDURE IF EXISTS sp_CancelarReserva $$
CREATE PROCEDURE sp_CancelarReserva(
  IN p_reserva_id      INT UNSIGNED,
  IN p_usuario_id      INT UNSIGNED,
  IN p_por_restaurante BOOLEAN
)
  COMMENT 'HU-11, HU-18 · Cancela y libera el espacio'
BEGIN
  DECLARE v_fecha   DATE;
  DECLARE v_hora    TIME;
  DECLARE v_cliente INT UNSIGNED;
  DECLARE v_estado  VARCHAR(25);
  DECLARE v_ocupadas TINYINT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  IF p_por_restaurante THEN
    CALL sp_validar_admin(p_usuario_id);
  END IF;

  SELECT fecha, hora, cliente_id INTO v_fecha, v_hora, v_cliente
    FROM reserva WHERE id = p_reserva_id;

  IF v_fecha IS NULL OR (NOT p_por_restaurante AND v_cliente <> p_usuario_id) THEN
    CALL sp_error(5404, 'La reserva no existe');
  END IF;

  START TRANSACTION;
    -- Mismo orden de bloqueo que sp_CrearReserva (franja → reserva)
    -- para evitar bloqueos cruzados.
    SELECT reservas_ocupadas INTO v_ocupadas
      FROM franja_reserva WHERE fecha = v_fecha AND hora = v_hora FOR UPDATE;

    SELECT estado_codigo INTO v_estado FROM reserva WHERE id = p_reserva_id FOR UPDATE;

    IF v_estado <> 'CONFIRMADA' THEN
      CALL sp_error(5409, 'Solo se pueden cancelar reservas confirmadas');
    END IF;

    UPDATE reserva
       SET estado_codigo     = IF(p_por_restaurante, 'CANCELADA_RESTAURANTE', 'CANCELADA_CLIENTE'),
           fecha_cancelacion = fn_ahora(),
           actualizado_por   = p_usuario_id
     WHERE id = p_reserva_id;

    UPDATE franja_reserva
       SET reservas_ocupadas = reservas_ocupadas - 1
     WHERE fecha = v_fecha AND hora = v_hora;
  COMMIT;

  CALL sp_ObtenerReserva(p_reserva_id, NULL);
END $$

-- HU-18 · Reservas de un día. Devuelve 2 resultados:
--   (1) las reservas ordenadas por hora, (2) los espacios por hora.
DROP PROCEDURE IF EXISTS sp_ListarReservasDia $$
CREATE PROCEDURE sp_ListarReservasDia(IN p_fecha DATE, IN p_admin_id INT UNSIGNED)
  COMMENT 'HU-18 · Reservas del día (por defecto hoy)'
BEGIN
  DECLARE v_fecha DATE DEFAULT IFNULL(p_fecha, fn_hoy());

  CALL sp_validar_admin(p_admin_id);

  SELECT r.id, r.hora, u.nombre_completo AS cliente, c.telefono, r.personas,
         m.nombre AS motivo, r.comentario, r.estado_codigo, er.nombre AS estado
    FROM reserva r
    JOIN cliente c         ON c.usuario_id = r.cliente_id
    JOIN usuario u         ON u.id = r.cliente_id
    JOIN motivo_reserva m  ON m.codigo  = r.motivo_codigo
    JOIN estado_reserva er ON er.codigo = r.estado_codigo
   WHERE r.fecha = v_fecha
   ORDER BY r.hora, r.fecha_creacion;

  CALL sp_ListarEspaciosReserva(v_fecha, v_fecha);
END $$

-- HU-18 · Marcar "Asistió" o "No asistió" (se puede corregir después)
DROP PROCEDURE IF EXISTS sp_MarcarAsistencia $$
CREATE PROCEDURE sp_MarcarAsistencia(
  IN p_reserva_id INT UNSIGNED, IN p_asistio BOOLEAN, IN p_admin_id INT UNSIGNED)
  COMMENT 'HU-18 · Asistió / No asistió'
BEGIN
  DECLARE v_estado VARCHAR(25);

  CALL sp_validar_admin(p_admin_id);

  SELECT estado_codigo INTO v_estado FROM reserva WHERE id = p_reserva_id;
  IF v_estado IS NULL THEN
    CALL sp_error(5404, 'La reserva no existe');
  END IF;
  IF v_estado NOT IN ('CONFIRMADA', 'ASISTIO', 'NO_ASISTIO') THEN
    CALL sp_error(5409, 'La reserva está cancelada');
  END IF;

  UPDATE reserva
     SET estado_codigo = IF(p_asistio, 'ASISTIO', 'NO_ASISTIO'),
         actualizado_por = p_admin_id
   WHERE id = p_reserva_id;
END $$


-- =====================================================================
--  BLOQUE 6 · MÓDULO EVENTOS  (HU-12, HU-13, HU-19)
-- =====================================================================

-- HU-12 · Agenda pública. Devuelve 2 resultados:
--   (1) actividades fijas activas, (2) eventos especiales desde hoy.
DROP PROCEDURE IF EXISTS sp_ListarAgenda $$
CREATE PROCEDURE sp_ListarAgenda()
  COMMENT 'HU-12 · Actividades semanales y eventos próximos'
BEGIN
  SELECT a.id, a.dia_semana_id, d.nombre AS dia, a.hora, a.nombre, a.descripcion,
         'Entrada libre con consumo' AS entrada
    FROM actividad a
    JOIN dia_semana d ON d.id = a.dia_semana_id
   WHERE a.activa
   ORDER BY a.dia_semana_id, a.hora;

  SELECT e.id, e.fecha, e.hora, e.nombre, e.descripcion, e.precio_entrada,
         e.cupo_disponible, (e.cupo_disponible = 0) AS agotado,
         'Requiere ticket' AS entrada
    FROM evento e
   WHERE e.activo AND e.fecha >= fn_hoy()
   ORDER BY e.fecha, e.hora;
END $$

-- HU-19 · Actividades del panel (incluye las desactivadas)
DROP PROCEDURE IF EXISTS sp_ListarActividadesAdmin $$
CREATE PROCEDURE sp_ListarActividadesAdmin(IN p_admin_id INT UNSIGNED)
  COMMENT 'HU-19 · Todas las actividades'
BEGIN
  CALL sp_validar_admin(p_admin_id);
  SELECT a.id, a.dia_semana_id, d.nombre AS dia, a.hora, a.nombre, a.descripcion, a.activa
    FROM actividad a JOIN dia_semana d ON d.id = a.dia_semana_id
   ORDER BY a.activa DESC, a.dia_semana_id, a.hora;
END $$

-- HU-19 · Crear (p_id NULL) o editar una actividad fija
DROP PROCEDURE IF EXISTS sp_GuardarActividad $$
CREATE PROCEDURE sp_GuardarActividad(
  IN p_id            SMALLINT UNSIGNED,
  IN p_dia_semana_id TINYINT UNSIGNED,
  IN p_hora          TIME,
  IN p_nombre        VARCHAR(80),
  IN p_descripcion   VARCHAR(300),
  IN p_admin_id      INT UNSIGNED
)
  COMMENT 'HU-19 · Crea o edita una actividad'
BEGIN
  DECLARE v_id SMALLINT UNSIGNED DEFAULT p_id;

  CALL sp_validar_admin(p_admin_id);
  IF p_dia_semana_id IS NULL OR p_dia_semana_id NOT BETWEEN 1 AND 7 THEN
    CALL sp_error(5400, 'El día no es válido');
  END IF;
  IF p_hora IS NULL THEN
    CALL sp_error(5400, 'La hora es obligatoria');
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO actividad (dia_semana_id, hora, nombre, descripcion, creado_por)
    VALUES (p_dia_semana_id, p_hora, TRIM(p_nombre), TRIM(p_descripcion), p_admin_id);
    SET v_id = LAST_INSERT_ID();
  ELSE
    IF NOT EXISTS (SELECT 1 FROM actividad WHERE id = v_id) THEN
      CALL sp_error(5404, 'La actividad no existe');
    END IF;
    UPDATE actividad
       SET dia_semana_id = p_dia_semana_id, hora = p_hora, nombre = TRIM(p_nombre),
           descripcion = TRIM(p_descripcion), actualizado_por = p_admin_id
     WHERE id = v_id;
  END IF;

  SELECT v_id AS id;
END $$

-- HU-19 · Activar o desactivar una actividad fija
DROP PROCEDURE IF EXISTS sp_CambiarEstadoActividad $$
CREATE PROCEDURE sp_CambiarEstadoActividad(
  IN p_id SMALLINT UNSIGNED, IN p_activa BOOLEAN, IN p_admin_id INT UNSIGNED)
  COMMENT 'HU-19 · Activa o desactiva una actividad'
BEGIN
  CALL sp_validar_admin(p_admin_id);
  IF NOT EXISTS (SELECT 1 FROM actividad WHERE id = p_id) THEN
    CALL sp_error(5404, 'La actividad no existe');
  END IF;
  UPDATE actividad SET activa = p_activa, actualizado_por = p_admin_id WHERE id = p_id;
END $$

-- HU-19 · Eventos del panel con entradas vendidas y disponibles
DROP PROCEDURE IF EXISTS sp_ListarEventosAdmin $$
CREATE PROCEDURE sp_ListarEventosAdmin(IN p_incluir_pasados BOOLEAN, IN p_admin_id INT UNSIGNED)
  COMMENT 'HU-19 · Eventos con vendidas y disponibles'
BEGIN
  CALL sp_validar_admin(p_admin_id);
  SELECT e.id, e.fecha, e.hora, e.nombre, e.descripcion, e.precio_entrada,
         e.cupo_total, e.entradas_vendidas, e.cupo_disponible, e.activo,
         (SELECT COUNT(*) FROM compra_ticket t
           WHERE t.evento_id = e.id AND t.estado_codigo = 'USADO') AS tickets_usados
    FROM evento e
   WHERE IFNULL(p_incluir_pasados, FALSE) OR e.fecha >= fn_hoy()
   ORDER BY e.fecha, e.hora;
END $$

-- HU-19 · Crear (p_id NULL) o editar un evento especial.
-- La API valida antes que la fecha no sea pasada (regla de calendario).
DROP PROCEDURE IF EXISTS sp_GuardarEvento $$
CREATE PROCEDURE sp_GuardarEvento(
  IN p_id             INT UNSIGNED,
  IN p_nombre         VARCHAR(100),
  IN p_descripcion    VARCHAR(500),
  IN p_fecha          DATE,
  IN p_hora           TIME,
  IN p_precio_entrada INT,
  IN p_cupo_total     INT,
  IN p_admin_id       INT UNSIGNED
)
  COMMENT 'HU-19 · Crea o edita un evento (el cupo no baja de lo vendido)'
BEGIN
  DECLARE v_id INT UNSIGNED DEFAULT p_id;
  DECLARE v_vendidas SMALLINT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  CALL sp_validar_admin(p_admin_id);
  IF p_precio_entrada IS NULL OR p_precio_entrada <= 0
     OR p_cupo_total IS NULL OR p_cupo_total <= 0 THEN
    CALL sp_error(5400, 'El precio y el cupo deben ser mayores a cero');
  END IF;
  IF p_cupo_total > 32767 THEN
    CALL sp_error(5400, 'El cupo es demasiado grande');
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL THEN
    CALL sp_error(5400, 'La fecha y la hora son obligatorias');
  END IF;

  START TRANSACTION;
    IF v_id IS NULL THEN
      INSERT INTO evento (nombre, descripcion, fecha, hora, precio_entrada, cupo_total, creado_por)
      VALUES (TRIM(p_nombre), TRIM(p_descripcion), p_fecha, p_hora,
              p_precio_entrada, p_cupo_total, p_admin_id);
      SET v_id = LAST_INSERT_ID();
    ELSE
      -- Bloquea el evento para que no se vendan entradas mientras se edita el cupo
      SELECT entradas_vendidas INTO v_vendidas FROM evento WHERE id = v_id FOR UPDATE;
      IF v_vendidas IS NULL THEN
        CALL sp_error(5404, 'El evento no existe');
      END IF;
      IF p_cupo_total < v_vendidas THEN
        CALL sp_error(5409, CONCAT('El cupo no puede ser menor a las ', v_vendidas,
                                   ' entradas ya vendidas'));
      END IF;
      UPDATE evento
         SET nombre = TRIM(p_nombre), descripcion = TRIM(p_descripcion),
             fecha = p_fecha, hora = p_hora, precio_entrada = p_precio_entrada,
             cupo_total = p_cupo_total, actualizado_por = p_admin_id
       WHERE id = v_id;
    END IF;
  COMMIT;

  SELECT v_id AS id;
END $$

-- HU-19 · Activar o desactivar un evento. No se puede desactivar si ya
-- tiene entradas vendidas (no hay reembolsos).
DROP PROCEDURE IF EXISTS sp_CambiarEstadoEvento $$
CREATE PROCEDURE sp_CambiarEstadoEvento(
  IN p_id INT UNSIGNED, IN p_activo BOOLEAN, IN p_admin_id INT UNSIGNED)
  COMMENT 'HU-19 · Activa o desactiva un evento sin ventas'
BEGIN
  DECLARE v_vendidas SMALLINT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  CALL sp_validar_admin(p_admin_id);

  START TRANSACTION;
    SELECT entradas_vendidas INTO v_vendidas FROM evento WHERE id = p_id FOR UPDATE;
    IF v_vendidas IS NULL THEN
      CALL sp_error(5404, 'El evento no existe');
    END IF;
    IF NOT p_activo AND v_vendidas > 0 THEN
      CALL sp_error(5409, 'El evento ya tiene entradas vendidas y no se puede desactivar');
    END IF;
    UPDATE evento SET activo = p_activo, actualizado_por = p_admin_id WHERE id = p_id;
  COMMIT;
END $$

-- HU-13 · Comprar entradas. El pago ya fue aprobado por el simulador.
-- Si no hay cupo suficiente, se rechaza y el pago simulado se descarta.
-- El FOR UPDATE garantiza que nunca se venda de más.
DROP PROCEDURE IF EXISTS sp_ComprarTickets $$
CREATE PROCEDURE sp_ComprarTickets(
  IN p_cliente_id          INT UNSIGNED,
  IN p_evento_id           INT UNSIGNED,
  IN p_cantidad            TINYINT UNSIGNED,
  IN p_ultimos4            CHAR(4),
  IN p_codigo_autorizacion VARCHAR(20)
)
  COMMENT 'HU-13 · Compra con control de cupo y código único'
BEGIN
  DECLARE v_activo     BOOLEAN;
  DECLARE v_fecha      DATE;
  DECLARE v_disponible SMALLINT;
  DECLARE v_precio     INT UNSIGNED;
  DECLARE v_pago_id    INT UNSIGNED;
  DECLARE v_compra_id  INT UNSIGNED;
  DECLARE v_codigo     CHAR(11);
  DECLARE v_intentos   TINYINT DEFAULT 0;

  DECLARE EXIT HANDLER FOR 1062
  BEGIN
    ROLLBACK;
    CALL sp_error(5409, 'No se pudo registrar la compra. Intente de nuevo');
  END;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  CALL sp_validar_cliente(p_cliente_id);

  IF p_cantidad IS NULL OR p_cantidad NOT BETWEEN 1 AND 6 THEN
    CALL sp_error(5400, 'Puede comprar de 1 a 6 entradas');
  END IF;
  IF p_ultimos4 IS NULL OR p_ultimos4 NOT REGEXP '^[0-9]{4}$'
     OR p_codigo_autorizacion IS NULL OR p_codigo_autorizacion NOT LIKE 'SIM-%' THEN
    CALL sp_error(5400, 'Los datos del pago no son válidos');
  END IF;

  START TRANSACTION;
    SELECT activo, fecha, cupo_disponible, precio_entrada
      INTO v_activo, v_fecha, v_disponible, v_precio
      FROM evento WHERE id = p_evento_id
       FOR UPDATE;

    IF v_activo IS NULL OR NOT v_activo THEN
      CALL sp_error(5404, 'El evento no existe');
    END IF;
    IF v_fecha < fn_hoy() THEN
      CALL sp_error(5409, 'El evento ya pasó');
    END IF;
    IF v_disponible = 0 THEN
      CALL sp_error(5409, 'Evento agotado');
    END IF;
    IF v_disponible < p_cantidad THEN
      CALL sp_error(5409, CONCAT('Solo quedan ', v_disponible, ' espacios'));
    END IF;

    -- Código único (la probabilidad de repetir es mínima; se reintenta igual)
    REPEAT
      SET v_codigo = fn_generar_codigo_ticket();
      SET v_intentos = v_intentos + 1;
    UNTIL NOT EXISTS (SELECT 1 FROM compra_ticket WHERE codigo = v_codigo) OR v_intentos >= 5
    END REPEAT;

    INSERT INTO pago (tipo, monto, ultimos4, codigo_autorizacion, fecha_pago)
    VALUES ('TICKET', v_precio * p_cantidad, p_ultimos4, p_codigo_autorizacion, fn_ahora());
    SET v_pago_id = LAST_INSERT_ID();

    INSERT INTO compra_ticket (codigo, cliente_id, evento_id, cantidad, precio_unitario,
                               pago_id, estado_codigo, fecha_compra)
    VALUES (v_codigo, p_cliente_id, p_evento_id, p_cantidad, v_precio,
            v_pago_id, 'VALIDO', fn_ahora());
    SET v_compra_id = LAST_INSERT_ID();

    UPDATE evento SET entradas_vendidas = entradas_vendidas + p_cantidad WHERE id = p_evento_id;
  COMMIT;

  -- Ticket con su código (la app lo muestra también como QR)
  SELECT t.id, t.codigo, e.nombre AS evento, e.fecha, e.hora, t.cantidad,
         t.precio_unitario, t.total, p.ultimos4, p.codigo_autorizacion,
         t.estado_codigo, et.nombre AS estado, t.fecha_compra
    FROM compra_ticket t
    JOIN evento e         ON e.id = t.evento_id
    JOIN pago p           ON p.id = t.pago_id
    JOIN estado_ticket et ON et.codigo = t.estado_codigo
   WHERE t.id = v_compra_id;
END $$

-- HU-13 · Mis tickets
DROP PROCEDURE IF EXISTS sp_ListarTicketsCliente $$
CREATE PROCEDURE sp_ListarTicketsCliente(IN p_cliente_id INT UNSIGNED)
  COMMENT 'HU-13 · Tickets del cliente (Válido / Usado)'
BEGIN
  SELECT t.id, t.codigo, e.nombre AS evento, e.fecha, e.hora, t.cantidad, t.total,
         t.estado_codigo, et.nombre AS estado, t.fecha_compra, t.fecha_uso
    FROM compra_ticket t
    JOIN evento e         ON e.id = t.evento_id
    JOIN estado_ticket et ON et.codigo = t.estado_codigo
   WHERE t.cliente_id = p_cliente_id
   ORDER BY e.fecha DESC, t.fecha_compra DESC;
END $$

-- HU-19 · Validar un ticket en la entrada: si es válido queda "Usado".
-- Devuelve los datos para que el administrador confirme a quién deja pasar.
DROP PROCEDURE IF EXISTS sp_ValidarTicket $$
CREATE PROCEDURE sp_ValidarTicket(IN p_codigo VARCHAR(20), IN p_admin_id INT UNSIGNED)
  COMMENT 'HU-19 · Marca el ticket como usado'
BEGIN
  DECLARE v_codigo    CHAR(11) DEFAULT UPPER(TRIM(p_codigo));
  DECLARE v_id        INT UNSIGNED;
  DECLARE v_estado    VARCHAR(20);
  DECLARE v_fecha_uso DATETIME;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  CALL sp_validar_admin(p_admin_id);

  START TRANSACTION;
    -- Bloquea el ticket: si dos personas lo presentan a la vez, solo uno entra
    SELECT id, estado_codigo, fecha_uso INTO v_id, v_estado, v_fecha_uso
      FROM compra_ticket WHERE codigo = v_codigo FOR UPDATE;

    IF v_id IS NULL THEN
      CALL sp_error(5404, 'El ticket no existe');
    END IF;
    IF v_estado = 'USADO' THEN
      CALL sp_error(5409, CONCAT('El ticket ya fue usado el ',
                                 DATE_FORMAT(v_fecha_uso, '%d/%m/%Y a las %H:%i')));
    END IF;

    UPDATE compra_ticket
       SET estado_codigo = 'USADO', fecha_uso = fn_ahora(), validado_por = p_admin_id
     WHERE id = v_id;
  COMMIT;

  SELECT t.codigo, e.nombre AS evento, e.fecha, e.hora, (e.fecha = fn_hoy()) AS es_hoy,
         t.cantidad, u.nombre_completo AS cliente, t.fecha_uso
    FROM compra_ticket t
    JOIN evento e  ON e.id = t.evento_id
    JOIN usuario u ON u.id = t.cliente_id
   WHERE t.id = v_id;
END $$

DELIMITER ;

-- =====================================================================
--  USUARIO DE LA API (ejecutar una vez, como root, en cada servidor)
--  La API solo puede ejecutar procedimientos: no lee ni modifica las
--  tablas directamente. Los procedimientos corren con los permisos de
--  quien los creó (SQL SECURITY DEFINER).
--
--  CREATE USER 'alforno_api'@'%' IDENTIFIED BY '<clave del .env>';
--  GRANT EXECUTE ON al_forno.* TO 'alforno_api'@'%';
-- =====================================================================

-- Fin de 02_procedimientos.sql
