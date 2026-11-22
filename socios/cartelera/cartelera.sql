-- =====================================================================
--  CARTELERA DE EVENTOS · Socio comercial de AL FORNO
--  cartelera.sql  →  Base de datos de la cartelera (aparte de al_forno)
--
--  Motor: MySQL 8.0 o superior
--  Lo usa: socios/cartelera/app.py (Python + Flask, puerto 5002)
--
--  La productora de eventos lleva la agenda de los artistas que se
--  presentan en AL FORNO. AL FORNO solo la consulta y la muestra.
--  ⚠ Este script BORRA y vuelve a crear la base cartelera_simulada.
-- =====================================================================

DROP DATABASE IF EXISTS cartelera_simulada;
CREATE DATABASE cartelera_simulada CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE cartelera_simulada;

-- ---------------------------------------------------------------------
--  EVENTO · una actividad que se repite cada semana
--    dias:   los días, escritos como se muestran ('Martes y miércoles')
--    activo: FALSE = ya no se muestra (no se borra)
-- ---------------------------------------------------------------------
CREATE TABLE evento (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  dias         VARCHAR(40)  NOT NULL,
  nombre       VARCHAR(60)  NOT NULL,
  descripcion  VARCHAR(150) NOT NULL,
  activo       BOOLEAN      NOT NULL DEFAULT TRUE,

  PRIMARY KEY (id)
);

-- Datos (en el orden en que se muestran: de martes a domingo)
INSERT INTO evento (dias, nombre, descripcion) VALUES
  ('Martes y miércoles', 'Noche de karaoke', 'Elegí tu canción favorita y subí al escenario.'),
  ('Jueves',             'DJ en vivo',       'La mejor música para empezar el fin de semana.'),
  ('Viernes y sábado',   'Música en vivo',   'Bandas y artistas en vivo para acompañar tu cena.'),
  ('Domingo',            'Noche de karaoke', 'Cerrá la semana cantando con tus amigos.');
