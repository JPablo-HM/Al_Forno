-- =====================================================================
--  AL FORNO · Base de datos
--  03_datos_iniciales.sql  →  Datos con los que arranca el sistema
--
--  Versión 2.1 · 22 de octubre de 2026 (seguridad de la cuenta)
--  Ejecutar después de 01_tablas.sql y 02_procedimientos.sql.
--
--  El horario y los datos del restaurante (dirección, teléfono) NO están
--  aquí: están en la API, en api/src/config/restaurante.js.
--  La agenda tampoco: está quemada en api/src/config/agenda.js.
-- =====================================================================

SET NAMES utf8mb4;
USE al_forno;
SET time_zone = '-06:00';

-- Todo va entre START TRANSACTION y COMMIT: si un INSERT falla, no queda
-- nada a medias.
START TRANSACTION;

-- ---------------------------------------------------------------------
-- 1. Cuenta de administrador (HU-14)
--    Las cuentas de administrador solo se crean por script, nunca desde
--    el registro público.
--    Correo: admin@alforno.cr · Contraseña temporal: Cambiar.AlForno2026
--    ⚠ Cámbiela antes de usar el servidor final: genere un hash nuevo con
--      bcrypt (10 rondas) y reemplace el valor de contrasena_hash.
-- ---------------------------------------------------------------------
--    v2.1: queda ACTIVO (no verifica correo) y sin preguntas de seguridad;
--    su forma de entrar no cambia (HU-14). La contraseña temporal ya
--    cumple la política de HU-20 (mayúscula, minúscula, número y símbolo).
INSERT INTO usuario (rol, nombre_completo, correo, contrasena_hash, estado) VALUES
  ('ADMIN', 'Administrador AL FORNO', 'admin@alforno.cr',
   '$2b$10$6Iv2bRlSnRthvQJ92ioUz.s6t5YtyU1zH9hqd/Kn1LHbkDIRwfBbG', 'ACTIVO');

-- Su contraseña también queda en el historial (HU-20: no repetir)
INSERT INTO contrasena_historial (usuario_id, contrasena_hash)
SELECT id, contrasena_hash FROM usuario WHERE correo = 'admin@alforno.cr';

-- ---------------------------------------------------------------------
-- 1b. Preguntas de seguridad (HU-01, HU-22)
--     El cliente elige 3 de esta lista al registrarse.
-- ---------------------------------------------------------------------
INSERT INTO pregunta_seguridad (texto) VALUES
  ('¿Cuál es el nombre de tu primera mascota?'),
  ('¿En qué ciudad nació tu madre?'),
  ('¿Cuál es el nombre de tu escuela primaria?'),
  ('¿Cómo se llamaba tu mejor amigo de la infancia?'),
  ('¿Cuál es tu comida favorita?');

-- ---------------------------------------------------------------------
-- 2. Productos del menú (HU-03) · 5 por categoría
--    Actualizado el 13 de octubre de 2026 (carta nueva).
--    Precios en colones enteros. En el menú salen por categoría y, dentro
--    de cada una, en orden alfabético (ver sp_ListarMenu).
-- ---------------------------------------------------------------------
INSERT INTO producto (categoria, nombre, descripcion, precio) VALUES
  ('Pizzas',          'Pizza Margherita',                'Salsa de tomate, mozzarella fresca, albahaca y aceite de oliva.', 6500),
  ('Pizzas',          'Pizza Pepperoni',                 'Salsa de tomate, mozzarella y pepperoni.', 7200),
  ('Pizzas',          'Pizza Cuatro Quesos',             'Mozzarella, gorgonzola, parmesano y fontina.', 8200),
  ('Pizzas',          'Pizza Prosciutto e Funghi',       'Jamón italiano, champiñones, mozzarella y salsa de tomate.', 8500),
  ('Pizzas',          'Pizza Hawaiana',                  'Jamón, piña, mozzarella y salsa de tomate.', 7200),
  ('Cucina italiana', 'Spaghetti alla Carbonara',        'Pasta con huevo, pecorino, guanciale y pimienta negra.', 6900),
  ('Cucina italiana', 'Lasagna alla Bolognese',          'Capas de pasta, ragú de carne, bechamel y queso.', 7500),
  ('Cucina italiana', 'Fettuccine Alfredo',              'Pasta con salsa cremosa de mantequilla y parmesano.', 6800),
  ('Cucina italiana', 'Ravioli Ricotta e Spinaci',       'Ravioles rellenos de ricotta y espinaca con salsa de tomate o mantequilla.', 7200),
  ('Cucina italiana', 'Risotto ai Funghi',               'Arroz cremoso italiano con champiñones, parmesano y vino blanco.', 7800),
  ('Coctelería',      'Aperol Spritz',                   'Aperol, prosecco, soda y rodaja de naranja.', 4800),
  ('Coctelería',      'Negroni',                         'Gin, Campari y vermut rojo.', 5200),
  ('Coctelería',      'Limoncello Spritz',               'Limoncello, prosecco, soda y limón.', 5000),
  ('Coctelería',      'Martini',                         'Gin y vermut seco, con aceituna o twist de limón.', 5200),
  ('Coctelería',      'Bellini',                         'Prosecco y puré de melocotón.', 4800),
  ('Cervezas',        'Imperial Lager',                  'La clásica de Costa Rica. Cerveza rubia, ligera y refrescante.', 1800),
  ('Cervezas',        'Pilsen',                          'Tradicional costarricense. Sabor más intenso y amargor característico.', 1800),
  ('Cervezas',        'Bavaria Gold',                    'Opción premium. Lager suave, ideal para acompañar pizzas y pastas.', 2200),
  ('Cervezas',        'Bavaria Dark',                    'Cerveza oscura. Notas tostadas y maltosas para quienes prefieren sabores más intensos.', 2200),
  ('Cervezas',        'Cerveza artesanal costarricense', 'Una opción local diferente. Puedes elegir una IPA o una Pale Ale de una cervecería artesanal nacional, según disponibilidad.', 3500);

-- ---------------------------------------------------------------------
-- 3. Promoción de ejemplo (HU-06). Los días y las fechas van en la
--    descripción. Se puede editar o desactivar desde el panel.
-- ---------------------------------------------------------------------
INSERT INTO promocion (titulo, descripcion) VALUES
  ('2x1 en Margherita',
   'Pedí una Margherita y la segunda va por la casa. Válido los martes hasta el 31 de octubre.');

COMMIT;

-- Fin de 03_datos_iniciales.sql
