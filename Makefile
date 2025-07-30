# NFL Picks Application Makefile

.PHONY: help build up down logs clean restart dev-setup test

# Default target
help:
	@echo "NFL Picks Application Commands:"
	@echo ""
	@echo "  build          Build all Docker images"
	@echo "  up             Start the application stack"
	@echo "  down           Stop the application stack"
	@echo "  logs           View application logs"
	@echo "  clean          Remove containers, images, and volumes"
	@echo "  restart        Restart the application stack"
	@echo "  dev-setup      Set up development environment"
	@echo "  backup-db      Backup the database"
	@echo "  restore-db     Restore database from backup"
	@echo ""

# Build all services
build:
	@echo "Building NFL Picks application..."
	docker-compose build --no-cache

# Start the application
up:
	@echo "Starting NFL Picks application..."
	docker-compose up -d
	@echo "Application started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:5000"
	@echo "Health check: http://localhost:5000/health"

# Stop the application
down:
	@echo "Stopping NFL Picks application..."
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Clean up everything
clean:
	@echo "Cleaning up Docker resources..."
	docker-compose down -v --remove-orphans
	docker system prune -f
	docker volume prune -f

# Restart the application
restart: down up

# Development setup
dev-setup:
	@echo "Setting up development environment..."
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env file from template"; fi
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Development setup complete!"

# Database backup
backup-db:
	@echo "Backing up database..."
	docker-compose exec database pg_dump -U postgres -d nfl_picks > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Database backup completed!"

# Database restore (requires backup file as argument: make restore-db FILE=backup.sql)
restore-db:
	@if [ -z "$(FILE)" ]; then echo "Please specify backup file: make restore-db FILE=backup.sql"; exit 1; fi
	@echo "Restoring database from $(FILE)..."
	docker-compose exec -T database psql -U postgres -d nfl_picks < $(FILE)
	@echo "Database restore completed!"

# Quick development start
dev:
	@echo "Starting development environment..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build