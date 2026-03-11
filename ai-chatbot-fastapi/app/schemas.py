from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class AiChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AiChatContext(BaseModel):
    selectedProductId: str | None = None
    selectedVariantId: str | None = None
    awaiting: str | None = "NONE"
    pendingQuantity: int | None = None
    pendingVariantHint: str | None = None
    pendingCategory: str | None = None
    lastRecommendedVariantIds: list[str] = Field(default_factory=list)
    lastBudgetLimit: float | None = None
    budgetExpanded: bool = False


class AiChatRequest(BaseModel):
    message: str
    history: list[AiChatTurn] = Field(default_factory=list)
    preferredLanguage: Literal["vi", "en"] = "vi"
    context: AiChatContext | None = None


class AiChatAction(BaseModel):
    type: str
    label: str
    command: str | None = None
    productId: str | None = None
    variantId: str | None = None
    quantity: int | None = None
    reason: str | None = None
    offerType: str | None = None


class AiCartInstruction(BaseModel):
    productId: str | None = None
    variantId: str | None = None
    quantity: int | None = None


class AiRecommendationMeta(BaseModel):
    reason: str | None = None
    offerType: str | None = None
    fallbackLevel: Literal["EXACT", "RELATED", "CATEGORY_BUDGET", "SAFE"] | None = None
    confidenceBand: Literal["high", "medium", "low"] | None = None
    intent: str | None = None
    formatProfile: Literal["compact_detail", "recommendation_list", "budget_advice", "simple_cta"] | None = None
    debugContextId: str | None = None
    debugFromAwaiting: str | None = None
    debugToAwaiting: str | None = None


class AiAssistantResponse(BaseModel):
    reply: str
    refusal: bool = False
    shouldOfferAddToCart: bool = False
    language: Literal["vi", "en"] = "vi"
    matchedProductIds: list[str] = Field(default_factory=list)
    actions: list[AiChatAction] = Field(default_factory=list)
    nextContext: AiChatContext = Field(default_factory=AiChatContext)
    cartInstruction: AiCartInstruction | None = None
    recommendationMeta: AiRecommendationMeta | None = None


class RestEnvelope(BaseModel):
    statusCode: int = 200
    error: str | None = None
    message: str | None = None
    data: AiAssistantResponse

