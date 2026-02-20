#!/bin/bash
CONTAINER=n8n-dev
echo "📤 Export workflows..."
docker exec -u node  n8n export:workflow --backup --output=/home/node/n8n-projects/workflows
echo "📤 Export credentials..."
docker exec -u node  n8n export:credentials --backup --output=/home/node/n8n-projects/credentials
sudo chown -R ubuntu:ubuntu ~/n8n-projects/workflows ~/n8n-projects/credentials
echo "📦 Push vers GitHub..."
git add .
git commit -m "[dev] Backup: "
git push origin main
