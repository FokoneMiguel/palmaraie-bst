# Palmaraie BST - Application de Gestion de Plantation

Application web de gestion de plantation de palmiers à huile, développée avec Django et React.

## Fonctionnalités

- Gestion des plantations
- Suivi des opérations
- Gestion des productions
- Gestion des ventes
- Suivi de la trésorerie
- Tableaux de bord et statistiques

## Technologies utilisées

### Backend
- Django 5.0.2
- Django REST Framework
- PostgreSQL
- Gunicorn

### Frontend
- React
- TypeScript
- Material-UI
- Chart.js

## Installation

### Prérequis
- Python 3.8+
- Node.js 14+
- PostgreSQL

### Backend
```bash
# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# Appliquer les migrations
python manage.py migrate

# Lancer le serveur
python manage.py runserver
```

### Frontend
```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm start
```

## Déploiement

Le projet est configuré pour être déployé sur Render.com :

1. Backend (Web Service)
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn palmier.wsgi:application`

2. Frontend (Static Site)
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/build`

3. Base de données (PostgreSQL)

## Configuration des variables d'environnement

### Backend (.env)
```
DEBUG=False
SECRET_KEY=votre_clé_secrète
ALLOWED_HOSTS=.onrender.com
DATABASE_URL=votre_url_de_base_de_données
CORS_ALLOWED_ORIGINS=https://votre-app-frontend.onrender.com
```

### Frontend (.env)
```
REACT_APP_API_URL=https://votre-app-backend.onrender.com/api
```

## Licence

MIT 