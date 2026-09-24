#!/bin/bash
WF_ID=${1:-GGqlUJaJz2zJUGIB}
cd ~/n8n-projects
git pull
export N8N_KEY=$(grep N8N_API_KEY secrets/.env | cut -d= -f2)
curl -s -X PUT "http://localhost:5678/api/v1/workflows/$WF_ID" \
  -H "X-N8N-API-KEY: $N8N_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq '{name, nodes, connections, settings: {executionOrder: "v1"}}' workflows/$WF_ID.json)" \
  | jq '{id, name, updatedAt}'
