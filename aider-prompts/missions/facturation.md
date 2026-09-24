# Mission — 🧾 Educfinance — Facturation Cohorte

## Objectif
Générer un workflow n8n qui automatise l'émission d'une facture Educfinance
à la fin d'une cohorte de vente, depuis Pipedrive jusqu'à la notification Telegram.

## Déclencheur
Manuel (n8n-nodes-base.manualTrigger) — automatisation future hors scope.

## Paramètres d'entrée (saisis au déclenchement)
- Nom du stage Pipedrive ciblé (ex: `Cohorte 64 (25 juin)`)

## Flux complet

### Étape 1 — Get Pipedrive Deals
- HTTP Request GET vers API Pipedrive
- Filtrer les deals du stage saisi en paramètre
- Extraire : liste des noms des prospects + date de démarrage cohorte
- Numéro de cohorte extrait du nom du stage (ex: `64`)

### Étape 2 — Download Invoice File
- Nœud Microsoft Drive : télécharger le fichier Excel de facturation
- Fichier unique multi-onglets sur OneDrive

### Étape 3 — Process Invoice Sheet (Code Node JavaScript)
Logique à implémenter :
- Identifier le dernier onglet `Fact. 2026XXX`
- Copier cet onglet
- Renommer : `Fact. 2026[N+1]`
- Modifier dans le nouvel onglet :
  - Date de facturation = date démarrage cohorte + 1 jour
  - Numéro de facture = N+1 (format `2026XXX`)
  - Numéro de cohorte = numéro extrait du stage Pipedrive
  - Coller la liste des noms des prospects convertis
  - Prix unitaire : 150 CA$ (formules déjà en place)
- Ajouter une ligne dans l'onglet `Registre` :
  (numéro facture, date, numéro cohorte, nombre prospects, montant total)

### Étape 4 — Upload Updated File
- Nœud Microsoft Drive : remettre le fichier Excel mis à jour sur OneDrive

### Étape 5 — Export PDF via Graph API
- HTTP Request vers Microsoft Graph API
- Endpoint de rendu PDF de l'onglet facture
- Récupérer le PDF binaire

### Étape 6 — Send Telegram Verification
- Nœud Telegram (credential : `Sales`)
- Message de vérification avec résumé :
  "🧾 Facture #2026XXX — Cohorte #YY — ZZ prospects — Montant : ZZZ CA$
   Confirmes-tu l'envoi ?"
- Boutons inline : ✅ Envoyer / ❌ Annuler
- Attendre la réponse (webhook Telegram callback)

### Étape 7 — Branchement sur réponse Telegram
- Si ✅ Envoyer → continuer vers Étape 8
- Si ❌ Annuler → nœud Stop, notification d'annulation

### Étape 8 — Send Email (TEST)
- Nœud Gmail (credential : `Gmail account`)
- Expéditeur : compte Gmail configuré
- Destinataire TEST : debourouba.test@gmail.com
  (à remplacer par yosef@educfinance.ca en production)
- Sujet : `Facture Educfinance #2026XXX — Cohorte #YY`
- Corps : courriel chaleureux en français transmettant la facture
- Pièce jointe : PDF généré à l'Étape 5

### Étape 9 — Send Telegram Confirmation
- Nœud Telegram (credential : `Sales`)
- Message : "✅ Facture #2026XXX envoyée avec succès — [Lien OneDrive PDF]"

## Contraintes techniques
- Credential Microsoft : `Microsoft Drive account`
- Credential Telegram : `Sales`
- Credential Email test : `Gmail account`
- Pipedrive : HTTP Request avec header `x-api-token` en variable d'environnement
- Le workflow doit être importable via API POST n8n sans modification manuelle
