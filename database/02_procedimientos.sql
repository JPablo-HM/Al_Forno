-- =====================================================================
--  AL FORNO · Base de datos
--  02_procedimientos.sql  →  Procedimientos almacenados
--
--  Versión 2.0 · 8 de octubre de 2026 (versión simplificada)
--  Ejecutar después de 01_tablas.sql. Se puede volver a ejecutar sin
--  borrar datos (cada procedimiento se elimina y se vuelve a crear).
--
--  ---------------------------------------------------------------
--  DÓNDE VIVE CADA REGLA (cada regla en un solo lugar)
--    · API · validación (express-validator): formato de los datos.
--    · API · middleware: si es cliente o administrador.
--    · API · services: reglas del negocio (horario, fechas, orden de
--      los estados del pedido, solo tickets de eventos con cover...).
--    · Procedimientos (este archivo): leer y guardar datos. Casi todos
--      son UNA sola consulta. Solo dos tienen más lógica:
--        ★ sp_CrearPedido  → transacción: el pedido y sus productos se
--                             guardan juntos, o no se guarda nada.
--        ★ sp_CrearReserva → candado: si dos clientes reservan al mismo
--                             tiempo, el segundo espera su turno, así
--                             nunca hay más de 3 reservas por hora.
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
-- =====================================================================

-- HU-01 · Registro público: siempre crea un CLIENTE.
-- p_contrasena_hash: la API ya la cifró con bcrypt.
DROP PROCEDURE IF EXISTS sp_RegistrarUsuario $$
CREATE PROCEDURE sp_RegistrarUsuario(
  IN p_nombre_completo VARCHAR(100),
  IN p_cedula          CHAR(9),
  IN p_telefono        CHAR(8),
  IN p_correo          VARCHAR(254),
  IN p_contrasena_hash CHAR(60)
)
BEGIN
  -- HU-01: "No se permite registrar un correo o una cédula que ya existen"
  IF EXISTS (SELECT 1 FROM usuario WHERE correo = p_correo) THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5409, MESSAGE_TEXT = 'Ese correo ya está registrado';
  END IF;
  IF EXISTS (SELECT 1 FROM usuario WHERE cedula = p_cedula) THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5409, MESSAGE_TEXT = 'Esa cédula ya está registrada';
  END IF;

  INSERT INTO usuario (rol, nombre_completo, cedula, telefono, correo, contrasena_hash)
  VALUES ('CLIENTE', p_nombre_completo, p_cedula, p_telefono, p_correo, p_contrasena_hash);

  -- Devuelve el usuario nuevo (queda con la sesión iniciada)
  CALL sp_ObtenerUsuario(LAST_INSERT_ID());
END $$

-- HU-02 / HU-14 · Datos para iniciar sesión. La API compara la contraseña
-- con el hash usando bcrypt.
DROP PROCEDURE IF EXISTS sp_ObtenerUsuarioPorCorreo $$
CREATE PROCEDURE sp_ObtenerUsuarioPorCorreo(IN p_correo VARCHAR(254))
BEGIN
  SELECT id, rol, nombre_completo, correo, contrasena_hash
    FROM usuario
   WHERE correo = p_correo;
END $$

-- Perfil del usuario (sin la contraseña)
DROP PROCEDURE IF EXISTS sp_ObtenerUsuario $$
CREATE PROCEDURE sp_ObtenerUsuario(IN p_id INT UNSIGNED)
BEGIN
  SELECT id, rol, nombre_completo, cedula, telefono, correo
    FROM usuario
   WHERE id = p_id;
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

-- HU-03 / HU-15 · Productos activos por categoría. Los agotados sí salen
-- (con agotado = 1) para mostrar la etiqueta. Lo usan el cliente y el admin.
DROP PROCEDURE IF EXISTS sp_ListarMenu $$
CREATE PROCEDURE sp_ListarMenu()
BEGIN
  SELECT id, nombre, descripcion, categoria, precio, agotado
    FROM producto
   WHERE activo
   ORDER BY categoria, nombre;   -- categoria sigue el orden del ENUM
END $$

DROP PROCEDURE IF EXISTS sp_ObtenerProducto $$
CREATE PROCEDURE sp_ObtenerProducto(IN p_id INT UNSIGNED)
BEGIN
  SELECT id, nombre, descripcion, categoria, precio, agotado
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

-- HU-15 · Marcar (TRUE) o desmarcar (FALSE) como "Agotado"
DROP PROCEDURE IF EXISTS sp_CambiarAgotado $$
CREATE PROCEDURE sp_CambiarAgotado(IN p_id INT UNSIGNED, IN p_agotado BOOLEAN)
BEGIN
  UPDATE producto SET agotado = p_agotado WHERE id = p_id AND activo;
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
--  PEDIDOS  (HU-07, HU-08, HU-09, HU-16)
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
  IN p_nota             VARCHAR(200),
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

    -- 1. Cuenta cuántos productos del carrito están activos y NO agotados.
    --    JSON_TABLE convierte el carrito JSON en filas para poder hacer JOIN.
    SELECT COUNT(*) INTO v_disponibles
      FROM JSON_TABLE(p_productos, '$[*]' COLUMNS (producto_id INT PATH '$.producto_id')) AS c
      JOIN producto p ON p.id = c.producto_id
     WHERE p.activo AND NOT p.agotado;

    -- Si falta alguno, es porque se agotó o se eliminó mientras el cliente compraba
    IF v_disponibles <> JSON_LENGTH(p_productos) THEN
      SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5409,
        MESSAGE_TEXT = 'Uno de los productos ya no está disponible';
    END IF;

    -- 2. El pedido (el total se calcula en el paso 4)
    INSERT INTO pedido (usuario_id, nota, total, tarjeta_ultimos4)
    VALUES (p_usuario_id, p_nota, 0, p_tarjeta_ultimos4);
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

-- HU-08 / HU-09 / HU-16 · Un pedido con sus productos (comprobante y detalle).
-- p_usuario_id = el cliente (solo ve los suyos) · NULL = administrador.
-- Devuelve DOS resultados: 1) datos del pedido  2) sus productos.
DROP PROCEDURE IF EXISTS sp_ObtenerPedido $$
CREATE PROCEDURE sp_ObtenerPedido(IN p_id INT UNSIGNED, IN p_usuario_id INT UNSIGNED)
BEGIN
  SELECT pe.id, pe.estado, pe.nota, pe.total, pe.tarjeta_ultimos4, pe.fecha,
         u.nombre_completo AS cliente, u.telefono
    FROM pedido pe
    JOIN usuario u ON u.id = pe.usuario_id
   WHERE pe.id = p_id
     AND (p_usuario_id IS NULL OR pe.usuario_id = p_usuario_id);

  -- El nombre sale del producto actual; el precio es el que se pagó
  SELECT pr.nombre, d.cantidad, d.precio_unitario,
         d.precio_unitario * d.cantidad AS subtotal
    FROM pedido_detalle d
    JOIN pedido pe  ON pe.id = d.pedido_id
    JOIN producto pr ON pr.id = d.producto_id
   WHERE d.pedido_id = p_id
     AND (p_usuario_id IS NULL OR pe.usuario_id = p_usuario_id);
END $$

-- HU-09 · Mis pedidos (del más reciente al más antiguo)
DROP PROCEDURE IF EXISTS sp_ListarPedidosCliente $$
CREATE PROCEDURE sp_ListarPedidosCliente(IN p_usuario_id INT UNSIGNED)
BEGIN
  SELECT id, fecha, total, estado
    FROM pedido
   WHERE usuario_id = p_usuario_id
   ORDER BY fecha DESC;
END $$

-- HU-16 · Pedidos activos (todos menos Entregado), del más antiguo al más reciente
DROP PROCEDURE IF EXISTS sp_ListarPedidosActivos $$
CREATE PROCEDURE sp_ListarPedidosActivos()
BEGIN
  SELECT pe.id, pe.estado, pe.nota, pe.total, pe.fecha,
         u.nombre_completo AS cliente, u.telefono
    FROM pedido pe
    JOIN usuario u ON u.id = pe.usuario_id
   WHERE pe.estado <> 'Entregado'
   ORDER BY pe.fecha;
END $$

-- HU-16 · Historial con filtros opcionales por estado y por fecha (NULL = todos)
DROP PROCEDURE IF EXISTS sp_ListarHistorialPedidos $$
CREATE PROCEDURE sp_ListarHistorialPedidos(IN p_estado VARCHAR(20), IN p_fecha DATE)
BEGIN
  SELECT pe.id, pe.estado, pe.total, pe.fecha, u.nombre_completo AS cliente
    FROM pedido pe
    JOIN usuario u ON u.id = pe.usuario_id
   WHERE (p_estado IS NULL OR pe.estado = p_estado)
     AND (p_fecha  IS NULL OR DATE(pe.fecha) = p_fecha)
   ORDER BY pe.fecha DESC;
END $$

-- HU-16 · Cambiar el estado. La API ya revisó que sea el siguiente en orden.
DROP PROCEDURE IF EXISTS sp_CambiarEstadoPedido $$
CREATE PROCEDURE sp_CambiarEstadoPedido(IN p_id INT UNSIGNED, IN p_estado VARCHAR(20))
BEGIN
  UPDATE pedido SET estado = p_estado WHERE id = p_id;
  SELECT id, estado FROM pedido WHERE id = p_id;
END $$


-- =====================================================================
--  RESERVAS  (HU-10, HU-11, HU-18)
-- =====================================================================

-- ★ HU-10 · Crear una reserva.
-- Antes de llamarlo, la API valida: no fechas pasadas, no lunes, máximo
-- 30 días, hora exacta dentro del horario y de 1 a 8 personas.
-- Aquí se controla lo que depende de las otras reservas:
--   · máximo 3 reservas confirmadas por hora
--   · 1 reserva confirmada por día por cliente
-- CANDADO: GET_LOCK pide un "candado" con el nombre de la fecha. Si dos
-- clientes reservan para el mismo día al mismo tiempo, el segundo espera
-- (máximo 10 segundos) a que el primero termine. Así los dos no pueden
-- contar "2 reservas" a la vez y guardar la cuarta.
DROP PROCEDURE IF EXISTS sp_CrearReserva $$
CREATE PROCEDURE sp_CrearReserva(
  IN p_usuario_id INT UNSIGNED,
  IN p_fecha      DATE,
  IN p_hora       TIME,
  IN p_personas   TINYINT UNSIGNED,
  IN p_motivo     VARCHAR(30),
  IN p_comentario VARCHAR(250)
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

  -- 3. HU-10: máximo 3 reservas confirmadas por hora
  SELECT COUNT(*) INTO v_ocupadas
    FROM reserva
   WHERE fecha = p_fecha AND hora = p_hora AND estado = 'Confirmada';

  IF v_ocupadas >= 3 THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5409,
      MESSAGE_TEXT = 'Sin espacio: esa hora ya tiene 3 reservas. Escoja otra hora';
  END IF;

  -- 4. Guarda la reserva y suelta el candado
  INSERT INTO reserva (usuario_id, fecha, hora, personas, motivo, comentario)
  VALUES (p_usuario_id, p_fecha, p_hora, p_personas, p_motivo, p_comentario);

  DO RELEASE_LOCK(v_candado);

  -- Devuelve el resumen de la reserva
  CALL sp_ObtenerReserva(LAST_INSERT_ID(), p_usuario_id);
END $$

-- HU-10 / HU-18 · Reservas confirmadas por hora en una fecha.
-- La API arma las horas del día según el horario y marca "Sin espacio"
-- donde ocupadas = 3. Las horas sin reservas no aparecen (tienen 0).
DROP PROCEDURE IF EXISTS sp_ListarOcupacion $$
CREATE PROCEDURE sp_ListarOcupacion(IN p_fecha DATE)
BEGIN
  SELECT hora, COUNT(*) AS ocupadas
    FROM reserva
   WHERE fecha = p_fecha AND estado = 'Confirmada'
   GROUP BY hora
   ORDER BY hora;
END $$

-- HU-10 / HU-11 · Una reserva. p_usuario_id = el cliente · NULL = administrador.
DROP PROCEDURE IF EXISTS sp_ObtenerReserva $$
CREATE PROCEDURE sp_ObtenerReserva(IN p_id INT UNSIGNED, IN p_usuario_id INT UNSIGNED)
BEGIN
  SELECT id, fecha, hora, personas, motivo, comentario, estado
    FROM reserva
   WHERE id = p_id
     AND (p_usuario_id IS NULL OR usuario_id = p_usuario_id);
END $$

-- HU-11 · Mis reservas: de hoy en adelante (CURDATE = hoy en Costa Rica)
DROP PROCEDURE IF EXISTS sp_ListarReservasCliente $$
CREATE PROCEDURE sp_ListarReservasCliente(IN p_usuario_id INT UNSIGNED)
BEGIN
  SELECT id, fecha, hora, personas, motivo, comentario, estado
    FROM reserva
   WHERE usuario_id = p_usuario_id AND fecha >= CURDATE()
   ORDER BY fecha, hora;
END $$

-- HU-18 · Reservas de un día (administrador), ordenadas por hora
DROP PROCEDURE IF EXISTS sp_ListarReservasDia $$
CREATE PROCEDURE sp_ListarReservasDia(IN p_fecha DATE)
BEGIN
  SELECT r.id, r.hora, r.personas, r.motivo, r.comentario, r.estado,
         u.nombre_completo AS cliente, u.telefono
    FROM reserva r
    JOIN usuario u ON u.id = r.usuario_id
   WHERE r.fecha = p_fecha
   ORDER BY r.hora;
END $$

-- HU-11 / HU-18 · Cancelar una reserva CONFIRMADA (el espacio queda libre).
-- p_usuario_id = el cliente (solo las suyas) · NULL = administrador.
-- Devuelve cancelada = 1 si se canceló, 0 si no existe o ya estaba cancelada.
DROP PROCEDURE IF EXISTS sp_CancelarReserva $$
CREATE PROCEDURE sp_CancelarReserva(IN p_id INT UNSIGNED, IN p_usuario_id INT UNSIGNED)
BEGIN
  UPDATE reserva
     SET estado = 'Cancelada'
   WHERE id = p_id
     AND estado = 'Confirmada'
     AND (p_usuario_id IS NULL OR usuario_id = p_usuario_id);
  SELECT ROW_COUNT() AS cancelada;
END $$


-- =====================================================================
--  AGENDA  (HU-12, HU-19)
--  precio_entrada NULL = entrada gratuita · con precio = cover
-- =====================================================================

-- HU-12 · Lo que ve el cliente
DROP PROCEDURE IF EXISTS sp_ListarAgenda $$
CREATE PROCEDURE sp_ListarAgenda()
BEGIN
  SELECT id, nombre, descripcion, precio_entrada FROM agenda WHERE activo ORDER BY id;
END $$

-- HU-19 · Todo (administrador), incluidos los desactivados
DROP PROCEDURE IF EXISTS sp_ListarAgendaAdmin $$
CREATE PROCEDURE sp_ListarAgendaAdmin()
BEGIN
  SELECT id, nombre, descripcion, precio_entrada, activo FROM agenda ORDER BY activo DESC, id;
END $$

DROP PROCEDURE IF EXISTS sp_ObtenerAgenda $$
CREATE PROCEDURE sp_ObtenerAgenda(IN p_id INT UNSIGNED)
BEGIN
  SELECT id, nombre, descripcion, precio_entrada, activo FROM agenda WHERE id = p_id;
END $$

DROP PROCEDURE IF EXISTS sp_CrearAgenda $$
CREATE PROCEDURE sp_CrearAgenda(
  IN p_nombre VARCHAR(100), IN p_descripcion VARCHAR(500), IN p_precio_entrada INT UNSIGNED)
BEGIN
  INSERT INTO agenda (nombre, descripcion, precio_entrada)
  VALUES (p_nombre, p_descripcion, p_precio_entrada);
  CALL sp_ObtenerAgenda(LAST_INSERT_ID());
END $$

DROP PROCEDURE IF EXISTS sp_EditarAgenda $$
CREATE PROCEDURE sp_EditarAgenda(
  IN p_id INT UNSIGNED, IN p_nombre VARCHAR(100),
  IN p_descripcion VARCHAR(500), IN p_precio_entrada INT UNSIGNED)
BEGIN
  UPDATE agenda
     SET nombre = p_nombre, descripcion = p_descripcion, precio_entrada = p_precio_entrada
   WHERE id = p_id;
  CALL sp_ObtenerAgenda(p_id);
END $$

-- HU-19 · Activar (TRUE) o desactivar (FALSE)
DROP PROCEDURE IF EXISTS sp_CambiarEstadoAgenda $$
CREATE PROCEDURE sp_CambiarEstadoAgenda(IN p_id INT UNSIGNED, IN p_activo BOOLEAN)
BEGIN
  UPDATE agenda SET activo = p_activo WHERE id = p_id;
  CALL sp_ObtenerAgenda(p_id);
END $$


-- =====================================================================
--  TICKETS  (HU-13)
-- =====================================================================

-- HU-13 · Comprar entradas. Antes, la API valida la cantidad (1 a 6),
-- revisa que el evento tenga cover, aprueba el pago simulado y genera el
-- código. El total se calcula con el precio actual del evento.
DROP PROCEDURE IF EXISTS sp_ComprarTickets $$
CREATE PROCEDURE sp_ComprarTickets(
  IN p_usuario_id       INT UNSIGNED,
  IN p_agenda_id        INT UNSIGNED,
  IN p_cantidad         TINYINT UNSIGNED,
  IN p_codigo           CHAR(11),
  IN p_tarjeta_ultimos4 CHAR(4)
)
BEGIN
  INSERT INTO ticket (codigo, usuario_id, agenda_id, cantidad, total, tarjeta_ultimos4)
  SELECT p_codigo, p_usuario_id, id, p_cantidad, precio_entrada * p_cantidad, p_tarjeta_ultimos4
    FROM agenda
   WHERE id = p_agenda_id;

  CALL sp_ObtenerTicket(LAST_INSERT_ID(), p_usuario_id);
END $$

-- HU-13 · Un ticket (con el nombre y la descripción del evento)
DROP PROCEDURE IF EXISTS sp_ObtenerTicket $$
CREATE PROCEDURE sp_ObtenerTicket(IN p_id INT UNSIGNED, IN p_usuario_id INT UNSIGNED)
BEGIN
  SELECT t.id, t.codigo, t.cantidad, t.total, t.tarjeta_ultimos4,
         a.nombre AS evento, a.descripcion
    FROM ticket t
    JOIN agenda a ON a.id = t.agenda_id
   WHERE t.id = p_id AND t.usuario_id = p_usuario_id;
END $$

-- HU-13 · Mis tickets (del más reciente al más antiguo)
DROP PROCEDURE IF EXISTS sp_ListarTicketsCliente $$
CREATE PROCEDURE sp_ListarTicketsCliente(IN p_usuario_id INT UNSIGNED)
BEGIN
  SELECT t.id, t.codigo, t.cantidad, t.total, a.nombre AS evento, a.descripcion
    FROM ticket t
    JOIN agenda a ON a.id = t.agenda_id
   WHERE t.usuario_id = p_usuario_id
   ORDER BY t.id DESC;
END $$

DELIMITER ;

-- Fin de 02_procedimientos.sql
