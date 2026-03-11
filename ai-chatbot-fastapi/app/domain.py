from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ProductVariant:
    id: str
    price: float
    quantity: int
    weight_label: str
    weight_value: float | None = None
    weight_unit: str | None = None


@dataclass
class Product:
    id: str
    name: str
    description: str
    category: str
    variants: list[ProductVariant] = field(default_factory=list)

