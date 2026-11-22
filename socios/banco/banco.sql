-- =====================================================================
--  BANCO SIMULADO · Socio comercial de AL FORNO
--  banco.sql  →  Base de datos del banco (aparte de al_forno)
--
--  Motor: MySQL 8.0 o superior
--  Lo usa: socios/banco/Program.cs (C# .NET, puerto 5001)
--
--  ⚠ Este script BORRA y vuelve a crear la base banco_simulado.
--  Es una SIMULACIÓN: los datos son ficticios y no hay dinero real.
--  Por eso las tarjetas y los CVV se guardan tal cual (un banco real
--  nunca guarda el CVV).
-- =====================================================================

DROP DATABASE IF EXISTS banco_simulado;
CREATE DATABASE banco_simulado CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE banco_simulado;

-- ---------------------------------------------------------------------
--  1. CUENTA · cada cuenta tiene un saldo en colones
-- ---------------------------------------------------------------------
CREATE TABLE cuenta (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  iban     CHAR(22)     NOT NULL,      -- número de cuenta (formato IBAN de Costa Rica)
  titular  VARCHAR(100) NOT NULL,
  saldo    INT UNSIGNED NOT NULL,      -- colones, sin decimales

  PRIMARY KEY (id),
  UNIQUE (iban)
);

-- ---------------------------------------------------------------------
--  2. TARJETA · cada tarjeta cobra de una cuenta
--     La marca NO se guarda: el banco la saca de los primeros dígitos.
-- ---------------------------------------------------------------------
CREATE TABLE tarjeta (
  numero       VARCHAR(16)  NOT NULL,  -- 16 dígitos (Visa, MasterCard) o 15 (American Express)
  vencimiento  CHAR(5)      NOT NULL,  -- MM/AA
  cvv          VARCHAR(4)   NOT NULL,  -- 3 dígitos (4 en American Express)
  cuenta_id    INT UNSIGNED NOT NULL,

  PRIMARY KEY (numero),
  FOREIGN KEY (cuenta_id) REFERENCES cuenta (id)
);

-- ---------------------------------------------------------------------
--  3. SINPE_MOVIL · teléfono asociado a una cuenta
-- ---------------------------------------------------------------------
CREATE TABLE sinpe_movil (
  telefono   CHAR(8)      NOT NULL,
  cuenta_id  INT UNSIGNED NOT NULL,

  PRIMARY KEY (telefono),
  FOREIGN KEY (cuenta_id) REFERENCES cuenta (id)
);

-- ---------------------------------------------------------------------
--  4. MOVIMIENTO · cada cobro deja dos filas con la misma referencia:
--     DEBITO en la cuenta del cliente y CREDITO en la de AL FORNO.
-- ---------------------------------------------------------------------
CREATE TABLE movimiento (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cuenta_id    INT UNSIGNED NOT NULL,
  tipo         ENUM('DEBITO', 'CREDITO') NOT NULL,
  monto        INT UNSIGNED NOT NULL,
  descripcion  VARCHAR(150) NOT NULL,
  referencia   CHAR(10)     NOT NULL,  -- la ve el cliente en su comprobante
  fecha        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  FOREIGN KEY (cuenta_id) REFERENCES cuenta (id)
);


-- =====================================================================
--  DATOS DE PRUEBA
-- =====================================================================
INSERT INTO cuenta (id, iban, titular, saldo) VALUES
  (1, 'CR21015201001026284066', 'AL FORNO S.A.',     0),        -- recibe los pagos
  (2, 'CR05015202001026284071', 'María Rodríguez',   500000),
  (3, 'CR39015203001026284089', 'Carlos Jiménez',    300000),
  (4, 'CR77015204001026284095', 'Ana Vargas',        2000);     -- poco saldo

INSERT INTO tarjeta (numero, vencimiento, cvv, cuenta_id) VALUES
  ('4111111111111111', '12/28', '123',  2),   -- Visa · aprobada
  ('5555555555554444', '06/29', '456',  3),   -- MasterCard (empieza con 55) · aprobada
  ('2223003122003222', '09/27', '789',  3),   -- MasterCard (empieza con 2223) · aprobada
  ('378282246310005',  '03/28', '1234', 4),   -- American Express · sin saldo suficiente
  ('4000000000000002', '01/25', '321',  2);   -- Visa · vencida

INSERT INTO sinpe_movil (telefono, cuenta_id) VALUES
  ('88881111', 2),   -- María · aprobado
  ('88882222', 3),   -- Carlos · aprobado
  ('88883333', 4);   -- Ana · sin saldo suficiente
