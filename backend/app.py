from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
import os
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS to allow requests from your React app

ALPHA_VANTAGE_API_KEY = os.environ.get('ALPHA_VANTAGE_API_KEY')

@app.route('/api/fetch', methods=['POST'])
def fetch_stock():
    data = request.get_json()
    ticker_symbol = data.get('Exposure', 1000000)
    
    #HARD CODED CURRENCIES
    from_currency = 'USD'
    to_currency = 'DKK'
    
    


    # Build the request URL and parameters for Alpha Vantage
    url = 'https://www.alphavantage.co/query'
    params = {
        'function': 'CURRENCY_EXCHANGE_RATE',
        'from_currency': from_currency,
        'to_currency': to_currency,
        'apikey': ALPHA_VANTAGE_API_KEY
    }
    
    response = requests.get(url, params=params)
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch data from Alpha Vantage'}), 500
    
    # Return the JSON response from Alpha Vantage
    return jsonify(response.json())

if __name__ == '__main__':
    app.run(debug=True)
