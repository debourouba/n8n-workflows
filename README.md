# n8n-control — Tour de contrôle Oracle Cloud

Scripts de gestion des instances n8n hébergées sur Oracle Cloud Free Tier,
exécutés depuis le laptop WSL (tour de contrôle).

---

## Infrastructure

| Instance | URL | IP | Ressources |
|----------|-----|----|------------|
| Dev | https://n8n-dev.dbflowtools.vip | 148.116.68.71 | 3 OCPUs / 18 GB RAM |
| Prod | https://n8n.dbflowtools.vip | 148.116.95.221 | 1 OCPU / 6 GB RAM |

---

## Flux de travail quotidien

### 1. Développer sur Dev
Connecte-toi à https://n8n-dev.dbflowtools.vip et modifie tes workflows.

### 2. Sauvegarder Dev → GitHub
\`\`\`bash
~/n8n-control/save.sh dev
\`\`\`

### 3. Déployer vers Prod
\`\`\`bash
~/n8n-control/deploy.sh prod
\`\`\`

### 4. Sauvegarder Prod (si modif directe)
\`\`\`bash
~/n8n-control/save.sh prod
\`\`\`

---

## Commandes utiles

### Vérifier l'état des instances
\`\`\`bash
ssh n8n-dev "docker ps"
ssh n8n-prod "docker ps"
\`\`\`

### Voir les logs
\`\`\`bash
ssh n8n-dev "docker logs n8n-dev --tail 20"
ssh n8n-prod "docker logs n8n-prod --tail 20"
\`\`\`

### Redémarrer une instance
\`\`\`bash
ssh n8n-dev "cd ~/n8n-projects && docker compose restart"
ssh n8n-prod "cd ~/n8n-projects && docker compose restart"
\`\`\`

### Mettre à jour n8n
\`\`\`bash
ssh n8n-dev "cd ~/n8n-projects && docker compose down && docker compose pull && docker compose up -d"
ssh n8n-prod "cd ~/n8n-projects && docker compose down && docker compose pull && docker compose up -d"
\`\`\`

### Corriger les permissions (erreur EACCES)
\`\`\`bash
ssh n8n-dev "sudo chown -R 1000:1000 ~/n8n-projects/workflows ~/n8n-projects/credentials"
ssh n8n-prod "sudo chown -R 1000:1000 ~/n8n-projects/workflows ~/n8n-projects/credentials"
\`\`\`

---

## Dépannage rapide

| Problème | Solution |
|----------|----------|
| Page "Set up owner account" | Vérifier le volume dans docker-compose.yml |
| Erreur EACCES à l'export | \`sudo chown -R 1000:1000 ~/n8n-projects/workflows\` |
| Push GitHub rejeté | \`git pull origin main --rebase\` puis repusher |
| Conteneur nommé n8n-dev sur Prod | Corriger \`container_name\` dans docker-compose.yml de Prod |
| Erreur 521 Cloudflare | Conteneur arrêté, vérifier avec \`docker ps\` |
| Erreur 522 Cloudflare | Port 5678 bloqué, vérifier Oracle Security List |

---

## GitHub

| Repo | Contenu |
|------|---------|
| [n8n-workflows](https://github.com/debourouba/n8n-workflows) | Workflows + credentials JSON |
| [projects](https://github.com/debourouba/projects) | Projets Python |
