# Environnement n8n — Contexte technique permanent

## Infrastructure
- n8n self-hosted, Docker, OCI Ubuntu 24.04 aarch64
- PostgreSQL 16
- Instance : n8n-dev.dbflowtools.vip

## Credentials disponibles (noms exacts)
- `Google Drive account` — Google Drive OAuth2
- `Gmail account` — Gmail OAuth2
- `Google Sheets account` — Google Sheets OAuth2
- `Microsoft Drive account` — Microsoft Drive OAuth2 (OneDrive + Graph API)
- `Sales` — Telegram API
- `GED` — Telegram API
- `Brevo account` — Brevo
- `SMTP account` — SMTP
- `IONOS IMAP account` — IMAP IONOS

## Services externes
- Pipedrive CRM (HTTP Request + API key en variable)
- OpenRouter (LLM)
- Gemini 2.5 Flash
- Telegram (notifications)

## Conventions de nommage

### Workflows
Format : `[ÉMOJI] [DOMAINE] — [Fonction]`
Exemples :
- `📱 GED — Telegram Commander`
- `🧾 Educfinance — Facturation Cohorte`

### Nœuds
- Noms en anglais, descriptifs, uniques dans le workflow
- Format Title Case : `Get Pipedrive Deals`, `Send Telegram Confirmation`
- Jamais de noms génériques : `HTTP Request1`, `Code2`, `Set3`

## Structure JSON racine — import API (champs autorisés uniquement)
```json
{
  "name": "string",
  "nodes": [],
  "connections": {},
  "settings": {"executionOrder": "v1"},
  "staticData": null,
  "pinData": {}
}
```
Champs interdits : `id`, `createdAt`, `updatedAt`, `versionId`, `tags`,
`shared`, `isArchived`, `triggerCount`, `versionCounter`, `activeVersionId`

## Structure nœud obligatoire
```json
{
  "id": "[UUID v4 unique]",
  "name": "[Nom unique]",
  "type": "[type exact n8n]",
  "typeVersion": [version],
  "position": [x, y],
  "parameters": {}
}
```

## Connections — format exact
```json
"connections": {
  "Nom Nœud Source": {
    "main": [[{"node": "Nom Nœud Cible", "type": "main", "index": 0}]]
  }
}
```
Les noms dans `connections` doivent correspondre exactement aux `name` des nœuds.

## Positionnement
- Espacement horizontal : 250px
- Flux principal : y=300
- Branches : ±200px sur Y

## Processus de travail (mode Architect R1/V3)

### Phase R1 — Architecture uniquement, pas de JSON
1. Lister les nœuds nécessaires avec type exact n8n
2. Décrire le flux et les connexions
3. Identifier les branches et points de décision
4. Lister les paramètres critiques
5. Signaler les risques techniques
6. Demander validation avant de passer à V3

### Phase V3 — Génération JSON
1. JSON complet et valide en un seul bloc
2. UUID v4 réels et uniques par nœud
3. Cohérence stricte des noms dans `connections`
4. Aucun commentaire à l'intérieur du JSON

## BIBLIOTHÈQUE DE RÉFÉRENCE DES NŒUDS RÉELS
Le fichier aider-prompts/node-reference/all_node_types.json contient un exemple 
RÉEL et VALIDÉ de chaque type de nœud déjà utilisé sur cette instance n8n 
(extrait directement de workflows en production via l'API).

AVANT de générer ou modifier tout nœud non-trivial (gmail, telegram, code, 
microsoftOneDrive, pipedrive, httpRequest, googleSheets, googleDrive, etc.), 
TOUJOURS consulter ce fichier en premier pour copier la structure exacte 
(typeVersion, noms de paramètres, structure de credentials) plutôt que de 
deviner depuis la mémoire d'entraînement.

Si un type de nœud nécessaire n'est PAS dans cette bibliothèque, le signaler 
explicitement à l'utilisateur avant de générer le nœud, et proposer de le 
configurer manuellement une fois dans n8n pour l'ajouter à la bibliothèque 
via : ./scripts/extract_node_reference.sh

## Payload PUT/POST API n8n — champs settings à exclure
Le champ "settings" complet d'un workflow peut contenir des propriétés non 
supportées en écriture par l'API REST (ex: availableInMCP sur n8n v2.25+). 
Toujours réduire settings au minimum nécessaire lors d'un PUT/POST :
{ settings: { executionOrder: "v1" } }
plutôt que de réutiliser l'objet settings complet retourné par un GET.

## Debug de workflows existants — vérifier TOUTES les branches convergentes
Quand un nœud reçoit des connexions depuis plusieurs branches IF/Switch 
différentes, chaque branche peut transmettre un contexte de données différent. 
Une correction qui résout le problème sur une branche peut laisser intact 
le même bug sur une autre branche qui converge vers le même nœud cible.

Avant de considérer un bug résolu : identifier TOUTES les branches qui mènent 
au nœud en erreur (jq '.connections | to_entries[] | select(...))'), et 
vérifier que chacune transmet bien les données attendues — pas seulement 
la branche illustrée par le message d'erreur initial.

Pour diagnostiquer une 404/undefined dans une URL HTTP Request : toujours 
consulter l'exécution réelle via l'API (/api/v1/executions/{id}?includeData=true) 
plutôt que de supposer — le champ "source.previousNode" indique la branche 
réellement empruntée, et le contenu de "data.main[0][0].json" du nœud 
précédent montre exactement ce qui était disponible au moment de l'échec.
