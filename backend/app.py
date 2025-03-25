from flask import Flask, request, jsonify
from flask_cors import CORS
from calc import simulate_hedging_strategy
import numpy as np
import os

app = Flask(__name__)
CORS(app)  # Enable CORS to allow requests from your React app

@app.route('/api/fetch', methods=['POST'])
def simulate_hedges():
    # Extract simulation parameters from the POST request.
    data = request.get_json()
    months = data.get('months', 6)
    exposure = data.get('exposure', 1_000_000)
    num_simulations = data.get('num_simulations', 10000)
    
    # Run the simulation.
    results = simulate_hedging_strategy(months, exposure, num_simulations)

    # Convert arrays to lists for JSON serialization.
    response_data = {
        "forward_revenue": results["forward_revenue"],
        "unhedged_revenue": results["unhedged_revenue"].tolist(),
        "option_revenue": results["option_revenue"].tolist(),
        "summary_stats": results["summary_stats"]
    }
    return jsonify(response_data)

@app.route("/")
def index():
    return "Hello from the backend!"

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)

