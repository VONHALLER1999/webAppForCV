option_products = {
    3: {
        "type": "put",
        "maturity_months": 3,
        "strike": 7.0753,          # DKK per USD (from 3-month product)
        "notional": 526315.79,     # USD notional
        "premium": 10000           # USD premium
    },
    6: {
        "type": "put",
        "maturity_months": 6,
        "strike": (7.0753 + 6.9457) / 2,  # ≈ 7.0105 DKK per USD
        "notional": 526315.79 + (3/9) * (270270.27 - 526315.79),  # ≈ 440967.28 USD
        "premium": 10000           # USD premium
    },
    12: {
        "type": "put",
        "maturity_months": 12,
        "strike": 6.9457,          # DKK per USD (from 12-month product)
        "notional": 270270.27,      # USD notional
        "premium": 10000           # USD premium
    }
}


# pulled from here https://www.sparnord.dk/priser-vilkaar/investeringsinfo/produktinformation/lovpligtig-investorinformation-priip-kid/valutaoption

#To manipulate options so that we can do full or partial hedge
def scale_option_product(original_option: dict, new_notional: float) -> dict:
    """
    Scale an option product's notional and premium to a new notional size,
    while keeping the same strike (and other attributes).
    """
    # How many times larger/smaller is the new notional?
    ratio = new_notional / original_option["notional"]
    
    # Scale the premium linearly by the same ratio.
    new_premium = original_option["premium"] * ratio
    
    # Create a copy and update fields.
    scaled_option = original_option.copy()
    scaled_option["notional"] = new_notional
    scaled_option["premium"]  = new_premium
    
    return scaled_option

