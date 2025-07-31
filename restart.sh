#!/bin/bash

echo "🏈 Restarting NFL Picks Application..."

# Stop existing containers
echo "Stopping containers..."
docker compose --env-file .env down

# Remove any orphaned containers
echo "Cleaning up..."
docker compose --env-file .env down --remove-orphans

# Rebuild with no cache to ensure fresh build
echo "Rebuilding containers..."
docker compose --env-file .env build --no-cache

# Start the application
echo "Starting application..."
docker compose --env-file .env up -d

# Wait a moment for services to start
sleep 5

# Show logs to verify startup
echo "Checking service status..."
docker compose --env-file .env logs --tail=20

echo ""
echo "✅ Application restarted!"
echo "Frontend: http://192.168.69.111:3000"
echo "Backend: http://192.168.69.111:5000/health"
echo ""
echo "To view live logs: docker-compose --env-file .env logs -f"