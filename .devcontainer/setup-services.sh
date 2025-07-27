#!/bin/bash

echo "Setting up PostgreSQL and Redis for DevContainer..."

# Start PostgreSQL in Docker
docker run -d \
  --name taskmanager-postgres \
  -e POSTGRES_USER=taskmanager \
  -e POSTGRES_PASSWORD=taskmanager \
  -e POSTGRES_DB=taskmanager_dev \
  -p 5432:5432 \
  postgres:15-alpine

# Start Redis in Docker
docker run -d \
  --name taskmanager-redis \
  -p 6379:6379 \
  redis:7-alpine

echo "PostgreSQL available at localhost:5432"
echo "Redis available at localhost:6379"
echo "Database: taskmanager_dev"
echo "User: taskmanager"
echo "Password: taskmanager"