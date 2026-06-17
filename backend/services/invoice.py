from __future__ import annotations

from datetime import datetime
from io import BytesIO
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from config import settings

CANCELLATION_BULLETS = {
    "flexible": [
        "Full refund if cancelled at least 24 hours before check-in.",
        "50% charge if cancelled within 24 hours of check-in.",
    ],
    "moderate": [
        "Full refund if cancelled 5+ days before check-in.",
        "50% refund if cancelled 1–5 days before check-in.",
        "No refund within 24 hours of check-in.",
    ],
    "strict": [
        "50% refund if cancelled 7+ days before check-in.",
        "No refund within 7 days of check-in.",
    ],
}


def _logo_path() -> Path | None:
    root = Path(__file__).resolve().parent.parent.parent
    for candidate in (
        root / "frontend" / "public" / "stayease_logo.png",
        root / "frontend" / "public" / "favicon.svg",
    ):
        if candidate.is_file() and candidate.suffix.lower() == ".png":
            return candidate
    return None


def _fmt_date(iso: str) -> str:
    try:
        return datetime.strptime(iso, "%Y-%m-%d").strftime("%b %d, %Y")
    except ValueError:
        return iso


def _fmt_rs(amount: float) -> str:
    return f"Rs. {amount:,.2f}"


def _draw_rule(c: canvas.Canvas, x: float, y: float, width: float) -> float:
    c.setStrokeColor(colors.HexColor("#333333"))
    c.setLineWidth(0.8)
    c.line(x, y, x + width, y)
    return y - 10


def _draw_wrapped(c: canvas.Canvas, text: str, x: float, y: float, width: float, size: int = 8, leading: int = 11) -> float:
    c.setFont("Helvetica", size)
    words = text.split()
    line = ""
    for word in words:
        test = f"{line} {word}".strip()
        if c.stringWidth(test, "Helvetica", size) <= width:
            line = test
        else:
            c.drawString(x, y, line)
            y -= leading
            line = word
    if line:
        c.drawString(x, y, line)
        y -= leading
    return y


def _draw_bullets(c: canvas.Canvas, items: list[str], x: float, y: float, width: float) -> float:
    for item in items:
        y = _draw_wrapped(c, f"• {item}", x, y, width - 8)
    return y - 4


def generate_invoice_pdf(
    *,
    invoice_number: str,
    booking: dict,
    room: dict,
    guest: dict,
    host: dict,
    pricing: dict,
) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin = 14 * mm
    content_w = width - 2 * margin
    y = height - margin

    logo = _logo_path()
    if logo:
        c.drawImage(str(logo), margin, y - 14 * mm, width=42 * mm, height=14 * mm, preserveAspectRatio=True, mask="auto")
    else:
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(colors.HexColor("#4F7FE8"))
        c.drawString(margin, y - 10, settings.APP_NAME)

    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 13)
    title = "Hotel Confirmation Voucher"
    c.drawRightString(width - margin, y - 8, title)
    y -= 20 * mm

    y = _draw_rule(c, margin, y, content_w)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin, y, f"Guest Name: {booking.get('guest_name', guest.get('name', ''))}")
    y -= 14
    y = _draw_rule(c, margin, y, content_w)

    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, y, room.get("title", "Hotel"))
    y -= 14
    c.setFont("Helvetica", 9)
    c.drawString(margin, y, "StayEase Verified Property")
    y -= 12
    loc = room.get("location") or {}
    address = ", ".join(filter(None, [loc.get("address"), loc.get("area"), loc.get("city")]))
    y = _draw_wrapped(c, address, margin, y, content_w * 0.58, size=9)
    if host.get("phone"):
        c.drawString(margin, y, f"Phone: {host['phone']}")
        y -= 12

    box_w = 34 * mm
    box_h = 16 * mm
    box_x = width - margin - box_w
    policies = room.get("policies") or {}
    for label, date_key, time_key, default_time in (
        ("Check IN", "check_in_date", "check_in_time", "12:00 PM"),
        ("Check OUT", "check_out_date", "check_out_time", "11:00 AM"),
    ):
        c.rect(box_x, y - box_h + 6, box_w, box_h, stroke=1, fill=0)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(box_x + 4, y - 2, label)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(box_x + 4, y - 12, _fmt_date(booking.get(date_key, "")))
        c.setFont("Helvetica", 7)
        c.drawString(box_x + 4, y - 20, policies.get(time_key, default_time))
        y -= box_h + 2

    y -= 6
    y = _draw_rule(c, margin, y, content_w)

    col_w = content_w / 2 - 6
    left_x = margin
    right_x = margin + col_w + 12
    row_y = y

    def detail_row(x: float, yy: float, label: str, value: str) -> float:
        c.setFont("Helvetica", 8)
        c.drawString(x, yy, label)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x + 95, yy, str(value)[:48])
        return yy - 12

    row_y = detail_row(left_x, row_y, "Booking ID", str(booking.get("_id", "")))
    row_y = detail_row(left_x, row_y, "Hotel Booking ID", f"{room.get('room_number', '')}-{str(booking.get('_id', ''))[-6:]}")
    row_y = detail_row(left_x, row_y, "Voucher / Invoice No.", invoice_number)
    created = booking.get("created_at")
    created_str = created.strftime("%b %d, %Y %H:%M") if hasattr(created, "strftime") else str(created or "")
    row_y = detail_row(left_x, row_y, "Date of Booking", created_str)
    row_y = detail_row(left_x, row_y, "Room Type", f"{room.get('room_category', '')} — {room.get('title', '')}")
    detail_row(left_x, row_y, "Occupancy", f"{booking.get('num_guests', 1)} Guest(s)")

    amt_y = y
    subtotal = booking.get("subtotal", 0)
    gst = booking.get("gst_amount", 0)
    guest_fee = pricing.get("guest_platform_fee", booking.get("guest_platform_fee", 0))
    discount = booking.get("discount_amount", 0)
    total = pricing.get("total_price", booking.get("total_price", 0))

    amt_y = detail_row(right_x, amt_y, "Room Charges", _fmt_rs(subtotal))
    amt_y = detail_row(right_x, amt_y, "GST (Tax)", _fmt_rs(gst))
    if guest_fee:
        amt_y = detail_row(right_x, amt_y, "StayEase Service Fee", _fmt_rs(guest_fee))
    if discount:
        amt_y = detail_row(right_x, amt_y, "Discount", f"-{_fmt_rs(discount)}")
    detail_row(right_x, amt_y, "Net Amount Paid", _fmt_rs(total))

    y = min(row_y, amt_y) - 10
    y = _draw_rule(c, margin, y, content_w)

    amenities = ", ".join((room.get("amenities") or [])[:4])
    inclusions = "Accommodation only"
    if amenities:
        inclusions += f" | {amenities}"
    c.setFont("Helvetica-Bold", 8)
    c.drawString(margin, y, "Inclusions:")
    c.setFont("Helvetica", 8)
    y = _draw_wrapped(c, inclusions, margin + 52, y, content_w - 52, size=8)
    y -= 4
    y = _draw_wrapped(
        c,
        "Important Note: Booked & Payable at StayEase. Present this voucher and valid ID at hotel check-in.",
        margin,
        y,
        content_w,
        size=8,
    )
    y = _draw_wrapped(c, "Description of Service: Reservation services for accommodation.", margin, y, content_w, size=8)
    y -= 6

    c.rect(margin, y - 28, content_w, 30, stroke=1, fill=0)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(margin + 6, y - 10, "Thank you for booking with StayEase.")
    _draw_wrapped(
        c,
        "Verified listing with GST-compliant billing. Keep this voucher ready for check-in.",
        margin + 6,
        y - 20,
        content_w - 12,
        size=7,
    )
    y -= 38

    verification = booking.get("check_in_verification") or {}
    if verification.get("check_in_note"):
        y = _draw_wrapped(c, f"Check-in: {verification['check_in_note']}", margin, y, content_w, size=8)
        y -= 4

    policy = booking.get("cancellation_policy") or policies.get("cancellation", "moderate")
    bullets = CANCELLATION_BULLETS.get(policy, CANCELLATION_BULLETS["moderate"])

    for heading, items in (
        ("Cancellation Policy", bullets + ["Any add-on charges are non-refundable."]),
        (
            "Hotel Policy",
            [
                f"Check-in {policies.get('check_in_time', '12:00 PM')}, check-out {policies.get('check_out_time', '11:00 AM')}.",
                "Valid government photo ID required for all guests above 18.",
                "ID or photo submitted during booking must match guest at check-in.",
                "GST included where applicable. Hotel reserves right of admission.",
            ],
        ),
    ):
        if y < 55 * mm:
            c.showPage()
            y = height - margin
        c.setFont("Helvetica-Bold", 9)
        c.drawString(margin, y, heading)
        y -= 12
        c.rect(margin, y - 4, content_w, 4, stroke=0, fill=0)
        box_top = y
        y = _draw_bullets(c, items, margin + 4, y, content_w)
        c.rect(margin, y, content_w, box_top - y + 8, stroke=1, fill=0)
        y -= 14

    if y < 40 * mm:
        c.showPage()
        y = height - margin

    c.setFont("Helvetica", 7)
    y = _draw_wrapped(c, "Total rounded to nearest rupee.", margin, y, content_w, size=7)
    y = _draw_wrapped(c, f"{settings.APP_NAME} — Smart Hotel Management", margin, y, content_w, size=7)
    if settings.GST_NUMBER:
        y = _draw_wrapped(c, f"GST Identification No: {settings.GST_NUMBER}", margin, y, content_w, size=7)
    y = _draw_wrapped(
        c,
        "Disclaimer: Hotel charges and GST collected on behalf of the property. StayEase fees relate to reservation services.",
        margin,
        y,
        content_w,
        size=7,
    )
    _draw_wrapped(
        c,
        "(This is a computer generated document. Does not require any signature.)",
        margin,
        y,
        content_w,
        size=7,
    )

    c.showPage()
    c.save()
    return buffer.getvalue()
