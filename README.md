# LikeFood

E-commerce platform for Vietnamese specialty foods. The project consists of a **backend** (Spring Boot) and **frontend** (React + Vite).

---

## Quick Start with Docker

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+)

### Step 1: Clone & configure environment

```bash
git clone https://github.com/GiaBuh/likefood-ai-innovation.git
cd likefood
cp .env.production .env
```

Edit `.env` and fill in the values. **Required** for basic setup:

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_PASSWORD` | MySQL root password | `MyStr0ngP@ssw0rd` |
| `JWT_SECRET` | JWT secret (base64, ≥64 chars) | `bGlrZWZvb2Qtc2VjcmV0LWtleS1hdC1sZWFzdC02NC1jaGFycy1sb25n` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost,http://localhost:80` |

**Optional** – can use defaults or disable:

| Variable | Description | Notes |
|----------|-------------|-------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | For "Login with Google" – get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Required with `GOOGLE_CLIENT_ID` |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI | Default: `http://localhost:3000/auth/google/callback` (match frontend) |
| `S3_ENABLED` | Enable/disable S3 image upload | `false` if no S3 yet |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS credentials | Required if `S3_ENABLED=true` |
| `AWS_S3_BUCKET` / `AWS_S3_PUBLIC_BASE_URL` / `AWS_REGION` | S3 config | |
| `GEMINI_ENABLED` | Enable/disable AI Chatbot | `false` to disable |
| `GEMINI_API_KEY` | Gemini API key | Get from [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP for invoice emails | Omit if not needed |

> **Quick tip**: Generate a base64 JWT_SECRET:  
> `Open git bash here -> openssl rand -base64 64`

### Step 2: Run with Docker Compose

```bash
docker compose up -d
```

First build may take 3–5 minutes (backend + frontend).

### Step 3: Access the application

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend + API** | http://localhost | Main UI, API proxied via Nginx |
| Backend direct | http://localhost:8080 | For debugging only |
| MySQL | localhost:3306 | `root` / `DB_PASSWORD` from `.env` |
| Redis | localhost:6379 | No auth by default |

### Common commands

```bash
# View logs
docker compose logs -f

# Stop all
docker compose down

# Stop and remove volumes (DB, Redis)
docker compose down -v

# Rebuild after code changes
docker compose up -d --build
```

### Minimal mode (no S3, no AI)

Set in `.env`:

```env
S3_ENABLED=false
GEMINI_ENABLED=false
```

Leave `AWS_*` and `GEMINI_API_KEY` empty or default. App runs normally, just without image upload and chatbot.

### Troubleshooting

| Issue | Solution |
|-------|----------|
| `env_file .env not found` | Run `cp .env.production .env` before `docker compose up` |
| Backend cannot connect to MySQL | Wait a few seconds for MySQL to start (healthcheck), then `docker compose restart backend` |
| `JWT_SECRET` error | Ensure JWT_SECRET is at least 64 characters, preferably base64 |
| Port 80/8080/3306 in use | Change ports in `docker-compose.yml` (e.g. `"3000:80"` for frontend) |

### Google Login (optional)

1. Create OAuth 2.0 credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add authorized redirect URI: `http://localhost:3000/auth/google/callback` (or your frontend URL)
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

Flow: Frontend gets login URL from `GET /auth/google/url` → user logs in at Google → redirects to `/auth/google/callback?code=...` → frontend sends code to `POST /auth/google/callback` → backend creates/retrieves user and returns access token.

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
| **Auth** | Login / register JWT, OAuth2, Google login, user profile + avatar |
| **Storage** | S3 image upload (products, avatar) |
| **Admin** | Dashboard, product/category management, orders, customers, CSV product import |

---

## Running the project (local development)

Besides Docker, you can run backend and frontend separately for development:

- **Backend**: `cd backend && ./gradlew bootRun` — requires MySQL, Redis, and config in `.env` or `application.yml`
- **Frontend**: `cd frontend && npm install && npm run dev` — runs at http://localhost:3000
