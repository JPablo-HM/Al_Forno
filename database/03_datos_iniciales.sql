-- =====================================================================
--  AL FORNO · Base de datos
--  03_datos_iniciales.sql  →  Datos con los que arranca el sistema
--
--  Versión 1.0 · 6 de octubre de 2026
--  Ejecutar después de 01_tablas.sql (y de 02_procedimientos.sql).
--  Los catálogos (roles, días, estados, motivos) ya vienen en 01_tablas.sql.
-- =====================================================================

-- Los scripts están en UTF-8. SET NAMES evita que las tildes, la ñ y el ₡
-- se guarden dañadas si el cliente de MySQL usa otra codificación.
SET NAMES utf8mb4;

USE al_forno;
SET time_zone = '-06:00';

START TRANSACTION;

-- ---------------------------------------------------------------------
-- 1. Cuenta de administrador (HU-14)
--    Las cuentas de administrador solo se crean por script, nunca desde
--    el registro público.
--    Contraseña temporal: Cambiar.AlForno2026
--    ⚠ Cámbiela antes de usar el servidor final: genere un hash nuevo con
--      bcrypt (10 rondas) y reemplace el valor de contrasena_hash.
-- ---------------------------------------------------------------------
INSERT INTO usuario (id, rol_codigo, nombre_completo, correo, contrasena_hash) VALUES
  (1, 'ADMIN', 'Administrador AL FORNO', 'admin@alforno.cr',
   '$2b$10$6Iv2bRlSnRthvQJ92ioUz.s6t5YtyU1zH9hqd/Kn1LHbkDIRwfBbG');

-- ---------------------------------------------------------------------
-- 2. Datos del restaurante (HU-05)
--    ⚠ Teléfono y dirección son de ejemplo: reemplazar por los reales.
-- ---------------------------------------------------------------------
INSERT INTO restaurante (id, nombre, direccion, senas, telefono, whatsapp) VALUES
  (1, 'AL FORNO', 'Cartago, Costa Rica',
   'Señas pendientes: completar con la dirección exacta del local.',
   '00000000', '00000000');

-- ---------------------------------------------------------------------
-- 3. Horario de atención (Reglas generales de las HU)
--    Viernes y sábado cierran a la 1:00 a.m. del día siguiente.
-- ---------------------------------------------------------------------
INSERT INTO horario (dia_semana_id, abierto, hora_apertura, hora_cierre) VALUES
  (1, FALSE, NULL,       NULL),        -- Lunes: cerrado
  (2, TRUE,  '17:00:00', '23:00:00'),  -- Martes
  (3, TRUE,  '17:00:00', '23:00:00'),  -- Miércoles
  (4, TRUE,  '17:00:00', '23:00:00'),  -- Jueves
  (5, TRUE,  '17:00:00', '01:00:00'),  -- Viernes (cierra sábado 1:00 a.m.)
  (6, TRUE,  '17:00:00', '01:00:00'),  -- Sábado  (cierra domingo 1:00 a.m.)
  (7, TRUE,  '12:00:00', '21:00:00');  -- Domingo

-- ---------------------------------------------------------------------
-- 4. Categorías del menú (HU-03)
-- ---------------------------------------------------------------------
INSERT INTO categoria (id, nombre, orden) VALUES
  (1, 'Pizzas',          1),
  (2, 'Cucina italiana', 2),
  (3, 'Coctelería',      3),
  (4, 'Cervezas',        4);

-- ---------------------------------------------------------------------
-- 5. Productos iniciales (tomados de la carta del sitio web)
-- ---------------------------------------------------------------------
INSERT INTO producto (categoria_id, nombre, descripcion, precio, creado_por) VALUES
  (1, 'Margherita',          'Salsa de tomate, mozzarella fresca, albahaca y aceite de oliva.',          6500, 1),
  (1, 'Diavola',             'Tomate, mozzarella, salami picante y hojuelas de chile.',                  7800, 1),
  (1, 'Quattro Formaggi',    'Mozzarella, gorgonzola, parmesano y provolone.',                           8200, 1),
  (1, 'Al Forno de la casa', 'Prosciutto, rúgula, tomate cherry, parmesano y reducción de balsámico.',   8900, 1),
  (2, 'Lasagna della Nonna', 'Capas de pasta, ragú de res, bechamel y parmesano gratinado.',             7500, 1),
  (2, 'Spaghetti Carbonara', 'Guanciale, yema de huevo, pecorino y pimienta negra.',                     6900, 1),
  (2, 'Bruschettas',         'Pan tostado con tomate, ajo, albahaca y aceite de oliva.',                 4200, 1),
  (2, 'Tiramisú',            'Postre clásico con café espresso, mascarpone y cacao.',                    3800, 1),
  (3, 'Negroni',             'Gin, Campari y vermú rosso.',                                              5200, 1),
  (3, 'Aperol Spritz',       'Aperol, prosecco y un toque de soda con naranja.',                         4800, 1),
  (3, 'Limoncello Sour',     'Limoncello, limón fresco y espuma cítrica.',                               5000, 1),
  (4, 'Lager nacional',      'Refrescante y ligera, ideal con cualquier pizza.',                         2200, 1),
  (4, 'IPA artesanal',       'Lúpulo intenso con notas cítricas.',                                       3500, 1),
  (4, 'Peroni',              'La clásica lager italiana, importada.',                                    3200, 1);

-- ---------------------------------------------------------------------
-- 6. Agenda semanal fija (HU-12), tomada del sitio web
-- ---------------------------------------------------------------------
INSERT INTO actividad (dia_semana_id, hora, nombre, descripcion, creado_por) VALUES
  (2, '20:00:00', 'Noche de Jazz',     'Tríos y cuartetos de jazz en vivo para acompañar la cena.',          1),
  (3, '19:30:00', 'Micrófono abierto', 'Poesía, música o lo que quieras compartir. Inscripción en la barra.', 1),
  (4, '20:30:00', 'Stand-up Comedy',   'Una noche de risas con comediantes nacionales.',                     1),
  (5, '21:00:00', 'Acústico en vivo',  'Cantautores y bandas en formato íntimo.',                            1),
  (6, '22:00:00', 'DJ Set',            'Vinilos y buena música para cerrar la semana.',                      1),
  (7, '16:00:00', 'Arte y pizza',      'Exposiciones de arte y talleres para toda la familia.',              1);

COMMIT;

-- Fin de 03_datos_iniciales.sql
