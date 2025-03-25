import eventlet
eventlet.monkey_patch()


from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import logging
from calc import simulate_hedging_strategy  # Fixed import statement
import datetime

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})
socketio = SocketIO(app, 
    cors_allowed_origins="http://localhost:3000",
    async_mode='eventlet',
    logger=True,
    engineio_logger=True)

@socketio.on('connect')
def handle_connect():
    logger.info('Client connected')
    socketio.emit('status_update', {'message': 'Connected to server'})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Client disconnected')

@app.route('/api/simulate', methods=['POST'])
def simulate():
    logger.info('Received simulation request')
    with app.app_context():
        try:
            data = request.get_json()
            if not data:
                logger.error('No JSON data received')
                return jsonify({'error': 'No JSON data received'}), 400
                
            months = data.get('months', 6)
            exposure = data.get('exposure', 1_000_000)
            num_simulations = data.get('num_simulations', 10000)
            
            logger.info(f'Starting simulation with params: months={months}, exposure={exposure}, num_simulations={num_simulations}')
            results = simulate_hedging_strategy(months, exposure, num_simulations, socketio)
            logger.info('Simulation completed successfully')
            return jsonify(results)
        except Exception as e:
            logger.error(f"Error in simulate route: {str(e)}", exc_info=True)
            return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET', 'OPTIONS'])
def health_check():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        # Check if eventlet is running properly
        eventlet_status = 'ok' if eventlet.is_running() else 'error'
        
        return jsonify({
            'status': 'ok',
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'version': '1.0',
            'eventlet_status': eventlet_status,
            'cors_enabled': True
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    logger.info('Starting server...')
    socketio.run(app, debug=True, port=5001, host='0.0.0.0')
