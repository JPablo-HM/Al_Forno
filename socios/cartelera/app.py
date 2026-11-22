# =====================================================================
# SOCIO COMERCIAL · CARTELERA DE EVENTOS     Python + Flask · puerto 5002
#
# Simula la productora que lleva la agenda de artistas y actividades de
# AL FORNO. Tiene su PROPIA base de datos (cartelera_simulada), aparte de
# la base de AL FORNO. Solo lo llama la API de AL FORNO (Node).
#
# Métodos:
#   GET /eventos   eventos activos: [{ id, dias, nombre, descripcion }]
#   GET /          la cartelera está activa (para revisar que corre)
#
# Cómo arrancarlo (en socios/cartelera/):
#   pip install -r requirements.txt   (solo la primera vez)
#   python app.py
# =====================================================================
import os

import pymysql
from dotenv import load_dotenv
from flask import Flask, jsonify

load_dotenv()  # lee socios/cartelera/.env (usuario y contraseña de MySQL)
app = Flask(__name__)
app.json.ensure_ascii = False  # tildes tal cual en el JSON


def conectar():
    return pymysql.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', '3306')),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database='cartelera_simulada',
        cursorclass=pymysql.cursors.DictCursor,
    )


@app.get('/')
def estado():
    return jsonify(servicio='Cartelera de eventos', estado='activo')


@app.get('/eventos')
def listar_eventos():
    conexion = conectar()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                'SELECT id, dias, nombre, descripcion FROM evento WHERE activo = TRUE ORDER BY id'
            )
            return jsonify(cursor.fetchall())
    finally:
        conexion.close()


if __name__ == '__main__':
    app.run(port=int(os.getenv('PUERTO', '5002')))
