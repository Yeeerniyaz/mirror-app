import sys
import os
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/sensors', methods=['GET'])
def get_sensors():
    # Заглушка (реальный код для AHT21/ENS160)
    return jsonify({"temp": 24.8, "hum": 45.2, "co2": 510})

@app.route('/api/setup-wifi', methods=['POST'])
def setup_wifi():
    data = request.json
    ssid = data.get('ssid')
    password = data.get('password')
    
    # Команда подключения Raspberry Pi к Wi-Fi
    os.system(f'nmcli device wifi connect "{ssid}" password "{password}"')
    
    # Здесь же можно сохранить токен для Яндекс.Дома
    return jsonify({"status": "connecting", "ssid": ssid})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5005)