import math
from backend.sparnordOptions import option_products, scale_option_product


def test_scale_option_product():
    original = option_products[6]
    new_notional = 1_000_000
    scaled = scale_option_product(original, new_notional)

    ratio = new_notional / original["notional"]
    expected_premium = original["premium"] * ratio

    assert scaled["notional"] == new_notional
    assert math.isclose(scaled["premium"], expected_premium, rel_tol=1e-9)
    # ensure original unchanged
    assert original["notional"] == option_products[6]["notional"]
