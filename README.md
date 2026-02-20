# n8n Workflows

Workflows et configuration pour l'instance n8n hébergée sur Oracle Cloud Free Tier.

## Infrastructure

| Instance | URL | Ressources |
|----------|-----|------------|
| Dev | https://n8n-dev.dbflowtools.vip | 3 OCPUs / 18GB RAM |
| Prod | https://n8n.dbflowtools.vip | 1 OCPU / 6GB RAM |

## Structure

```
n8n-projects/
├── workflows/       # Exports JSON des workflows
├── credentials/     # Exports JSON des credentials
├── docker-compose.yml
├── save.sh          # Export + push vers GitHub
└── README.md
```

## Usage

```bash
# Sauvegarder les workflows vers GitHub
./save.sh
```
