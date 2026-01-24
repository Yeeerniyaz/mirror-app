import sys
import sqlite3
import json
import os
from flask import Flask, jsonify
from flask_cors import CORS

# Путь к БД получаем от Electron (UserData)
DB_PATH = sys.argv[1] if len(sys.argv) > 1 else "vector_fallback.db"

app = Flask(__name__)
CORS(app) # Чтобы React мог стучаться без ошибок

def init_db():
    print(f"Подключение к БД: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sensor_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            temp REAL,
            hum REAL,
            co2 INTEGER
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/api/sensors', methods=['GET'])
def get_sensors():
    # Заглушка для датчиков (здесь будет код для AHT21/ENS160 через smbus2)
    temp, hum, co2 = 24.8, 45.2, 510
    
    # Сохраняем результат в SQLite
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('INSERT INTO sensor_history (temp, hum, co2) VALUES (?, ?, ?)', (temp, hum, co2))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Ошибка БД: {e}")

    return jsonify({
        "temp": temp,
        "hum": hum,
        "co2": co2,
        "db_status": "saved"
    })

if __name__ == "__main__":
    init_db()
    app.run(host='127.0.0.1', port=5005)