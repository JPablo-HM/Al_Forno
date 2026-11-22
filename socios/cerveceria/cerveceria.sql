-- =====================================================================
--  CERVECERÍA PROVEEDORA · Socio comercial de AL FORNO
--  cerveceria.sql  →  Base de datos de la cervecería (aparte de al_forno)
--
--  Motor: MySQL 8.0 o superior
--  Lo usa: socios/cerveceria/app.py (Python + Flask, puerto 5005)
--
--  La cervecería artesanal le vende a AL FORNO la "Cerveza artesanal
--  costarricense" del menú (IPA o Pale Ale, según disponibilidad). Aquí
--  dice qué cervezas tiene disponibles esta semana. La cervecería y sus
--  cervezas son ficticias.
--  ⚠ Este script BORRA y vuelve a crear la base cerveceria_simulada.
-- =====================================================================

DROP DATABASE IF EXISTS cerveceria_simulada;
CREATE DATABASE cerveceria_simulada CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE cerveceria_simulada;

-- ---------------------------------------------------------------------
--  CERVEZA · catálogo de la cervecería
--    disponible: TRUE = la tiene esta semana para AL FORNO
-- ---------------------------------------------------------------------
CREATE TABLE cerveza (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(60)  NOT NULL,
  estilo       VARCHAR(40)  NOT NULL,
  descripcion  VARCHAR(150) NOT NULL,
  disponible   BOOLEAN      NOT NULL DEFAULT FALSE,

  PRIMARY KEY (id)
);

-- Datos (5 cervezas artesanales; 3 disponibles esta semana)
INSERT INTO cerveza (nombre, estilo, descripcion, disponible) VALUES
  ('Sendero Lupulado', 'IPA',       'Aromática y amarga, con lúpulos cítricos.',           TRUE),
  ('Brisa de Mango',   'Pale Ale',  'Ligera y frutal, con mango de la zona.',              TRUE),
  ('Pico Blanco',      'Pale Ale',  'Dorada y equilibrada, fácil de tomar.',               TRUE),
  ('Volcán Rojo',      'IPA',       'Rojiza, con notas de caramelo y final amargo.',       FALSE),
  ('Noche de Cacao',   'Pale Ale',  'De temporada, con un toque de cacao costarricense.',  FALSE);
