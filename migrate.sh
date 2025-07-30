#!/bin/bash

echo "🔄 Applying database migration for groups functionality..."

# Apply the migration
docker-compose --env-file .env exec -T database psql -U postgres -d nfl_picks < database/migrate.sql

echo "✅ Migration completed!"

# Restart backend to ensure clean state
echo "🔄 Restarting backend..."
docker-compose --env-file .env restart backend

# Show backend logs to verify startup
echo "📋 Backend startup logs:"
docker-compose --env-file .env logs --tail=10 backend