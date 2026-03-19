from __future__ import annotations

import time
from typing import Any

import httpx

from .config import settings
from .domain import Product, ProductVariant

VoucherDict = dict[str, Any]
ComboDict = dict[str, Any]

_PRODUCT_CACHE_TTL = 300  # 5 minutes


class BackendClient:
    def __init__(self) -> None:
        self.base_url = settings.backend_base_url.rstrip("/")
        self._products_cache: list[Product] | None = None
        self._products_cache_time: float = 0.0


    async def fetch_products(self) -> list[Product]:
        now = time.monotonic()
        if self._products_cache is not None and (now - self._products_cache_time) < _PRODUCT_CACHE_TTL:
            return self._products_cache

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
                    slug=str(raw.get("slug") or ""),
                    variants=[v for v in variants if v.id and v.price > 0 and v.quantity > 0],
                )
            )
        result = [p for p in products if p.id and p.name and p.variants]
        self._products_cache = result
        self._products_cache_time = now
        return result

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

    async def fetch_active_vouchers(self) -> list[VoucherDict]:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(f"{self.base_url}/vouchers/active")
                response.raise_for_status()
                payload = response.json()
            data = payload.get("data", payload)
            return data if isinstance(data, list) else []
        except Exception:
            return []

    async def fetch_published_combos(self) -> list[ComboDict]:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(f"{self.base_url}/ai/combos/published")
                response.raise_for_status()
                payload = response.json()
            data = payload.get("data", payload)
            return data if isinstance(data, list) else []
        except Exception:
            return []

    async def fetch_my_orders(self, auth_header: str | None) -> list[dict[str, Any]]:
        """Fetch user's orders for order tracking and purchase history."""
        if not auth_header:
            return []
        try:
            headers = {"Authorization": auth_header}
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(
                    f"{self.base_url}/orders/me",
                    headers=headers,
                )
                response.raise_for_status()
                payload = response.json()
            data = payload.get("data", payload)
            return data if isinstance(data, list) else []
        except Exception:
            return []

