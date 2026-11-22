# =====================================================================
# SOCIO COMERCIAL · FACTURACIÓN ELECTRÓNICA   Python + Flask · puerto 5003
#
# Simula al proveedor de facturación electrónica que contrata AL FORNO.
# Por cada pedido pagado emite una factura con su número y su clave de
# 50 dígitos. Tiene su PROPIA base de datos (facturacion_simulada).
# Solo lo llama la API de AL FORNO (Node).
#
# Métodos:
#   POST /facturas              { pedido_id, cliente, total } → emite la factura
#   GET  /facturas/<pedido_id>  la factura de ese pedido
#   GET  /                      el servicio está activo (para revisar que corre)
#
# Respuestas:
#   201 { numero, clave, pedido_id, cliente, total, fecha }   factura emitida
#   200 (igual)                  ya existía la factura de ese pedido (no se repite)
#   404 { mensaje }              ese pedido no tiene factura
#   400 { mensaje }              datos con formato incorrecto
#
# Cómo arrancarlo (en socios/facturacion/):
#   pip install -r requirements.txt   (solo la primera vez)
#   python app.py
# =====================================================================
import os
import secrets
from datetime import date

import pymysql
from dotenv import load_dotenv
from flask import Flask, jsonify, request

load_dotenv()  # lee socios/facturacion/.env (usuario y contraseña de MySQL)
app = Flask(__name__)
app.json.ensure_ascii = False  # tildes tal cual en el JSON

# Cédula jurídica de AL FORNO S.A. (ficticia), 12 dígitos para la clave.
CEDULA_AL_FORNO = '003101234567'


def conectar():
    return pymysql.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', '3306')),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database='facturacion_simulada',
        cursorclass=pymysql.cursors.DictCursor,
    )


def buscar_factura(cursor, pedido_id):
    cursor.execute(
        'SELECT numero, clave, pedido_id, cliente, total, fecha FROM factura WHERE pedido_id = %s',
        (pedido_id,),
    )
    factura = cursor.fetchone()
    if factura:
        factura['fecha'] = factura['fecha'].strftime('%Y-%m-%d %H:%M:%S')
    return factura


def calcular_clave(id_factura):
    """Clave de 50 dígitos, con la misma forma que las de Hacienda:
    506 (Costa Rica) + fecha ddmmaa + cédula del emisor (12)
    + consecutivo (20) + situación (1) + código de seguridad (8)."""
    consecutivo = '001' + '00001' + '01' + f'{id_factura:010d}'  # sucursal, terminal, tipo FE, número
    seguridad = f'{secrets.randbelow(10**8):08d}'
    return '506' + date.today().strftime('%d%m%y') + CEDULA_AL_FORNO + consecutivo + '1' + seguridad


@app.get('/')
def estado():
    return jsonify(servicio='Facturación electrónica', estado='activo')


@app.post('/facturas')
def emitir_factura():
    datos = request.get_json(silent=True) or {}
    pedido_id = datos.get('pedido_id')
    cliente = str(datos.get('cliente', '')).strip()[:100]
    total = datos.get('total')

    if not isinstance(pedido_id, int) or pedido_id <= 0:
        return jsonify(mensaje='El número de pedido no es válido'), 400
    if not cliente:
        return jsonify(mensaje='Falta el nombre del cliente'), 400
    if not isinstance(total, int) or total <= 0:
        return jsonify(mensaje='El total no es válido'), 400

    conexion = conectar()
    try:
        with conexion.cursor() as cursor:
            # Si ese pedido ya tiene factura, se devuelve la misma (no se repite)
            existente = buscar_factura(cursor, pedido_id)
            if existente:
                return jsonify(existente), 200

            # Se guarda, y con el id se calculan el número y la clave
            cursor.execute(
                'INSERT INTO factura (pedido_id, cliente, total) VALUES (%s, %s, %s)',
                (pedido_id, cliente, total),
            )
            id_factura = cursor.lastrowid
            cursor.execute(
                'UPDATE factura SET numero = %s, clave = %s WHERE id = %s',
                (f'FE-{id_factura:08d}', calcular_clave(id_factura), id_factura),
            )
            conexion.commit()
            return jsonify(buscar_factura(cursor, pedido_id)), 201
    finally:
        conexion.close()


@app.get('/facturas/<int:pedido_id>')
def obtener_factura(pedido_id):
    conexion = conectar()
    try:
        with conexion.cursor() as cursor:
            factura = buscar_factura(cursor, pedido_id)
        if factura is None:
            return jsonify(mensaje='Ese pedido no tiene factura'), 404
        return jsonify(factura)
    finally:
        conexion.close()


if __name__ == '__main__':
    app.run(port=int(os.getenv('PUERTO', '5003')))
