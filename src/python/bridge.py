from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/sensors', methods=['GET'])
def get_sensors():
    # Здесь твоя логика чтения из датчиков AHT21/ENS160
    return jsonify({"temp": 24.5, "hum": 48.2, "co2": 450})

@app.route('/api/setup-wifi', methods=['POST'])
def setup_wifi():
    data = request.json
    ssid = data.get('ssid')
    password = data.get('password')
    os.system(f'nmcli device wifi connect "{ssid}" password "{password}"')
    return jsonify({"status": "connecting"})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5005)