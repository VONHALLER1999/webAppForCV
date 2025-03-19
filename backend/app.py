from flask import Flask, request, jsonify
import yfinance as yf
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS to allow requests from your React app
CORS(app)

@app.route('/api/fetch', methods=['POST'])
def fetch_stock():
    # Get JSON data from the request
    data = request.get_json()
    ticker_symbol = data.get('ticker', 'AAPL')
    
    # Fetch stock data using yfinance
    stock = yf.Ticker(ticker_symbol)
    # Retrieve historical data for the past 5 days
    hist = stock.history(period="5d")
    
    # Return the data as a JSON response
    return jsonify(hist.to_dict())

if __name__ == '__main__':
    app.run(debug=True)
