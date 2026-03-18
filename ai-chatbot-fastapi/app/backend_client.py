from __future__ import annotations

from typing import Any

import httpx

from .config import settings
from .domain import Product, ProductVariant


class BackendClient:
    def __init__(self) -> None:
        self.base_url = settings.backend_base_url.rstrip("/")

    async def fetch_products(self) -> list[Product]:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                f"{self.base_url}/products",
                params={"page": 1, "size": 200, "status": "ACTIVE"},
            )
            response.raise_for_status()
            payload = response.json()

        data = payload.get("data", payload)
        items = data.get("result", data) if isinstance(data, dict) else data
        if not isinstance(items, list):
            return []

        products: list[Product] = []
        for raw in items:
            variants = []
            for v in raw.get("variants", []) or []:
                weight_value = v.get("weightValue")
                weight_unit = v.get("weightUnit")
                label = v.get("weight")
                if not label and weight_value is not None and weight_unit:
                    label = f"{weight_value:g}{weight_unit}"
                variants.append(
                    ProductVariant(
                        id=str(v.get("id", "")),
                        price=float(v.get("price") or 0),
                        quantity=int(v.get("quantity") or 0),
                        weight_label=label or "Default",
                        weight_value=float(weight_value) if weight_value is not None else None,
                        weight_unit=weight_unit,
                    )
                )
            products.append(
                Product(
                    id=str(raw.get("id", "")),
                    name=str(raw.get("name") or ""),
                    description=str(raw.get("description") or ""),
                    category=str((raw.get("category") or {}).get("name") or "Khac"),
                    variants=[v for v in variants if v.id and v.price > 0 and v.quantity > 0],
                )
            )
        return [p for p in products if p.id and p.name and p.variants]

    async def add_item_to_cart(self, variant_id: str, quantity: int, auth_header: str | None) -> dict[str, Any] | None:
        if not auth_header:
            return None
        headers = {"Authorization": auth_header}
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(
                f"{self.base_url}/carts/me/items",
                json={"variantId": variant_id, "quantity": quantity},
                headers=headers,
            )
            if response.status_code >= 400:
                return None
            payload = response.json()
            return payload.get("data", payload)

