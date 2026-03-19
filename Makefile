# ============================================
# LikeFood AI Innovation - Makefile
# ============================================

.PHONY: help up down build rebuild logs \
        backend frontend chatbot mysql redis \
        logs-backend logs-frontend logs-chatbot logs-mysql logs-redis \
        restart-backend restart-frontend restart-chatbot \
        clean ps shell-backend shell-chatbot shell-frontend shell-mysql \
        dev-frontend dev-backend

# Default target
help: ## Show this help
	@echo ""
	@echo "  LikeFood AI Innovation - Available Commands"
	@echo "  ============================================"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ============================================
# Docker Compose - Full Stack
# ============================================

up: ## Start all services
	docker compose up -d

down: ## Stop all services
	docker compose down

build: ## Build all services
	docker compose build

rebuild: ## Rebuild and restart all services (no cache)
	docker compose build --no-cache
	docker compose up -d

ps: ## Show running containers
	docker compose ps

logs: ## Follow logs for all services
	docker compose logs -f

clean: ## Stop all services and remove volumes
	 	

# ============================================
# Individual Services - Start
# ============================================

backend: ## Start backend only
	docker compose up -d backend

frontend: ## Start frontend only
	docker compose up -d frontend

chatbot: ## Start FastAPI chatbot only
	docker compose up -d fastapi-chatbot

mysql: ## Start MySQL only
	docker compose up -d mysql

redis: ## Start Redis only
	docker compose up -d redis

# ============================================
# Logs
# ============================================

logs-backend: ## Follow backend logs
	docker compose logs -f backend

logs-frontend: ## Follow frontend logs
	docker compose logs -f frontend

logs-chatbot: ## Follow FastAPI chatbot logs
	docker compose logs -f fastapi-chatbot

logs-mysql: ## Follow MySQL logs
	docker compose logs -f mysql

logs-redis: ## Follow Redis logs
	docker compose logs -f redis

# ============================================
# Restart Individual Services
# ============================================

restart-backend: ## Rebuild and restart backend
	docker compose build backend
	docker compose up -d backend

restart-frontend: ## Rebuild and restart frontend
	docker compose build frontend
	docker compose up -d frontend

restart-chatbot: ## Rebuild and restart FastAPI chatbot
	docker compose build fastapi-chatbot
	docker compose up -d fastapi-chatbot

# ============================================
# Shell Access
# ============================================

shell-backend: ## Open shell in backend container
	docker compose exec backend sh

shell-frontend: ## Open shell in frontend container
	docker compose exec frontend sh

shell-chatbot: ## Open shell in chatbot container
	docker compose exec fastapi-chatbot sh

shell-mysql: ## Open MySQL CLI
	docker compose exec mysql mysql -u root -p likefood

# ============================================
# Local Development (without Docker)
# ============================================

dev-frontend: ## Run frontend locally (npm dev)
	cd frontend && npm install && npm run dev

dev-backend: ## Run backend locally (Gradle)
	cd backend && ./gradlew bootRun
