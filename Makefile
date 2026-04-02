.PHONY: install dev-backend dev-frontend build docker-up docker-down

# Instala todas as dependências
install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

# Roda o backend em modo desenvolvimento
dev-backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Roda o frontend em modo desenvolvimento
dev-frontend:
	cd frontend && npm run dev

# Build de produção do frontend
build:
	cd frontend && npm run build

# Sobe os containers Docker (produção)
docker-up:
	docker-compose up --build -d

# Para os containers
docker-down:
	docker-compose down

# Mostra os logs dos containers
logs:
	docker-compose logs -f
