# =====================================================================
# SOCIO COMERCIAL · BANCO SIMULADO          Python + Flask · puerto 5001
#
# Simula un banco que cobra los pedidos de AL FORNO. Tiene su PROPIA base
# de datos (banco_simulado), aparte de la base de AL FORNO.
# Solo lo llama la API de AL FORNO (Node); la app nunca habla con él.
#
# Métodos:
#   POST /pagos/tarjeta  { numero, vencimiento, cvv, monto, descripcion }
#   POST /pagos/sinpe    { telefono, monto, descripcion }
#   GET  /               el banco está activo (para revisar que corre)
#
# Respuestas:
#   200 { aprobado: true, referencia, ... }    pago hecho
#   402 { aprobado: false, mensaje }           pago rechazado (el motivo)
#   400 { aprobado: false, mensaje }           datos con formato incorrecto
#
# Cómo arrancarlo (en socios/banco/):
#   pip install -r requirements.txt
#   python app.py
# =====================================================================
import os
import re
import secrets
from datetime import date

import pymysql
from dotenv import load_dotenv
from flask import Flask, jsonify, request

load_dotenv()  # lee socios/banco/.env (usuario y contraseña de MySQL)
app = Flask(__name__)

# Cuenta de AL FORNO: recibe el dinero de cada pago.
CUENTA_AL_FORNO = 'CR21015201001026284066'


def conectar():
    return pymysql.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', '3306')),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database='banco_simulado',
        cursorclass=pymysql.cursors.DictCursor,
    )


def rechazar(mensaje, codigo=402):
    return jsonify(aprobado=False, mensaje=mensaje), codigo


def leer_monto(datos):
    monto = datos.get('monto')
    return monto if isinstance(monto, int) and monto > 0 else None


def marca_de(numero):
    """La marca sale de los primeros dígitos de la tarjeta."""
    if len(numero) == 15 and numero[:2] in ('34', '37'):
        return 'American Express'
    if len(numero) == 16 and numero[0] == '4':
        return 'Visa'
    if len(numero) == 16 and (51 <= int(numero[:2]) <= 55 or 2221 <= int(numero[:4]) <= 2720):
        return 'MasterCard'
    return None


def esta_vencida(vencimiento):
    """'12/28' sirve hasta el último día de diciembre de 2028."""
    mes, anio = int(vencimiento[:2]), 2000 + int(vencimiento[3:])
    hoy = date.today()
    return (anio, mes) < (hoy.year, hoy.month)


def cobrar(conexion, cuenta_id, monto, descripcion):
    """Rebaja el monto de la cuenta del cliente y lo suma a la de AL FORNO.
    Todo en una TRANSACCIÓN: o se hacen los dos movimientos, o ninguno.
    Devuelve la referencia, o None si no hay saldo suficiente."""
    with conexion.cursor() as cursor:
        # FOR UPDATE bloquea la cuenta hasta el COMMIT: si llegan dos pagos
        # al mismo tiempo, el segundo espera y ve el saldo ya rebajado.
        cursor.execute('SELECT saldo FROM cuenta WHERE id = %s FOR UPDATE', (cuenta_id,))
        if cursor.fetchone()['saldo'] < monto:
            conexion.rollback()
            return None

        cursor.execute('SELECT id FROM cuenta WHERE iban = %s', (CUENTA_AL_FORNO,))
        al_forno_id = cursor.fetchone()['id']

        referencia = 'BS' + f'{secrets.randbelow(10**8):08d}'
        cursor.execute('UPDATE cuenta SET saldo = saldo - %s WHERE id = %s', (monto, cuenta_id))
        cursor.execute('UPDATE cuenta SET saldo = saldo + %s WHERE id = %s', (monto, al_forno_id))
        cursor.execute(
            """INSERT INTO movimiento (cuenta_id, tipo, monto, descripcion, referencia)
               VALUES (%s, 'DEBITO', %s, %s, %s), (%s, 'CREDITO', %s, %s, %s)""",
            (cuenta_id, monto, descripcion, referencia, al_forno_id, monto, descripcion, referencia),
        )
    conexion.commit()
    return referencia


@app.get('/')
def estado():
    return jsonify(servicio='Banco Simulado', estado='activo')


# ---------------------------------------------------------------------
# Pago con tarjeta: número, vencimiento (MM/AA), CVV y monto
# ---------------------------------------------------------------------
@app.post('/pagos/tarjeta')
def pagar_con_tarjeta():
    datos = request.get_json(silent=True) or {}
    numero = str(datos.get('numero', '')).replace(' ', '')
    vencimiento = str(datos.get('vencimiento', ''))
    cvv = str(datos.get('cvv', ''))
    monto = leer_monto(datos)
    descripcion = str(datos.get('descripcion', 'Pago'))[:150]

    # 1. Formato
    if not re.fullmatch(r'\d{15,16}', numero):
        return rechazar('El número de tarjeta no es válido', 400)
    if not re.fullmatch(r'(0[1-9]|1[0-2])/\d{2}', vencimiento):
        return rechazar('El vencimiento debe ser MM/AA', 400)
    if monto is None:
        return rechazar('El monto no es válido', 400)

    # 2. Marca según los primeros dígitos
    marca = marca_de(numero)
    if marca is None:
        return rechazar('Tarjeta no aceptada: solo Visa, MasterCard o American Express')
    if len(cvv) != (4 if marca == 'American Express' else 3) or not cvv.isdigit():
        return rechazar(f'El CVV no es válido para una tarjeta {marca}')

    conexion = conectar()
    try:
        # 3. ¿Existe la tarjeta con esos datos?
        with conexion.cursor() as cursor:
            cursor.execute('SELECT vencimiento, cvv, cuenta_id FROM tarjeta WHERE numero = %s', (numero,))
            tarjeta = cursor.fetchone()
        if tarjeta is None:
            return rechazar('La tarjeta no existe en el banco')
        if tarjeta['vencimiento'] != vencimiento or tarjeta['cvv'] != cvv:
            return rechazar('Los datos de la tarjeta no coinciden')
        if esta_vencida(vencimiento):
            return rechazar('La tarjeta está vencida')

        # 4. Saldo y cobro
        referencia = cobrar(conexion, tarjeta['cuenta_id'], monto, descripcion)
        if referencia is None:
            return rechazar('Saldo insuficiente')
        return jsonify(aprobado=True, referencia=referencia, marca=marca, ultimos4=numero[-4:])
    finally:
        conexion.close()


# ---------------------------------------------------------------------
# Pago con SINPE Móvil: número de teléfono y monto
# ---------------------------------------------------------------------
@app.post('/pagos/sinpe')
def pagar_con_sinpe():
    datos = request.get_json(silent=True) or {}
    telefono = str(datos.get('telefono', '')).replace('-', '').replace(' ', '')
    monto = leer_monto(datos)
    descripcion = str(datos.get('descripcion', 'Pago'))[:150]

    if not re.fullmatch(r'\d{8}', telefono):
        return rechazar('El teléfono debe tener 8 dígitos', 400)
    if monto is None:
        return rechazar('El monto no es válido', 400)

    conexion = conectar()
    try:
        with conexion.cursor() as cursor:
            cursor.execute('SELECT cuenta_id FROM sinpe_movil WHERE telefono = %s', (telefono,))
            sinpe = cursor.fetchone()
        if sinpe is None:
            return rechazar('Ese teléfono no tiene SINPE Móvil en el banco')

        referencia = cobrar(conexion, sinpe['cuenta_id'], monto, descripcion)
        if referencia is None:
            return rechazar('Saldo insuficiente')
        return jsonify(aprobado=True, referencia=referencia, ultimos4=telefono[-4:])
    finally:
        conexion.close()


if __name__ == '__main__':
    app.run(port=int(os.getenv('PUERTO', '5001')))
