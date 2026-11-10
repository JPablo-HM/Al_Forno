-- =====================================================================
--  AL FORNO · Base de datos
--  03_datos_iniciales.sql  →  Datos con los que arranca el sistema
--
--  Versión 2.2 · 9 de noviembre de 2026 (país, provincia y cantón)
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
-- 1c. Países, provincias y cantones (HU-01: ubicación en el registro)
--     3 países · 13 provincias · 40 cantones.
--     Costa Rica: sus 7 provincias con 4 cantones cada una.
--     Panamá y Nicaragua: 3 provincias con 2 cantones cada una.
--     Los id de país y provincia se escriben a mano para que se lea a
--     cuál pertenece cada fila.
-- ---------------------------------------------------------------------
INSERT INTO pais (id, nombre) VALUES
  (1, 'Costa Rica'),
  (2, 'Panamá'),
  (3, 'Nicaragua');

INSERT INTO provincia (id, pais_id, nombre) VALUES
  -- Costa Rica
  (1, 1, 'San José'),
  (2, 1, 'Alajuela'),
  (3, 1, 'Cartago'),
  (4, 1, 'Heredia'),
  (5, 1, 'Guanacaste'),
  (6, 1, 'Puntarenas'),
  (7, 1, 'Limón'),
  -- Panamá
  (8, 2, 'Panamá'),
  (9, 2, 'Chiriquí'),
  (10, 2, 'Colón'),
  -- Nicaragua
  (11, 3, 'Managua'),
  (12, 3, 'León'),
  (13, 3, 'Granada');

INSERT INTO canton (provincia_id, nombre) VALUES
  -- Costa Rica
  (1, 'San José'),   (1, 'Escazú'),     (1, 'Desamparados'), (1, 'Curridabat'),
  (2, 'Alajuela'),   (2, 'San Ramón'),  (2, 'Grecia'),       (2, 'San Carlos'),
  (3, 'Cartago'),    (3, 'Paraíso'),    (3, 'La Unión'),     (3, 'Turrialba'),
  (4, 'Heredia'),    (4, 'Barva'),      (4, 'Santo Domingo'), (4, 'Belén'),
  (5, 'Liberia'),    (5, 'Nicoya'),     (5, 'Santa Cruz'),   (5, 'Tilarán'),
  (6, 'Puntarenas'), (6, 'Esparza'),    (6, 'Quepos'),       (6, 'Golfito'),
  (7, 'Limón'),      (7, 'Pococí'),     (7, 'Siquirres'),    (7, 'Talamanca'),
  -- Panamá
  (8, 'Panamá'),     (8, 'San Miguelito'),
  (9, 'David'),       (9, 'Boquete'),
  (10, 'Colón'),      (10, 'Portobelo'),
  -- Nicaragua
  (11, 'Managua'),    (11, 'Tipitapa'),
  (12, 'León'),       (12, 'Nagarote'),
  (13, 'Granada'),    (13, 'Nandaime');

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
