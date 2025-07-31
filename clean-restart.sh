#!/bin/bash

echo "🧹 Clean restart - This will reset the database!"
read -p "Are you sure? This will delete all data! (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🛑 Stopping containers..."
    docker compose --env-file .env down
    
    echo "🗑️ Removing database volume..."
    docker volume rm nfl-picks_postgres_data 2>/dev/null || true
    
    echo "🚀 Starting fresh..."
    docker compose --env-file .env up --build -d
    
    echo "⏳ Waiting for database to initialize..."
    sleep 10
    
    echo "📋 Checking logs..."
    docker compose --env-file .env logs --tail=20
else
    echo "❌ Cancelled clean restart"
fi