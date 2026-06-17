def calculate_gst(price_per_night: float, nights: int) -> dict:
    subtotal = price_per_night * nights
    if price_per_night < 1000:
        rate = 0.0
    elif price_per_night <= 7500:
        rate = 0.12
    else:
        rate = 0.18
    gst = subtotal * rate
    half = gst / 2
    return {
        "subtotal": round(subtotal, 2),
        "gst_rate": rate,
        "cgst_rate": rate / 2,
        "cgst_amount": round(half, 2),
        "sgst_rate": rate / 2,
        "sgst_amount": round(half, 2),
        "total_gst": round(gst, 2),
        "grand_total": round(subtotal + gst, 2),
    }
