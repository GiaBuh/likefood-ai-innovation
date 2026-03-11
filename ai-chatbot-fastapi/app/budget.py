from __future__ import annotations

import re

from .domain import Product, ProductVariant

USD_TO_VND = 25_000.0


def parse_budget_value(message: str) -> float | None:
    text = message.lower()
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


def normalize_price_to_usd(raw_price: float) -> float:
    # Heuristic: large values are treated as VND and converted to USD.
    if raw_price >= 1_000:
        return raw_price / USD_TO_VND
    return raw_price


def format_usd(amount: float) -> str:
    return f"${amount:,.2f}"


def pick_variants_for_budget(products: list[Product], budget_limit: float, limit_items: int = 3) -> list[tuple[Product, ProductVariant]]:
    candidates: list[tuple[Product, ProductVariant]] = []
    for product in products:
        for variant in product.variants:
            if normalize_price_to_usd(variant.price) <= budget_limit and variant.quantity > 0:
                candidates.append((product, variant))
    candidates.sort(key=lambda item: normalize_price_to_usd(item[1].price), reverse=True)

    picked: list[tuple[Product, ProductVariant]] = []
    total = 0.0
    used_products: set[str] = set()
    for product, variant in candidates:
        if len(picked) >= limit_items:
            break
        if product.id in used_products:
            continue
        variant_usd = normalize_price_to_usd(variant.price)
        if total + variant_usd <= budget_limit:
            picked.append((product, variant))
            used_products.add(product.id)
            total += variant_usd
    return picked

