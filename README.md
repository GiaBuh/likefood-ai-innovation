# LikeFood

E-commerce platform for Vietnamese specialty foods. The project consists of a **backend** (Spring Boot) and **frontend** (React + Vite).

---

## AI ChatBot Support (main focus)

AI chat assistant that helps customers discover dishes, get product recommendations, and add items to cart directly from the conversation.

### Features

- **Product recommendations**: Ask by dish name, description, or preference → AI responds using actual product catalog data
- **Add to cart via chat**: Confirm product, choose variant (weight), quantity → AI returns `cartInstruction` for the frontend to add to cart
- **Multilingual**: Vietnamese, English
- **Context-aware**: Maintains context (history, selected product) for coherent conversations

### Flow

1. Frontend sends a message + context (history, cart, selected product) via `POST /ai-chat/respond`
2. Backend uses **Gemini API** combined with product data from DB to generate a response
3. Response may include:
   - `reply`: response text
   - `actions`: action buttons (View product, Add to cart, Go to checkout…)
   - `cartInstruction`: `{ productId, variantId, quantity }` to add to cart
   - `nextContext`: context for the next chat turn

### Tech Stack (AI)

- **Backend**: `GeminiAiChatServiceImpl` calls Gemini API, `AiChatProductSupport` injects product data, `AiChatPromptSupport` builds system prompt
- **Frontend**: `ChatWidget` displays AI chat, handles actions and `cartInstruction` via `useChatWebSocket` / REST

### Configuration

```yaml
likefood:
  ai:
    gemini:
      api-key: ${GEMINI_API_KEY}
      model: gemini-1.5-pro
      enabled: true
```

---

## Other modules (overview)

| Module | Description |
|--------|--------------|
| **Product** | Products, Categories, ProductVariants (SKU per variant), slug auto-generated from name (Vietnamese-aware), S3 image upload |
| **Cart** | User cart, `CartItem` linked to `ProductVariant` |
| **Order** | Orders, payment, order status, order history |
| **Auth** | Login / register JWT, OAuth2, user profile + avatar |
| **Storage** | S3 image upload (products, avatar) |
| **Admin** | Dashboard, product/category management, orders, customers, CSV product import |

---

## Running the project

- **Backend**: `./gradlew bootRun` (requires MySQL, Redis, S3 config, Gemini API key in `.env` or `application.yml`)
- **Frontend**: `cd fontend && npm install && npm run dev`
