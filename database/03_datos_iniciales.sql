-- =====================================================================
--  AL FORNO · Base de datos
--  03_datos_iniciales.sql  →  Datos con los que arranca el sistema
--
--  Versión 2.0 · 8 de octubre de 2026 (versión simplificada)
--  Ejecutar después de 01_tablas.sql y 02_procedimientos.sql.
--
--  El horario y los datos del restaurante (dirección, teléfono) NO están
--  aquí: están en la API, en api/src/config/restaurante.js.
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
INSERT INTO usuario (rol, nombre_completo, correo, contrasena_hash) VALUES
  ('ADMIN', 'Administrador AL FORNO', 'admin@alforno.cr',
   '$2b$10$6Iv2bRlSnRthvQJ92ioUz.s6t5YtyU1zH9hqd/Kn1LHbkDIRwfBbG');

-- ---------------------------------------------------------------------
-- 2. Productos del menú (HU-03), tomados de la carta del sitio web
-- ---------------------------------------------------------------------
INSERT INTO producto (categoria, nombre, descripcion, precio) VALUES
  ('Pizzas',          'Margherita',          'Salsa de tomate, mozzarella fresca, albahaca y aceite de oliva.',          6500),
  ('Pizzas',          'Diavola',             'Tomate, mozzarella, salami picante y hojuelas de chile.',                  7800),
  ('Pizzas',          'Quattro Formaggi',    'Mozzarella, gorgonzola, parmesano y provolone.',                           8200),
  ('Pizzas',          'Al Forno de la casa', 'Prosciutto, rúgula, tomate cherry, parmesano y reducción de balsámico.',   8900),
  ('Cucina italiana', 'Lasagna della Nonna', 'Capas de pasta, ragú de res, bechamel y parmesano gratinado.',             7500),
  ('Cucina italiana', 'Spaghetti Carbonara', 'Guanciale, yema de huevo, pecorino y pimienta negra.',                     6900),
  ('Cucina italiana', 'Bruschettas',         'Pan tostado con tomate, ajo, albahaca y aceite de oliva.',                 4200),
  ('Cucina italiana', 'Tiramisú',            'Postre clásico con café espresso, mascarpone y cacao.',                    3800),
  ('Coctelería',      'Negroni',             'Gin, Campari y vermú rosso.',                                              5200),
  ('Coctelería',      'Aperol Spritz',       'Aperol, prosecco y un toque de soda con naranja.',                         4800),
  ('Coctelería',      'Limoncello Sour',     'Limoncello, limón fresco y espuma cítrica.',                               5000),
  ('Cervezas',        'Lager nacional',      'Refrescante y ligera, ideal con cualquier pizza.',                         2200),
  ('Cervezas',        'IPA artesanal',       'Lúpulo intenso con notas cítricas.',                                       3500),
  ('Cervezas',        'Peroni',              'La clásica lager italiana, importada.',                                    3200);

-- ---------------------------------------------------------------------
-- 3. Agenda (HU-12), tomada del sitio web
--    precio_entrada NULL = entrada gratuita · con precio = cover
--    El día y la hora van escritos en la descripción.
-- ---------------------------------------------------------------------
INSERT INTO agenda (nombre, descripcion, precio_entrada) VALUES
  ('Noche de Jazz',     'Martes 8:00 p.m. Tríos y cuartetos de jazz en vivo para acompañar la cena.',           NULL),
  ('Micrófono abierto', 'Miércoles 7:30 p.m. Poesía, música o lo que quieras compartir. Inscripción en la barra.', NULL),
  ('Stand-up Comedy',   'Jueves 8:30 p.m. Una noche de risas con comediantes nacionales.',                       NULL),
  ('Acústico en vivo',  'Viernes 9:00 p.m. Cantautores y bandas en formato íntimo.',                             NULL),
  ('DJ Set',            'Sábado 10:00 p.m. Vinilos y buena música para cerrar la semana.',                       NULL),
  ('Arte y pizza',      'Domingo 4:00 p.m. Exposiciones de arte y talleres para toda la familia.',               NULL);

-- Ejemplo de evento con cover (se compran tickets). Se puede editar o
-- desactivar desde el panel del administrador.
INSERT INTO agenda (nombre, descripcion, precio_entrada) VALUES
  ('Noche de ópera italiana',
   'Sábado 15 de noviembre, 8:00 p.m. Arias clásicas en vivo con menú especial.', 8000);

-- ---------------------------------------------------------------------
-- 4. Promoción de ejemplo (HU-06). Los días y las fechas van en la
--    descripción. Se puede editar o desactivar desde el panel.
-- ---------------------------------------------------------------------
INSERT INTO promocion (titulo, descripcion) VALUES
  ('2x1 en Margherita',
   'Pedí una Margherita y la segunda va por la casa. Válido los martes hasta el 31 de octubre.');

COMMIT;

-- Fin de 03_datos_iniciales.sql
