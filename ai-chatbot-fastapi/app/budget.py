from __future__ import annotations

import re

from .domain import Product, ProductVariant

USD_TO_VND = 25_000.0


def parse_budget_value(message: str) -> float | None:
    text = message.lower()
    # Skip command-format messages (e.g. /confirm-product:123)
    if text.startswith("/"):
        return None
    compact = re.sub(r"\s+", " ", text)
    numbers = re.findall(r"\d+(?:[.,]\d+)?", text)
    if not numbers:
        return None
    raw = numbers[0].replace(",", ".")
    try:
        value = float(raw)
    except ValueError:
        return None

    # Currency policy: USD as default. Convert VND-like units to USD.
    if re.search(r"\b(k|ngan|nghin)\b", compact):
        return (value * 1_000) / USD_TO_VND
    if re.search(r"\btrieu\b", compact):
        return (value * 1_000_000) / USD_TO_VND
    if re.search(r"\b(vnd|dong)\b", compact) or "₫" in compact:
        return value / USD_TO_VND
    if "$" in compact or re.search(r"\b(usd|dollar|us\$)\b", compact):
        return value
    # No unit -> assume USD.
    return value


def format_usd(amount: float) -> str:
    return f"${amount:,.2f}"


def pick_variants_for_budget(products: list[Product], budget_limit: float, limit_items: int = 6) -> list[tuple[Product, ProductVariant]]:
    """Return products with their cheapest in-stock variant priced <= budget.

    Each product is an *individual recommendation* (not a bundle).
    Products are sorted by price descending so the best-value items appear first.
    """
    seen_products: set[str] = set()
    candidates: list[tuple[Product, ProductVariant]] = []
    for product in products:
        in_stock = [v for v in product.variants if v.quantity > 0 and v.price <= budget_limit]
        if not in_stock:
            continue
        if product.id in seen_products:
            continue
        seen_products.add(product.id)
        # Pick the cheapest variant that fits the budget
        best = min(in_stock, key=lambda v: v.price)
        candidates.append((product, best))
    candidates.sort(key=lambda item: item[1].price, reverse=True)
    return candidates[:limit_items]

