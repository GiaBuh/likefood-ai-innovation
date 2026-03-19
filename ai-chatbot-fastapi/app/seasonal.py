"""Seasonal / holiday recommendation calendar for Vietnamese market."""
from __future__ import annotations

from datetime import datetime

from .domain import Product

# ── Vietnamese holiday calendar (month-based) ────────────────────────────────
SEASONAL_EVENTS: dict[int, dict] = {
    1: {
        "name": "Tết Nguyên Đán",
        "keywords": ["tết", "tet", "năm mới", "nam moi", "tân xuân", "xuan"],
        "categories": ["Mứt", "Hạt", "Combo"],
        "greeting": "🧧 Chúc mừng năm mới! Bên em có nhiều đặc sản Tết cho anh/chị chọn.",
    },
    2: {
        "name": "Valentine & Tết",
        "keywords": ["valentine", "quà tặng", "qua tang", "người yêu"],
        "categories": ["Combo", "Mứt", "Hạt"],
        "greeting": "💝 Tháng của tình yêu! Anh/chị muốn chọn quà tặng người thương không ạ?",
    },
    3: {
        "name": "Quốc tế Phụ nữ 8/3",
        "keywords": ["8/3", "phụ nữ", "phu nu", "quà tặng"],
        "categories": ["Combo", "Mứt"],
        "greeting": "🌸 Chúc mừng ngày 8/3! Em có combo quà tặng rất ý nghĩa cho phụ nữ!",
    },
    4: {
        "name": "Mùa hè sắp đến",
        "keywords": ["hè", "nắng", "du lịch"],
        "categories": ["Khô", "Hạt"],
        "greeting": "",
    },
    5: {
        "name": "Ngày của Mẹ",
        "keywords": ["ngày mẹ", "mother", "me"],
        "categories": ["Combo"],
        "greeting": "💐 Quà tặng mẹ yêu! Em có combo đặc sản rất phù hợp đó ạ.",
    },
    6: {
        "name": "Ngày của Bố",
        "keywords": ["ngày bố", "father", "bo"],
        "categories": ["Khô", "Hạt"],
        "greeting": "",
    },
    7: {
        "name": "Mùa hè",
        "keywords": ["hè", "du lịch", "picnic"],
        "categories": ["Khô", "Hạt"],
        "greeting": "",
    },
    8: {
        "name": "Tựu trường",
        "keywords": ["khai giảng", "trường"],
        "categories": ["Hạt"],
        "greeting": "",
    },
    9: {
        "name": "Trung thu",
        "keywords": ["trung thu", "rằm", "ram", "trung"],
        "categories": ["Mứt", "Hạt"],
        "greeting": "🥮 Trung thu vui vẻ! Em có nhiều đặc sản phù hợp mùa Trung thu!",
    },
    10: {
        "name": "Halloween",
        "keywords": ["halloween"],
        "categories": ["Khô"],
        "greeting": "",
    },
    11: {
        "name": "Singles Day 11/11",
        "keywords": ["11/11", "sale", "giảm giá"],
        "categories": ["Combo"],
        "greeting": "🛒 Siêu sale 11/11! Anh/chị xem combo khuyến mãi bên em nhé!",
    },
    12: {
        "name": "Giáng sinh & Năm mới",
        "keywords": ["noel", "giáng sinh", "giang sinh", "christmas", "năm mới"],
        "categories": ["Combo", "Mứt", "Hạt"],
        "greeting": "🎄 Giáng sinh an lành! Em có combo quà Noel rất đẹp cho anh/chị!",
    },
}


def get_current_seasonal_event() -> dict | None:
    """Return the seasonal event for the current month, or None."""
    month = datetime.now().month
    return SEASONAL_EVENTS.get(month)


def get_seasonal_greeting() -> str:
    """Return a seasonal greeting for the current month, or empty string."""
    event = get_current_seasonal_event()
    return (event or {}).get("greeting", "")


def filter_seasonal_products(products: list[Product], month: int | None = None) -> list[Product]:
    """Filter products matching the current month's preferred categories."""
    if month is None:
        month = datetime.now().month
    event = SEASONAL_EVENTS.get(month)
    if not event:
        return []
    preferred_categories = [c.lower() for c in event["categories"]]
    return [p for p in products if p.category.lower() in preferred_categories]
