# =====================================================================
# SOCIO COMERCIAL · CERVECERÍA PROVEEDORA     Python + Flask · puerto 5005
#
# Simula la cervecería artesanal que le vende a AL FORNO la "Cerveza
# artesanal costarricense" del menú (según disponibilidad). Dice qué
# cervezas tiene disponibles esta semana y AL FORNO las muestra en Inicio.
# Tiene su PROPIA base de datos (cerveceria_simulada). Solo lo llama la
# API de AL FORNO (Node).
#
# Métodos:
#   GET /disponibles   [{ id, nombre, estilo, descripcion }]
#   GET /            la cervecería está activa (para revisar que corre)
#
# Cómo arrancarlo (en socios/cerveceria/):
#   pip install -r requirements.txt   (solo la primera vez)
#   python app.py
# =====================================================================
import os

import pymysql
from dotenv import load_dotenv
from flask import Flask, jsonify

load_dotenv()  # lee socios/cerveceria/.env (usuario y contraseña de MySQL)
app = Flask(__name__)
app.json.ensure_ascii = False  # tildes tal cual en el JSON


def conectar():
    return pymysql.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', '3306')),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database='cerveceria_simulada',
        cursorclass=pymysql.cursors.DictCursor,
    )


@app.get('/')
def estado():
    return jsonify(servicio='Cervecería proveedora', estado='activo')


@app.get('/disponibles')
def listar_disponibles():
    conexion = conectar()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                'SELECT id, nombre, estilo, descripcion FROM cerveza WHERE disponible = TRUE ORDER BY id'
            )
            return jsonify(cursor.fetchall())
    finally:
        conexion.close()


if __name__ == '__main__':
    app.run(port=int(os.getenv('PUERTO', '5005')))
