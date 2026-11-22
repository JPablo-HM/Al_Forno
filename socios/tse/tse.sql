-- =====================================================================
--  TSE SIMULADO · Servicio de identificación para AL FORNO
--  tse.sql  →  Base de datos del TSE (aparte de al_forno)
--
--  Motor: MySQL 8.0 o superior
--  Lo usa: socios/tse/Program.cs (C# .NET, puerto 5004)
--
--  Simula el padrón del Tribunal Supremo de Elecciones: dado un tipo y un
--  número de identificación, devuelve el nombre completo de la persona.
--  ⚠ Este script BORRA y vuelve a crear la base tse_simulado.
--  Es una SIMULACIÓN: las personas son ficticias.
-- =====================================================================

DROP DATABASE IF EXISTS tse_simulado;
CREATE DATABASE tse_simulado CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE tse_simulado;

-- ---------------------------------------------------------------------
--  PERSONA · una fila por identificación
--    tipo:   cedula (cédula física, 9 dígitos)
--            dimex (Documento de Identidad Migratorio para Extranjeros, 11 o 12 dígitos)
--            pasaporte (6 a 12 letras o números)
-- ---------------------------------------------------------------------
CREATE TABLE persona (
  tipo             ENUM('cedula', 'dimex', 'pasaporte') NOT NULL,
  numero           VARCHAR(12)  NOT NULL,
  nombre_completo  VARCHAR(100) NOT NULL,

  PRIMARY KEY (tipo, numero)
);

-- ---------------------------------------------------------------------
--  Datos de prueba (5 personas ficticias)
-- ---------------------------------------------------------------------
INSERT INTO persona (tipo, numero, nombre_completo) VALUES
  ('cedula',    '112340567',    'María Fernanda Rodríguez Mora'),
  ('cedula',    '207650432',    'Carlos Andrés Jiménez Solís'),
  ('dimex',     '155812345678', 'Ana Lucía Pérez González'),
  ('dimex',     '18620123456',  'Luis Alberto Castillo Ruiz'),
  ('pasaporte', 'A1234567',     'John Michael Smith');
