import requests
import yfinance as yf
from fredapi import Fred
from dotenv import load_dotenv
import os
import xml.etree.ElementTree as ET

load_dotenv()
FRED_API = os.environ.get("FRED_API")

def extract_dkk_interest_rate(xml_content):
    try:
        # Decode byte content to string
        xml_str = xml_content.decode('utf-8-sig')
        root = ET.fromstring(xml_str)
        # Iterate through Cube elements with a time attribute
        for cube in root.findall('.//Cube[@time]'):
            rate_elem = cube.find('Cube')
            if rate_elem is not None and 'rate' in rate_elem.attrib:
                rate_str = rate_elem.attrib['rate']
                # Convert string to float (replace comma with dot)
                return float(rate_str.replace(',', '.'))
        raise Exception("No valid rate found in the XML content.")
    except Exception as e:
        raise Exception(f"Error parsing XML content: {e}")

def get_dkk_forward_rate(maturity_months: float):
    """Return the USD/DKK forward rate for the given maturity in months."""
    # Convert months to a year fraction for the interest rate parity formula
    T = maturity_months / 12

    # 1. Spot rate: USD/DKK
    spot_data = yf.download("USDDKK=X", period="1d", interval="1d", auto_adjust=False, progress=False)
    spot_rate = spot_data["Close"].iloc[-1]  # convert to scalar float

    # 2. USD interest rate from FRED (converted from percentage to decimal)
    fred = Fred(api_key=FRED_API)
    usd_rate_series = fred.get_series("DFF")
    usd_rate = usd_rate_series.dropna().iloc[-1] / 100

    # 3. DKK interest rate from XML (extracted value is in percent)
    url = "https://www.nationalbanken.dk/interestrates?lang=da&format=xml&typeCodes=IND"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception("Failed to fetch DKK interest rate from Danmarks Nationalbank.")
    dkk_rate_raw = extract_dkk_interest_rate(response.content)
    dkk_rate = dkk_rate_raw / 100  # convert from percent to decimal

    # 4. Forward rate calculation
    forward_rate = spot_rate * ((1 + usd_rate * T) / (1 + dkk_rate * T))

    return {
        "spot_rate": float(round(spot_rate, 4)),
        "usd_rate": float(round(usd_rate * 100, 2)),  # as percentage
        "dkk_rate": float(round(dkk_rate * 100, 2)),  # as percentage
        "maturity_months": maturity_months,
        "forward_rate": float(round(forward_rate, 4)),
    }


