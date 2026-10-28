-- =====================================================================
--  AL FORNO · Base de datos
--  02_procedimientos.sql  →  Procedimientos almacenados
--
--  Versión 2.1 · 22 de octubre de 2026 (seguridad de la cuenta)
--  Ejecutar después de 01_tablas.sql. Se puede volver a ejecutar sin
--  borrar datos (cada procedimiento se elimina y se vuelve a crear).
--
--  ---------------------------------------------------------------
--  DÓNDE VIVE CADA REGLA (cada regla en un solo lugar)
--    · API · validación (express-validator): formato de los datos.
--    · API · middleware: si es cliente o administrador.
--    · API · services: reglas del negocio (fechas, horas de reserva,
--      estado del pedido calculado por tiempo...).
--    · Procedimientos (este archivo): leer y guardar datos. Casi todos
--      son UNA sola consulta. Solo cuatro tienen más lógica:
--        ★ sp_CrearPedido  → transacción: el pedido y sus productos se
--                             guardan juntos, o no se guarda nada.
--        ★ sp_CrearReserva → candado: si dos clientes reservan al mismo
--                             tiempo, el segundo espera su turno, así
--                             nunca se pasa del máximo por hora.
--        ★ sp_RegistrarUsuario  → transacción: el usuario, sus 3
--                             respuestas de seguridad y su primera
--                             contraseña se guardan juntos.
--        ★ sp_CambiarContrasena → transacción: la contraseña nueva va al
--                             usuario y al historial al mismo tiempo.
--    · Seguridad (v2.1): las reglas (3 intentos = 1 minuto, 90 días,
--      últimas 5 contraseñas, vencimiento de códigos) están en la API.
--      Aquí solo se leen y se guardan los datos, ya cifrados.
--
--  ---------------------------------------------------------------
--  ERRORES DE NEGOCIO
--  Se lanzan con SIGNAL SQLSTATE '45000' y un MYSQL_ERRNO entre 5400 y
--  5499. El middleware de errores de la API los convierte en la
--  respuesta HTTP (errno - 5000) con el mensaje tal cual:
--    5404 → 404 No existe      5409 → 409 Conflicto (duplicado, sin espacio...)
-- =====================================================================

-- ---------------------------------------------------------------------
--  CÓMO LEER UN PROCEDIMIENTO
--  · DELIMITER $$ cambia el fin de instrucción de ";" a "$$" para que MySQL
--    no corte el procedimiento en el primer ";" que tiene adentro.
--  · DROP ... IF EXISTS + CREATE: permite volver a ejecutar el archivo.
--  · p_... = parámetro que envía la API.  v_... = variable local.
--  · El último SELECT de cada procedimiento es lo que recibe la API.
--  · Los procedimientos de editar terminan con un SELECT de la fila: si
--    el id no existe, la API recibe una lista vacía y responde 404.
-- ---------------------------------------------------------------------

SET NAMES utf8mb4;
USE al_forno;

DELIMITER $$


-- =====================================================================
--  CUENTA  (HU-01, HU-02, HU-14)
--  Seguridad de la cuenta (HU-20 a HU-24) en las secciones siguientes.
--
--  Los datos sensibles llegan YA protegidos desde la API (HU-23):
--    p_..._hash     → bcrypt o SHA-256 (no se pueden volver atrás)
--    p_..._cifrado  → AES-256 (solo la API tiene la llave)
-- =====================================================================

-- HU-01 · Registro público: siempre crea un CLIENTE en estado PENDIENTE
-- (no puede iniciar sesión hasta confirmar el correo).
-- ★ Transacción: el usuario, sus 3 respuestas de seguridad y su primera
--   contraseña en el historial se guardan juntos, o no se guarda nada.
-- p_respuestas: [{"pregunta_id": 1, "respuesta_hash": "$2b$10$..."}, ...]
DROP PROCEDURE IF EXISTS sp_RegistrarUsuario $$
CREATE PROCEDURE sp_RegistrarUsuario(
  IN p_nombre_completo   VARCHAR(100),
  IN p_cedula_cifrada    VARCHAR(100),
  IN p_cedula_hash       CHAR(64),
  IN p_telefono_cifrado  VARCHAR(100),
  IN p_correo            VARCHAR(254),
  IN p_contrasena_hash   CHAR(60),
  IN p_respuestas        JSON
)
BEGIN
  DECLARE v_usuario_id INT UNSIGNED;

  -- Si ocurre cualquier error: deshace lo guardado y reenvía el error a la API
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  -- HU-01: "No se permite registrar un correo o una cédula que ya existen".
  -- La cédula se busca por su hash (cedula_hash), porque cifrada con AES
  -- nunca da el mismo texto dos veces.
  IF EXISTS (SELECT 1 FROM usuario WHERE correo = p_correo) THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5409, MESSAGE_TEXT = 'Ese correo ya está registrado';
  END IF;
  IF EXISTS (SELECT 1 FROM usuario WHERE cedula_hash = p_cedula_hash) THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5409, MESSAGE_TEXT = 'Esa cédula ya está registrada';
  END IF;

  START TRANSACTION;

    -- 1. El usuario (estado PENDIENTE por defecto)
    INSERT INTO usuario (rol, nombre_completo, cedula, cedula_hash, telefono, correo, contrasena_hash)
    VALUES ('CLIENTE', p_nombre_completo, p_cedula_cifrada, p_cedula_hash, p_telefono_cifrado,
            p_correo, p_contrasena_hash);
    SET v_usuario_id = LAST_INSERT_ID();

    -- 2. Las 3 respuestas de seguridad (HU-01, se usan en HU-22).
    --    JSON_TABLE convierte la lista JSON en filas.
    INSERT INTO usuario_respuesta (usuario_id, pregunta_id, respuesta_hash)
    SELECT v_usuario_id, r.pregunta_id, r.respuesta_hash
      FROM JSON_TABLE(p_respuestas, '$[*]' COLUMNS (
             pregunta_id    INT      PATH '$.pregunta_id',
             respuesta_hash CHAR(60) PATH '$.respuesta_hash')) AS r;

    -- 3. La primera contraseña queda en el historial (HU-20: no repetir)
    INSERT INTO contrasena_historial (usuario_id, contrasena_hash)
    VALUES (v_usuario_id, p_contrasena_hash);

  COMMIT;

  -- Devuelve el usuario nuevo
  CALL sp_ObtenerUsuario(v_usuario_id);
END $$

-- HU-02 / HU-14 · Datos para iniciar sesión. La API compara la contraseña
-- con el hash usando bcrypt y revisa el estado, el bloqueo y la vigencia.
DROP PROCEDURE IF EXISTS sp_ObtenerUsuarioPorCorreo $$
CREATE PROCEDURE sp_ObtenerUsuarioPorCorreo(IN p_correo VARCHAR(254))
BEGIN
  SELECT id, rol, nombre_completo, correo, contrasena_hash,
         estado,                -- HU-01: PENDIENTE no puede entrar
         contrasena_fecha,      -- HU-20: vence a los 90 días
         intentos_fallidos,     -- HU-02: 3 intentos
         bloqueado_hasta,       -- HU-02: bloqueo de 1 minuto
         authenticator_activo   -- HU-21: si puede usar Google Authenticator
    FROM usuario
   WHERE correo = p_correo;
END $$

-- Perfil del usuario (sin la contraseña). La cédula y el teléfono salen
-- cifrados: la API los descifra antes de enviarlos a la app.
DROP PROCEDURE IF EXISTS sp_ObtenerUsuario $$
CREATE PROCEDURE sp_ObtenerUsuario(IN p_id INT UNSIGNED)
BEGIN
  SELECT id, rol, nombre_completo, cedula, telefono, correo, estado, authenticator_activo
    FROM usuario
   WHERE id = p_id;
END $$


-- =====================================================================
--  VERIFICACIÓN DE CORREO Y DOBLE FACTOR  (HU-01, HU-21)
--  La API genera el código, lo envía por correo y aquí guarda solo su
--  hash SHA-256 (HU-23).
-- =====================================================================

-- Guarda un código nuevo. Los códigos anteriores del mismo tipo dejan de
-- servir (HU-21: "el cliente puede pedir uno nuevo y el anterior deja de
-- servir"). p_minutos: 1440 (24 h) para VERIFICACION, 2 para DOBLE_FACTOR.
DROP PROCEDURE IF EXISTS sp_GuardarToken $$
CREATE PROCEDURE sp_GuardarToken(
  IN p_usuario_id INT UNSIGNED,
  IN p_tipo       VARCHAR(20),
  IN p_token_hash CHAR(64),
  IN p_minutos    INT UNSIGNED
)
BEGIN
  UPDATE token SET usado = TRUE
   WHERE usuario_id = p_usuario_id AND tipo = p_tipo AND NOT usado;

  INSERT INTO token (usuario_id, tipo, token_hash, vence)
  VALUES (p_usuario_id, p_tipo, p_token_hash, NOW() + INTERVAL p_minutos MINUTE);
END $$

-- Usa un código: solo sirve si existe, es de ese tipo, no se ha usado y
-- no ha vencido. Al usarlo queda marcado (un solo uso).
-- p_usuario_id: NULL para el link de verificación (no se sabe quién es);
-- el id del usuario para el doble factor.
-- Devuelve { usuario_id } si sirvió, o una lista vacía si no.
DROP PROCEDURE IF EXISTS sp_UsarToken $$
CREATE PROCEDURE sp_UsarToken(
  IN p_usuario_id INT UNSIGNED,
  IN p_tipo       VARCHAR(20),
  IN p_token_hash CHAR(64)
)
BEGIN
  DECLARE v_id         INT UNSIGNED;
  DECLARE v_usuario_id INT UNSIGNED;
  DECLARE v_marcados   INT;

  SELECT id, usuario_id INTO v_id, v_usuario_id
    FROM token
   WHERE token_hash = p_token_hash
     AND tipo = p_tipo
     AND NOT usado
     AND vence > NOW()
     AND (p_usuario_id IS NULL OR usuario_id = p_usuario_id)
   LIMIT 1;

  -- "AND NOT usado" otra vez: si llegan dos peticiones al mismo tiempo,
  -- solo una logra marcarlo (ROW_COUNT() = 1).
  UPDATE token SET usado = TRUE WHERE id = v_id AND NOT usado;
  SET v_marcados = ROW_COUNT();

  SELECT v_usuario_id AS usuario_id FROM DUAL WHERE v_marcados = 1;
END $$

-- HU-01 · El cliente confirmó el link "¿Eres vos?": la cuenta queda ACTIVA
DROP PROCEDURE IF EXISTS sp_ActivarUsuario $$
CREATE PROCEDURE sp_ActivarUsuario(IN p_id INT UNSIGNED)
BEGIN
  UPDATE usuario SET estado = 'ACTIVO' WHERE id = p_id;
END $$


-- =====================================================================
--  BLOQUEO POR INTENTOS  (HU-02)
--  La regla (3 intentos = 1 minuto) está en la API; aquí solo se guarda.
-- =====================================================================

-- p_bloqueado_hasta: NULL = sin bloqueo
DROP PROCEDURE IF EXISTS sp_ActualizarIntentos $$
CREATE PROCEDURE sp_ActualizarIntentos(
  IN p_id              INT UNSIGNED,
  IN p_intentos        TINYINT UNSIGNED,
  IN p_bloqueado_hasta DATETIME
)
BEGIN
  UPDATE usuario
     SET intentos_fallidos = p_intentos,
         bloqueado_hasta   = p_bloqueado_hasta
   WHERE id = p_id;
END $$


-- =====================================================================
--  PREGUNTAS DE SEGURIDAD  (HU-01, HU-22)
-- =====================================================================

-- HU-01 · La lista para elegir en el registro
DROP PROCEDURE IF EXISTS sp_ListarPreguntas $$
CREATE PROCEDURE sp_ListarPreguntas()
BEGIN
  SELECT id, texto FROM pregunta_seguridad ORDER BY id;
END $$

-- HU-22 · Las 3 preguntas del cliente, con el hash de cada respuesta.
-- La API muestra solo el texto y compara las respuestas con bcrypt.
DROP PROCEDURE IF EXISTS sp_ObtenerPreguntasUsuario $$
CREATE PROCEDURE sp_ObtenerPreguntasUsuario(IN p_usuario_id INT UNSIGNED)
BEGIN
  SELECT p.id AS pregunta_id, p.texto, r.respuesta_hash
    FROM usuario_respuesta r
    JOIN pregunta_seguridad p ON p.id = r.pregunta_id
   WHERE r.usuario_id = p_usuario_id
   ORDER BY p.id;
END $$


-- =====================================================================
--  CONTRASEÑAS  (HU-20, HU-22)
-- =====================================================================

-- HU-20 · Las últimas contraseñas (p_cantidad = 5), de la más nueva a la
-- más vieja. La API compara la nueva con cada una usando bcrypt.
DROP PROCEDURE IF EXISTS sp_ListarHistorialContrasenas $$
CREATE PROCEDURE sp_ListarHistorialContrasenas(
  IN p_usuario_id INT UNSIGNED,
  IN p_cantidad   TINYINT UNSIGNED
)
BEGIN
  SELECT contrasena_hash
    FROM contrasena_historial
   WHERE usuario_id = p_usuario_id
   ORDER BY fecha DESC, id DESC
   LIMIT p_cantidad;
END $$

-- HU-20 / HU-22 · Cambiar o recuperar la contraseña.
-- ★ Transacción: la contraseña nueva se guarda en el usuario y en el
--   historial al mismo tiempo. También reinicia la fecha (vigencia de
--   90 días) y quita los intentos fallidos y el bloqueo.
DROP PROCEDURE IF EXISTS sp_CambiarContrasena $$
CREATE PROCEDURE sp_CambiarContrasena(
  IN p_id              INT UNSIGNED,
  IN p_contrasena_hash CHAR(60)
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF NOT EXISTS (SELECT 1 FROM usuario WHERE id = p_id) THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5404, MESSAGE_TEXT = 'El usuario no existe';
  END IF;

  START TRANSACTION;

    UPDATE usuario
       SET contrasena_hash   = p_contrasena_hash,
           contrasena_fecha  = NOW(),
           intentos_fallidos = 0,
           bloqueado_hasta   = NULL
     WHERE id = p_id;

    INSERT INTO contrasena_historial (usuario_id, contrasena_hash)
    VALUES (p_id, p_contrasena_hash);

  COMMIT;
END $$


-- =====================================================================
--  GOOGLE AUTHENTICATOR  (HU-21, HU-22)
--  La clave secreta llega cifrada con AES desde la API (HU-23).
-- =====================================================================

-- Paso 1 de la vinculación: guarda la clave nueva, todavía SIN activar
-- (el cliente aún no ha escrito el primer código).
DROP PROCEDURE IF EXISTS sp_GuardarAuthenticator $$
CREATE PROCEDURE sp_GuardarAuthenticator(
  IN p_id               INT UNSIGNED,
  IN p_secreto_cifrado  VARCHAR(200)
)
BEGIN
  UPDATE usuario
     SET authenticator_secreto = p_secreto_cifrado,
         authenticator_activo  = FALSE
   WHERE id = p_id;
END $$

-- Paso 2: el primer código fue correcto, queda vinculado
DROP PROCEDURE IF EXISTS sp_ActivarAuthenticator $$
CREATE PROCEDURE sp_ActivarAuthenticator(IN p_id INT UNSIGNED)
BEGIN
  UPDATE usuario
     SET authenticator_activo = TRUE
   WHERE id = p_id AND authenticator_secreto IS NOT NULL;
END $$

-- Desvincular: se borra la clave
DROP PROCEDURE IF EXISTS sp_DesvincularAuthenticator $$
CREATE PROCEDURE sp_DesvincularAuthenticator(IN p_id INT UNSIGNED)
BEGIN
  UPDATE usuario
     SET authenticator_secreto = NULL,
         authenticator_activo  = FALSE
   WHERE id = p_id;
END $$

-- La clave cifrada, para que la API valide el código de 6 dígitos
DROP PROCEDURE IF EXISTS sp_ObtenerAuthenticator $$
CREATE PROCEDURE sp_ObtenerAuthenticator(IN p_id INT UNSIGNED)
BEGIN
  SELECT authenticator_secreto, authenticator_activo
    FROM usuario
   WHERE id = p_id;
END $$


-- =====================================================================
--  AUDITORÍA  (HU-24)
--  Solo se agregan filas: no hay procedimientos para editar ni borrar.
--  La fecha y la hora las pone MySQL (hora de Costa Rica).
-- =====================================================================

-- p_actividad: REGISTRO, LOGIN_EXITOSO, LOGIN_FALLIDO, BLOQUEO,
--              CAMBIO_CONTRASENA, RECUPERACION
-- p_resultado: EXITO o FALLO
DROP PROCEDURE IF EXISTS sp_RegistrarAuditoria $$
CREATE PROCEDURE sp_RegistrarAuditoria(
  IN p_usuario_id  INT UNSIGNED,
  IN p_correo      VARCHAR(254),
  IN p_actividad   VARCHAR(20),
  IN p_resultado   VARCHAR(5),
  IN p_ip          VARCHAR(45),
  IN p_dispositivo VARCHAR(200)
)
BEGIN
  INSERT INTO auditoria (usuario_id, correo, actividad, resultado, ip, dispositivo)
  VALUES (p_usuario_id, p_correo, p_actividad, p_resultado, p_ip, p_dispositivo);
END $$


-- =====================================================================
--  PROMOCIONES  (HU-06, HU-17)
-- =====================================================================

-- HU-06 · Promociones que ve el cliente (lista vacía → "No hay promociones")
DROP PROCEDURE IF EXISTS sp_ListarPromocionesActivas $$
CREATE PROCEDURE sp_ListarPromocionesActivas()
BEGIN
  SELECT id, titulo, descripcion FROM promocion WHERE activa ORDER BY id DESC;
END $$

-- HU-17 · Todas las promociones (administrador)
DROP PROCEDURE IF EXISTS sp_ListarPromociones $$
CREATE PROCEDURE sp_ListarPromociones()
BEGIN
  SELECT id, titulo, descripcion, activa FROM promocion ORDER BY activa DESC, id DESC;
END $$

DROP PROCEDURE IF EXISTS sp_ObtenerPromocion $$
CREATE PROCEDURE sp_ObtenerPromocion(IN p_id INT UNSIGNED)
BEGIN
  SELECT id, titulo, descripcion, activa FROM promocion WHERE id = p_id;
END $$

DROP PROCEDURE IF EXISTS sp_CrearPromocion $$
CREATE PROCEDURE sp_CrearPromocion(IN p_titulo VARCHAR(80), IN p_descripcion VARCHAR(500))
BEGIN
  INSERT INTO promocion (titulo, descripcion) VALUES (p_titulo, p_descripcion);
  CALL sp_ObtenerPromocion(LAST_INSERT_ID());
END $$

DROP PROCEDURE IF EXISTS sp_EditarPromocion $$
CREATE PROCEDURE sp_EditarPromocion(IN p_id INT UNSIGNED, IN p_titulo VARCHAR(80), IN p_descripcion VARCHAR(500))
BEGIN
  UPDATE promocion SET titulo = p_titulo, descripcion = p_descripcion WHERE id = p_id;
  CALL sp_ObtenerPromocion(p_id);
END $$

-- HU-17 · Activar (TRUE) o desactivar (FALSE)
DROP PROCEDURE IF EXISTS sp_CambiarEstadoPromocion $$
CREATE PROCEDURE sp_CambiarEstadoPromocion(IN p_id INT UNSIGNED, IN p_activa BOOLEAN)
BEGIN
  UPDATE promocion SET activa = p_activa WHERE id = p_id;
  CALL sp_ObtenerPromocion(p_id);
END $$


-- =====================================================================
--  MENÚ  (HU-03, HU-15)
-- =====================================================================

-- HU-03 / HU-15 · Productos activos por categoría. Lo usan el cliente y el admin.
DROP PROCEDURE IF EXISTS sp_ListarMenu $$
CREATE PROCEDURE sp_ListarMenu()
BEGIN
  SELECT id, nombre, descripcion, categoria, precio
    FROM producto
   WHERE activo
   ORDER BY categoria, nombre;   -- categoria sigue el orden del ENUM
END $$

DROP PROCEDURE IF EXISTS sp_ObtenerProducto $$
CREATE PROCEDURE sp_ObtenerProducto(IN p_id INT UNSIGNED)
BEGIN
  SELECT id, nombre, descripcion, categoria, precio
    FROM producto
   WHERE id = p_id AND activo;
END $$

DROP PROCEDURE IF EXISTS sp_CrearProducto $$
CREATE PROCEDURE sp_CrearProducto(
  IN p_nombre VARCHAR(80), IN p_descripcion VARCHAR(300),
  IN p_categoria VARCHAR(20), IN p_precio INT UNSIGNED)
BEGIN
  INSERT INTO producto (nombre, descripcion, categoria, precio)
  VALUES (p_nombre, p_descripcion, p_categoria, p_precio);
  CALL sp_ObtenerProducto(LAST_INSERT_ID());
END $$

DROP PROCEDURE IF EXISTS sp_EditarProducto $$
CREATE PROCEDURE sp_EditarProducto(
  IN p_id INT UNSIGNED, IN p_nombre VARCHAR(80), IN p_descripcion VARCHAR(300),
  IN p_categoria VARCHAR(20), IN p_precio INT UNSIGNED)
BEGIN
  UPDATE producto
     SET nombre = p_nombre, descripcion = p_descripcion,
         categoria = p_categoria, precio = p_precio
   WHERE id = p_id AND activo;
  CALL sp_ObtenerProducto(p_id);
END $$

-- HU-15 · "Eliminar": se desactiva para no afectar los pedidos que ya lo tienen.
-- Devuelve eliminado = 1 si lo encontró, 0 si no existía.
DROP PROCEDURE IF EXISTS sp_EliminarProducto $$
CREATE PROCEDURE sp_EliminarProducto(IN p_id INT UNSIGNED)
BEGIN
  UPDATE producto SET activo = FALSE WHERE id = p_id AND activo;
  SELECT ROW_COUNT() AS eliminado;
END $$


-- =====================================================================
--  PEDIDOS  (HU-07, HU-08, HU-09)
-- =====================================================================

-- ★ HU-07 / HU-08 · Crea un pedido ya pagado.
-- Antes de llamarlo, la API valida el horario (hasta 30 min antes del
-- cierre), las cantidades (1 a 10) y aprueba el pago simulado.
-- p_productos: el carrito como texto JSON, por ejemplo:
--   '[{"producto_id": 1, "cantidad": 2}, {"producto_id": 5, "cantidad": 1}]'
-- El precio se toma de la tabla producto (no de la app) y se guarda como
-- precio_unitario. Todo va en una TRANSACCIÓN: si algo falla, no se guarda nada.
DROP PROCEDURE IF EXISTS sp_CrearPedido $$
CREATE PROCEDURE sp_CrearPedido(
  IN p_usuario_id       INT UNSIGNED,
  IN p_tarjeta_ultimos4 CHAR(4),
  IN p_productos        JSON
)
BEGIN
  DECLARE v_pedido_id   INT UNSIGNED;
  DECLARE v_disponibles INT;

  -- Si ocurre cualquier error: deshace lo guardado y reenvía el error a la API
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

    -- 1. Cuenta cuántos productos del carrito están activos.
    --    JSON_TABLE convierte el carrito JSON en filas para poder hacer JOIN.
    SELECT COUNT(*) INTO v_disponibles
      FROM JSON_TABLE(p_productos, '$[*]' COLUMNS (producto_id INT PATH '$.producto_id')) AS c
      JOIN producto p ON p.id = c.producto_id
     WHERE p.activo;

    -- Si falta alguno, es porque se eliminó mientras el cliente compraba
    IF v_disponibles <> JSON_LENGTH(p_productos) THEN
      SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5409,
        MESSAGE_TEXT = 'Uno de los productos ya no está disponible';
    END IF;

    -- 2. El pedido (el total se calcula en el paso 4)
    INSERT INTO pedido (usuario_id, total, tarjeta_ultimos4)
    VALUES (p_usuario_id, 0, p_tarjeta_ultimos4);
    SET v_pedido_id = LAST_INSERT_ID();

    -- 3. Los productos del pedido, con el precio actual
    INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario)
    SELECT v_pedido_id, p.id, c.cantidad, p.precio
      FROM JSON_TABLE(p_productos, '$[*]' COLUMNS (
             producto_id INT PATH '$.producto_id',
             cantidad    INT PATH '$.cantidad')) AS c
      JOIN producto p ON p.id = c.producto_id;

    -- 4. El total = suma de precio × cantidad
    UPDATE pedido
       SET total = (SELECT SUM(precio_unitario * cantidad)
                      FROM pedido_detalle WHERE pedido_id = v_pedido_id)
     WHERE id = v_pedido_id;

  COMMIT;

  -- Devuelve el comprobante
  CALL sp_ObtenerPedido(v_pedido_id, p_usuario_id);
END $$

-- HU-08 / HU-09 · Un pedido con sus productos (comprobante y detalle).
-- p_usuario_id = el cliente: solo ve sus propios pedidos.
-- Devuelve DOS resultados: 1) datos del pedido  2) sus productos.
DROP PROCEDURE IF EXISTS sp_ObtenerPedido $$
CREATE PROCEDURE sp_ObtenerPedido(IN p_id INT UNSIGNED, IN p_usuario_id INT UNSIGNED)
BEGIN
  -- El estado no se guarda: la API lo calcula con la fecha del pedido.
  SELECT pe.id, pe.total, pe.tarjeta_ultimos4, pe.fecha,
         u.nombre_completo AS cliente
    FROM pedido pe
    JOIN usuario u ON u.id = pe.usuario_id
   WHERE pe.id = p_id
     AND pe.usuario_id = p_usuario_id;

  -- El nombre sale del producto actual; el precio es el que se pagó
  SELECT pr.nombre, d.cantidad, d.precio_unitario,
         d.precio_unitario * d.cantidad AS subtotal
    FROM pedido_detalle d
    JOIN pedido pe  ON pe.id = d.pedido_id
    JOIN producto pr ON pr.id = d.producto_id
   WHERE d.pedido_id = p_id
     AND pe.usuario_id = p_usuario_id;
END $$

-- HU-09 · Mis pedidos (del más reciente al más antiguo)
DROP PROCEDURE IF EXISTS sp_ListarPedidosCliente $$
CREATE PROCEDURE sp_ListarPedidosCliente(IN p_usuario_id INT UNSIGNED)
BEGIN
  SELECT id, fecha, total
    FROM pedido
   WHERE usuario_id = p_usuario_id
   ORDER BY fecha DESC;
END $$

-- =====================================================================
--  RESERVAS  (HU-10, HU-11)
-- =====================================================================

-- ★ HU-10 · Crear una reserva.
-- Antes de llamarlo, la API valida: no fechas pasadas, máximo 30 días,
-- una de las horas que se ofrecen (12:00 a 22:00) y de 1 a 8 personas.
-- Aquí se controla lo que depende de las otras reservas:
--   · máximo p_maximo reservas confirmadas por hora (el número lo manda
--     la API: MAXIMO_POR_HORA en reservas.servicio.js)
--   · 1 reserva confirmada por día por cliente
-- CANDADO: GET_LOCK pide un "candado" con el nombre de la fecha. Si dos
-- clientes reservan para el mismo día al mismo tiempo, el segundo espera
-- (máximo 10 segundos) a que el primero termine. Así los dos no pueden
-- contar las reservas a la vez y pasarse del máximo.
DROP PROCEDURE IF EXISTS sp_CrearReserva $$
CREATE PROCEDURE sp_CrearReserva(
  IN p_usuario_id INT UNSIGNED,
  IN p_fecha      DATE,
  IN p_hora       TIME,
  IN p_personas   TINYINT UNSIGNED,
  IN p_maximo     TINYINT UNSIGNED
)
BEGIN
  DECLARE v_candado  VARCHAR(40) DEFAULT CONCAT('al_forno_reserva_', p_fecha);
  DECLARE v_ocupadas INT;

  -- Si ocurre cualquier error: suelta el candado y reenvía el error a la API
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    DO RELEASE_LOCK(v_candado);
    RESIGNAL;
  END;

  -- 1. Toma el candado de esa fecha (o espera su turno)
  IF GET_LOCK(v_candado, 10) <> 1 THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5409,
      MESSAGE_TEXT = 'Hay muchas reservas en este momento. Intente de nuevo';
  END IF;

  -- 2. HU-10: una sola reserva confirmada por día
  IF EXISTS (SELECT 1 FROM reserva
              WHERE usuario_id = p_usuario_id AND fecha = p_fecha AND estado = 'Confirmada') THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5409,
      MESSAGE_TEXT = 'Ya tiene una reserva para ese día';
  END IF;

  -- 3. HU-10: máximo p_maximo reservas confirmadas por hora
  SELECT COUNT(*) INTO v_ocupadas
    FROM reserva
   WHERE fecha = p_fecha AND hora = p_hora AND estado = 'Confirmada';

  IF v_ocupadas >= p_maximo THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5409,
      MESSAGE_TEXT = 'Sin espacio: esa hora ya está llena. Escoja otra hora';
  END IF;

  -- 4. Guarda la reserva y suelta el candado
  INSERT INTO reserva (usuario_id, fecha, hora, personas)
  VALUES (p_usuario_id, p_fecha, p_hora, p_personas);

  DO RELEASE_LOCK(v_candado);

  -- Devuelve el resumen de la reserva
  CALL sp_ObtenerReserva(LAST_INSERT_ID(), p_usuario_id);
END $$

-- HU-10 · Reservas confirmadas por hora en una fecha.
-- La API arma las horas del día y marca "Sin espacio" donde ya se llegó
-- al máximo. Las horas sin reservas no aparecen (tienen 0).
DROP PROCEDURE IF EXISTS sp_ListarOcupacion $$
CREATE PROCEDURE sp_ListarOcupacion(IN p_fecha DATE)
BEGIN
  SELECT hora, COUNT(*) AS ocupadas
    FROM reserva
   WHERE fecha = p_fecha AND estado = 'Confirmada'
   GROUP BY hora
   ORDER BY hora;
END $$

-- HU-10 / HU-11 · Una reserva del cliente (solo ve las suyas).
DROP PROCEDURE IF EXISTS sp_ObtenerReserva $$
CREATE PROCEDURE sp_ObtenerReserva(IN p_id INT UNSIGNED, IN p_usuario_id INT UNSIGNED)
BEGIN
  SELECT id, fecha, hora, personas, estado
    FROM reserva
   WHERE id = p_id
     AND usuario_id = p_usuario_id;
END $$

-- HU-11 · Mis reservas: de hoy en adelante (CURDATE = hoy en Costa Rica)
DROP PROCEDURE IF EXISTS sp_ListarReservasCliente $$
CREATE PROCEDURE sp_ListarReservasCliente(IN p_usuario_id INT UNSIGNED)
BEGIN
  SELECT id, fecha, hora, personas, estado
    FROM reserva
   WHERE usuario_id = p_usuario_id AND fecha >= CURDATE()
   ORDER BY fecha, hora;
END $$

-- HU-11 · Cancelar una reserva CONFIRMADA del cliente (el espacio queda libre).
-- Devuelve cancelada = 1 si se canceló, 0 si no existe o ya estaba cancelada.
DROP PROCEDURE IF EXISTS sp_CancelarReserva $$
CREATE PROCEDURE sp_CancelarReserva(IN p_id INT UNSIGNED, IN p_usuario_id INT UNSIGNED)
BEGIN
  UPDATE reserva
     SET estado = 'Cancelada'
   WHERE id = p_id
     AND estado = 'Confirmada'
     AND usuario_id = p_usuario_id;
  SELECT ROW_COUNT() AS cancelada;
END $$


DELIMITER ;

-- Fin de 02_procedimientos.sql
