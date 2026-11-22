-- =====================================================================
--  FACTURACIÓN ELECTRÓNICA · Socio comercial de AL FORNO
--  facturacion.sql  →  Base de datos del proveedor (aparte de al_forno)
--
--  Motor: MySQL 8.0 o superior
--  Lo usa: socios/facturacion/app.py (Python + Flask, puerto 5003)
--
--  Simula al proveedor de facturación electrónica que AL FORNO contrata:
--  por cada pedido pagado emite una factura con su número y su clave
--  numérica de 50 dígitos (como las de Hacienda). Es una SIMULACIÓN:
--  no se envía nada a Hacienda.
--  ⚠ Este script BORRA y vuelve a crear la base facturacion_simulada.
-- =====================================================================

DROP DATABASE IF EXISTS facturacion_simulada;
CREATE DATABASE facturacion_simulada CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE facturacion_simulada;

-- ---------------------------------------------------------------------
--  FACTURA · una por pedido de AL FORNO
--    numero y clave se calculan con el id, por eso se llenan justo
--    después del INSERT (en la misma transacción).
-- ---------------------------------------------------------------------
CREATE TABLE factura (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pedido_id  INT UNSIGNED NOT NULL,          -- número de pedido en AL FORNO
  numero     CHAR(11)     NULL,              -- 'FE-00000001'
  clave      CHAR(50)     NULL,              -- clave numérica de 50 dígitos
  cliente    VARCHAR(100) NOT NULL,
  total      INT UNSIGNED NOT NULL,          -- colones, sin decimales
  fecha      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE (pedido_id),                        -- un pedido, una sola factura
  UNIQUE (numero),
  UNIQUE (clave)
);
