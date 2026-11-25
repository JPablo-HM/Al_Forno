-- =====================================================================
--  AL FORNO · Actualizar una base existente de la versión 2.4 a la 2.5
--  (socio Hotel Las Brumas para la API de socios en PHP)
--
--  Para quien YA tiene la base al_forno con datos (cuentas, pedidos,
--  reservas): NO borra nada. Se puede correr varias veces.
--  Una instalación nueva no lo necesita: 01, 02 y 03 ya traen la 2.5.
--
--  Hace 3 cosas:
--    1. Agrega el rol SOCIO a la tabla usuario.
--    2. Vuelve a crear sp_CrearReserva (1 reserva por día solo a clientes).
--    3. Crea el usuario Hotel Las Brumas (si no existe).
-- =====================================================================

SET NAMES utf8mb4;
USE al_forno;

-- 1. Rol SOCIO
ALTER TABLE usuario
  MODIFY rol ENUM('CLIENTE', 'SOCIO') NOT NULL DEFAULT 'CLIENTE';

-- 2. sp_CrearReserva (copia exacta del que está en 02_procedimientos.sql)
DELIMITER $$

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

  -- 2. HU-10: una sola reserva confirmada por día (solo para clientes)
  IF EXISTS (SELECT 1 FROM reserva r
               JOIN usuario u ON u.id = r.usuario_id
              WHERE r.usuario_id = p_usuario_id AND u.rol = 'CLIENTE'
                AND r.fecha = p_fecha AND r.estado = 'Confirmada') THEN
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

DELIMITER ;

-- 3. Socio Hotel Las Brumas (no se repite si ya existe)
INSERT INTO usuario (rol, nombre_completo, correo, contrasena_hash)
SELECT 'SOCIO', 'Hotel Las Brumas', 'reservas@hotellasbrumas.cr',
       '$2b$10$VSEm3qFYJxQRGIqCRUFIeur.ApsV9DgvB9JOeVS9MUUdz3dJlu0qW'
 WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE correo = 'reservas@hotellasbrumas.cr');

-- Revisión: debe salir una fila con rol SOCIO
SELECT id, rol, nombre_completo, estado FROM usuario WHERE rol = 'SOCIO';

-- Fin de actualizar_a_2_5.sql
