#!/bin/bash
CONTAINER=n8n-dev
echo "📤 Export workflows..."
docker exec -u node $CONTAINER n8n export:workflow --backup --output=/home/node/n8n-projects/workflows
echo "📤 Export credentials..."
docker exec -u node $CONTAINER n8n export:credentials --backup --output=/home/node/n8n-projects/credentials
sudo chown -R ubuntu:ubuntu ~/n8n-projects/workflows ~/n8n-projects/credentials
echo "📦 Push vers GitHub..."
git -C ~/n8n-projects add .
git -C ~/n8n-projects commit -m "[dev] Backup: $(date +'%Y-%m-%d %H:%M')"
git -C ~/n8n-projects push origin main
echo "✅ Sauvegarde terminée !"
