#!/bin/bash
CONTAINER=n8n-dev
echo "📤 Export workflows..."
docker exec -u node $CONTAINER n8n export:workflow --backup --output=/home/node/n8n-projects/workflows
echo "📤 Export credentials..."
docker exec -u node $CONTAINER n8n export:credentials --backup --output=/home/node/n8n-projects/credentials
echo "📦 Sync GitHub..."
git -C ~/n8n-projects fetch origin
git -C ~/n8n-projects pull origin main --rebase
git -C ~/n8n-projects add .
git -C ~/n8n-projects diff --cached --quiet && echo "Rien à commiter." && exit 0
git -C ~/n8n-projects commit -m "[dev] Backup: $(TZ='America/Toronto' date +'%Y-%m-%d %H:%M')"
git -C ~/n8n-projects push origin main
echo "✅ Sauvegarde terminée !"
