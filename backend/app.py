from flask import Flask, request, jsonify
from flask_cors import CORS
from calc import simulate_hedging_strategy
import numpy as np

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
    # print the median revenue
    unhedged_median = np.median(np.array(results["unhedged_revenue"]))
    print(f"unhedged Median: {unhedged_median}")
    option_median = np.median(np.array(results["option_revenue"]))
    print(f"option Median: {option_median}")
    # Convert arrays to lists for JSON serialization.
    response_data = {
        "forward_revenue": results["forward_revenue"],
        "unhedged_revenue": results["unhedged_revenue"].tolist(),
        "option_revenue": results["option_revenue"].tolist(),
        "summary_stats": results["summary_stats"]
    }
    return jsonify(response_data)


if __name__ == '__main__':
    app.run(debug=True)
