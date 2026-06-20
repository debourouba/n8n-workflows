#!/bin/bash
# Extrait un exemple réel de chaque type de nœud utilisé sur l'instance n8n
set -euo pipefail

OUTPUT_DIR=~/n8n-projects/aider-prompts/node-reference
mkdir -p "$OUTPUT_DIR"
TMP_RAW=/tmp/all_nodes_raw.json
> "$TMP_RAW"

WORKFLOWS=$(curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
  http://localhost:5678/api/v1/workflows | jq -r '.data[].id')

for id in $WORKFLOWS; do
  curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
    "http://localhost:5678/api/v1/workflows/$id" \
    | jq -c '.nodes[]' >> "$TMP_RAW" 2>/dev/null
done

# Un seul exemple par type de nœud, avec seulement les champs utiles
jq -s '
  group_by(.type) 
  | map(.[0]) 
  | map({type, typeVersion, parameters, credentials})
' "$TMP_RAW" > "$OUTPUT_DIR/all_node_types.json"

echo "Référence extraite : $OUTPUT_DIR/all_node_types.json"
echo "Types de nœuds couverts :"
jq -r '.[].type' "$OUTPUT_DIR/all_node_types.json" | sort
