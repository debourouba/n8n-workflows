#!/bin/bash
CONTAINER=n8n-dev
echo "🔧 Préparation permissions..."
sudo chown -R 1000:1000 ~/n8n-projects/workflows ~/n8n-projects/credentials
echo "📤 Export workflows..."
docker exec -u node $CONTAINER n8n export:workflow --backup --output=/home/node/n8n-projects/workflows
echo "📤 Export credentials..."
docker exec -u node $CONTAINER n8n export:credentials --backup --output=/home/node/n8n-projects/credentials
sudo chown -R ubuntu:ubuntu ~/n8n-projects/workflows ~/n8n-projects/credentials
echo "📦 Sync GitHub..."
git -C ~/n8n-projects stash
git -C ~/n8n-projects pull origin main --rebase
git -C ~/n8n-projects stash pop
git -C ~/n8n-projects add .
git -C ~/n8n-projects diff --cached --quiet && echo "Rien à commiter." && exit 0
git -C ~/n8n-projects commit -m "[dev] Backup: $(TZ='America/Toronto' date +'%Y-%m-%d %H:%M')"
git -C ~/n8n-projects push origin main
echo "✅ Sauvegarde terminée !"
