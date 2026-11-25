-- =====================================================================
--  AL FORNO · Base de datos
--  03_datos_iniciales.sql  →  Datos con los que arranca el sistema
--
--  Versión 2.5 · 23 de noviembre de 2026 (socio Hotel Las Brumas)
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
-- 1. Preguntas de seguridad (HU-01, HU-22)
--     El cliente elige 3 de esta lista al registrarse.
-- ---------------------------------------------------------------------
INSERT INTO pregunta_seguridad (texto) VALUES
  ('¿Cuál es el nombre de tu primera mascota?'),
  ('¿En qué ciudad nació tu madre?'),
  ('¿Cuál es el nombre de tu escuela primaria?'),
  ('¿Cómo se llamaba tu mejor amigo de la infancia?'),
  ('¿Cuál es tu comida favorita?');

-- ---------------------------------------------------------------------
-- 2. Países, provincias, cantones y distritos (HU-01: ubicación en el registro)
--     3 países · 13 provincias · 40 cantones · 75 distritos.
--     Costa Rica: sus 7 provincias, 4 cantones cada una y 2 distritos por cantón.
--     Panamá: 3 provincias, 2 cantones cada una y 2 distritos por cantón.
--     Nicaragua: 3 provincias y 2 cantones cada una. Los municipios no se
--     dividen: cada cantón tiene 1 distrito con su mismo nombre (Managua
--     sí tiene Distrito I y Distrito II).
--     Los id de país, provincia y cantón se escriben a mano para que se
--     lea a cuál pertenece cada fila.
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

INSERT INTO canton (id, provincia_id, nombre) VALUES
  -- Costa Rica
  (1, 1, 'San José'),
  (2, 1, 'Escazú'),
  (3, 1, 'Desamparados'),
  (4, 1, 'Curridabat'),
  (5, 2, 'Alajuela'),
  (6, 2, 'San Ramón'),
  (7, 2, 'Grecia'),
  (8, 2, 'San Carlos'),
  (9, 3, 'Cartago'),
  (10, 3, 'Paraíso'),
  (11, 3, 'La Unión'),
  (12, 3, 'Turrialba'),
  (13, 4, 'Heredia'),
  (14, 4, 'Barva'),
  (15, 4, 'Santo Domingo'),
  (16, 4, 'Belén'),
  (17, 5, 'Liberia'),
  (18, 5, 'Nicoya'),
  (19, 5, 'Santa Cruz'),
  (20, 5, 'Tilarán'),
  (21, 6, 'Puntarenas'),
  (22, 6, 'Esparza'),
  (23, 6, 'Quepos'),
  (24, 6, 'Golfito'),
  (25, 7, 'Limón'),
  (26, 7, 'Pococí'),
  (27, 7, 'Siquirres'),
  (28, 7, 'Talamanca'),
  -- Panamá
  (29, 8, 'Panamá'),
  (30, 8, 'San Miguelito'),
  (31, 9, 'David'),
  (32, 9, 'Boquete'),
  (33, 10, 'Colón'),
  (34, 10, 'Portobelo'),
  -- Nicaragua
  (35, 11, 'Managua'),
  (36, 11, 'Tipitapa'),
  (37, 12, 'León'),
  (38, 12, 'Nagarote'),
  (39, 13, 'Granada'),
  (40, 13, 'Nandaime');

INSERT INTO distrito (canton_id, nombre) VALUES
  -- Costa Rica
  (1, 'Carmen'), (1, 'Merced'),   -- San José
  (2, 'Escazú'), (2, 'San Rafael'),   -- Escazú
  (3, 'Desamparados'), (3, 'Patarrá'),   -- Desamparados
  (4, 'Curridabat'), (4, 'Granadilla'),   -- Curridabat
  (5, 'Alajuela'), (5, 'La Guácima'),   -- Alajuela
  (6, 'San Ramón'), (6, 'Santiago'),   -- San Ramón
  (7, 'Grecia'), (7, 'Tacares'),   -- Grecia
  (8, 'Quesada'), (8, 'La Fortuna'),   -- San Carlos
  (9, 'Oriental'), (9, 'Occidental'),   -- Cartago
  (10, 'Paraíso'), (10, 'Orosi'),   -- Paraíso
  (11, 'Tres Ríos'), (11, 'San Diego'),   -- La Unión
  (12, 'Turrialba'), (12, 'La Suiza'),   -- Turrialba
  (13, 'Heredia'), (13, 'San Francisco'),   -- Heredia
  (14, 'Barva'), (14, 'San Pedro'),   -- Barva
  (15, 'Santo Domingo'), (15, 'Santo Tomás'),   -- Santo Domingo
  (16, 'San Antonio'), (16, 'La Ribera'),   -- Belén
  (17, 'Liberia'), (17, 'Curubandé'),   -- Liberia
  (18, 'Nicoya'), (18, 'Sámara'),   -- Nicoya
  (19, 'Santa Cruz'), (19, 'Tamarindo'),   -- Santa Cruz
  (20, 'Tilarán'), (20, 'Tronadora'),   -- Tilarán
  (21, 'Puntarenas'), (21, 'Barranca'),   -- Puntarenas
  (22, 'Espíritu Santo'), (22, 'Caldera'),   -- Esparza
  (23, 'Quepos'), (23, 'Savegre'),   -- Quepos
  (24, 'Golfito'), (24, 'Guaycará'),   -- Golfito
  (25, 'Limón'), (25, 'Matama'),   -- Limón
  (26, 'Guápiles'), (26, 'Cariari'),   -- Pococí
  (27, 'Siquirres'), (27, 'Pacuarito'),   -- Siquirres
  (28, 'Cahuita'), (28, 'Sixaola'),   -- Talamanca
  -- Panamá
  (29, 'Bella Vista'), (29, 'San Francisco'),   -- Panamá
  (30, 'Amelia Denis de Icaza'), (30, 'Belisario Porras'),   -- San Miguelito
  (31, 'Las Lomas'), (31, 'San Pablo Viejo'),   -- David
  (32, 'Bajo Boquete'), (32, 'Alto Boquete'),   -- Boquete
  (33, 'Barrio Norte'), (33, 'Barrio Sur'),   -- Colón
  (34, 'Portobelo'), (34, 'Garrote'),   -- Portobelo
  -- Nicaragua
  (35, 'Distrito I'), (35, 'Distrito II'),   -- Managua
  (36, 'Tipitapa'),   -- Tipitapa
  (37, 'León'),   -- León
  (38, 'Nagarote'),   -- Nagarote
  (39, 'Granada'),   -- Granada
  (40, 'Nandaime');   -- Nandaime

-- ---------------------------------------------------------------------
-- 3. Productos del menú (HU-03) · 5 por categoría
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
  ('Cervezas',        'Imperial Lager',                  'La clásica de Costa Rica. Cerveza rubia, ligera y refrescante.', 1800),
  ('Cervezas',        'Pilsen',                          'Tradicional costarricense. Sabor más intenso y amargor característico.', 1800),
  ('Cervezas',        'Bavaria Gold',                    'Opción premium. Lager suave, ideal para acompañar pizzas.', 2200),
  ('Cervezas',        'Bavaria Dark',                    'Cerveza oscura. Notas tostadas y maltosas para quienes prefieren sabores más intensos.', 2200),
  ('Cervezas',        'Cerveza artesanal costarricense', 'Una opción local diferente. Puedes elegir una IPA o una Pale Ale de una cervecería artesanal nacional, según disponibilidad.', 3500);

-- ---------------------------------------------------------------------
-- 4. Promoción de ejemplo (HU-06). Los días y las fechas van en la
--    descripción. Se puede editar o desactivar desde el panel.
-- ---------------------------------------------------------------------
INSERT INTO promocion (titulo, descripcion) VALUES
  ('2x1 en Margherita',
   'Pedí una Margherita y la segunda va por la casa. Válido los martes hasta el 31 de octubre.');

-- ---------------------------------------------------------------------
-- 5. Socio Hotel Las Brumas (v2.5) · usa la API de socios (api-socios/)
--    para reservar mesas para sus huéspedes.
--    · rol SOCIO y estado PENDIENTE: NO puede entrar a la app.
--    · La contraseña es un hash bcrypt de un texto al azar que nadie
--      conoce: el hotel no usa contraseña, usa su llave (X-Llave-Socio).
--    · Su id va en api-socios/.env (HOTEL_USUARIO_ID).
-- ---------------------------------------------------------------------
INSERT INTO usuario (rol, nombre_completo, correo, contrasena_hash) VALUES
  ('SOCIO', 'Hotel Las Brumas', 'reservas@hotellasbrumas.cr',
   '$2b$10$VSEm3qFYJxQRGIqCRUFIeur.ApsV9DgvB9JOeVS9MUUdz3dJlu0qW');

COMMIT;

-- Fin de 03_datos_iniciales.sql
