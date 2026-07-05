# Déployer BidEdge sur Vercel

BidEdge = **deux services** dans un seul dépôt :

1. **`ebay-service/`** — API Flask (Python) qui lit les API officielles eBay + filtre/verdict Gemini.
2. **la racine** — l'app Next.js (front + API routes + Neon/Drizzle + auth).

Sur Vercel, on crée **deux projets** à partir du **même dépôt GitHub**, en jouant sur le réglage *Root Directory*. Le Next.js appelle le Flask via la variable `EBAY_API_URL`.

```
GitHub (Manouzr/raise-backup)
        │
        ├── Projet Vercel #1  (Root Directory = ebay-service)  →  https://bidedge-api.vercel.app
        │        API Flask : /health /auctions /market/median /lot/analyze ...
        │
        └── Projet Vercel #2  (Root Directory = ./)            →  https://bidedge.vercel.app
                 Next.js : app + API routes, appelle EBAY_API_URL = l'URL du projet #1
```

## Prérequis

- Un compte [Vercel](https://vercel.com) connecté à GitHub, avec accès au dépôt.
- Une base **Neon** (PostgreSQL) — [neon.tech](https://neon.tech). Récupère les deux chaînes de connexion : *pooled* (pour le runtime) et *direct* (pour les migrations).
- Des identifiants **eBay** (application production) : `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET` — [developer.ebay.com](https://developer.ebay.com).
- Une clé **Gemini** : `GEMINI_API_KEY` — [aistudio.google.com](https://aistudio.google.com/apikey).
- Le fichier `ebay-service/vercel.json` (déjà présent dans le dépôt) — c'est lui qui dit à Vercel de servir Flask comme fonction Python.

---

## Partie A — Déployer l'API Flask (`ebay-service`)

### 1. Comment ça marche

Vercel exécute Flask comme **fonction serverless Python**. Le fichier `ebay-service/vercel.json` route toutes les URL vers `app.py`, dont l'objet WSGI `app` (`app = Flask(__name__)`) gère le routage. Les dépendances de `requirements.txt` (`Flask`, `flask-cors`, `requests`, `python-dotenv`) sont installées automatiquement — **pas besoin de gunicorn** (Vercel fournit le serveur).

```json
// ebay-service/vercel.json
{
  "version": 2,
  "builds": [{ "src": "app.py", "use": "@vercel/python" }],
  "routes": [{ "src": "/(.*)", "dest": "app.py" }]
}
```

### 2. Créer le projet Vercel

1. Vercel → **Add New… → Project** → importe le dépôt GitHub.
2. **Root Directory** → clique *Edit* → sélectionne **`ebay-service`**. ⚠️ Étape clé : sans ça, Vercel construit le Next.js à la place.
3. Framework Preset : **Other** (Vercel détecte le Python via `vercel.json`).
4. Ne déploie pas encore — ajoute d'abord les variables (étape 3).

### 3. Variables d'environnement (projet Flask)

Project → **Settings → Environment Variables** :

| Variable | Valeur | Requis |
|---|---|---|
| `EBAY_CLIENT_ID` | ton App ID eBay production | ✅ |
| `EBAY_CLIENT_SECRET` | ton Cert ID eBay production | ✅ |
| `EBAY_MARKETPLACE_ID` | `EBAY_FR` (ou `EBAY_US`, …) | défaut `EBAY_FR` |
| `EBAY_CURRENCY` | `EUR` | défaut `EUR` |
| `GEMINI_API_KEY` | ta clé Gemini | ✅ (sinon filtre/verdict désactivés proprement) |
| `GEMINI_MODEL` | `gemini-flash-latest` | optionnel |
| `CORS_ORIGINS` | `https://bidedge.vercel.app` (l'URL du projet Next.js — à remplir après la Partie B) | recommandé |

### 4. Déployer & tester

**Deploy**, puis vérifie l'API en ouvrant `https://<ton-projet-flask>.vercel.app/health` :

```json
{ "ok": true, "service": "bidedge-ebay", "has_credentials": true, "marketplace": "EBAY_FR", "currency": "EUR" }
```

Note bien cette URL — elle devient `EBAY_API_URL` côté Next.js.

> Test rapide d'un endpoint réel : `https://<projet-flask>.vercel.app/auctions?q=rolex&limit=5`

---

## Partie B — Déployer le Next.js (racine)

### 1. Créer le second projet Vercel

1. Vercel → **Add New… → Project** → importe **le même dépôt**.
2. **Root Directory** → laisse **`./`** (la racine).
3. Framework Preset : **Next.js** (détecté automatiquement). Build `next build`, aucune config à changer.

### 2. Variables d'environnement (projet Next.js)

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | chaîne Neon **pooled** (`...-pooler...`) — utilisée au runtime |
| `DIRECT_URL` | chaîne Neon **directe** — utilisée par les migrations/seed |
| `AUTH_SECRET` | un secret long et aléatoire pour signer les sessions JWT |
| `EBAY_API_URL` | l'URL du projet Flask, ex. `https://bidedge-api.vercel.app` (sans `/` final) |

> Générer un `AUTH_SECRET` : `openssl rand -hex 32` (ou `node -e "console.log(crypto.randomBytes(32).toString('hex'))"`).

### 3. Préparer la base Neon (une seule fois, depuis ta machine)

Le schéma et le seed se lancent **en local** contre Neon (pas besoin de le faire sur Vercel) :

```bash
# dans un .env.local à la racine, mets les mêmes DATABASE_URL / DIRECT_URL que sur Vercel
npm install
npm run db:push     # crée les tables sur Neon
npm run db:seed     # crée le super-admin + l'org de démo "Team RAISE"
```

### 4. Déployer

**Deploy**. À la fin, tu obtiens l'URL publique, ex. `https://bidedge.vercel.app`.

---

## Partie C — Relier les deux

1. Reviens sur le **projet Flask** → `CORS_ORIGINS` = l'URL exacte du Next.js (`https://bidedge.vercel.app`). **Redeploy** le projet Flask pour appliquer.
2. Vérifie que le **projet Next.js** a bien `EBAY_API_URL` = l'URL du Flask.
3. Ouvre le Next.js, connecte-toi (`manou@bidedge.app` / `bidedge-demo`) et teste un monitoring produit : la donnée doit venir en vrai d'eBay via le service Flask.

---

## Limites & pièges sur Vercel

- **SSE (temps réel).** Les routes `/api/feed` et `/api/monitor/stream` sont des flux longs. Sur Vercel, une fonction a une durée max (60 s en Hobby, jusqu'à 300 s en Pro). Un flux ouvert est coupé à cette limite ; le client se reconnecte, ce qui suffit pour la démo. Pour rallonger, ajoute `export const maxDuration = 60` dans le fichier de la route (déjà en `runtime = "nodejs"`).
- **Caches en mémoire.** Le token OAuth eBay et le cache du plan Gemini vivent en mémoire : à chaque *cold start* ils sont reconstruits (un appel token/Gemini de plus). Sans impact fonctionnel.
- **Marketplace Insights.** `/market/median` et `/market/evaluate` renvoient `503` tant qu'eBay n'a pas approuvé l'accès *Marketplace Insights* (ventes conclues). `/auctions` et `/item` marchent avec de simples clés production. Comportement identique en local et sur Vercel.
- **Neon + serverless.** Utilise bien la chaîne **pooled** pour `DATABASE_URL` (beaucoup de connexions courtes en serverless). La chaîne **directe** ne sert qu'aux migrations.
- **Secrets.** Ne commite jamais `.env` / `.env.local`. Tout se règle dans *Settings → Environment Variables* de chaque projet.
- **Redeploy après changement d'env.** Une variable modifiée n'est prise en compte qu'au prochain déploiement.

## Récapitulatif des variables

| Projet | Variable | Rôle |
|---|---|---|
| Flask | `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET` | auth API eBay |
| Flask | `EBAY_MARKETPLACE_ID`, `EBAY_CURRENCY` | marché & devise |
| Flask | `GEMINI_API_KEY`, `GEMINI_MODEL` | filtre de recherche + verdict IA |
| Flask | `CORS_ORIGINS` | autorise l'origine du Next.js |
| Next.js | `DATABASE_URL` | Neon pooled (runtime) |
| Next.js | `DIRECT_URL` | Neon direct (migrations/seed) |
| Next.js | `AUTH_SECRET` | signature des sessions |
| Next.js | `EBAY_API_URL` | URL publique du service Flask |

## Alternative

Si les flux SSE ou les *cold starts* Python te gênent, tu peux garder le **Next.js sur Vercel** et héberger le **Flask sur Render / Railway / Fly.io** (processus Python long, pas de limite de durée) : il suffit de pointer `EBAY_API_URL` vers cette URL. Le reste du tuto ne change pas.
