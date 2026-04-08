# Workflow Manager - Version Streamlit

Application de gestion de tâches et workflows convertie de Electron/React vers Streamlit (Python).

## 🚀 Installation et Lancement

### Méthode facile (recommandée)

1. **Double-cliquez sur `run.bat`** dans l'explorateur de fichiers
2. L'application va :
   - Vérifier que Python est installé
   - Créer un environnement virtuel
   - Installer les dépendances
   - Lancer l'application dans votre navigateur

### Méthode manuelle

```bash
# 1. Installer Python (3.8 ou supérieur)
# Téléchargez depuis https://www.python.org/downloads/

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Lancer l'application
streamlit run app.py
```

## 📋 Fonctionnalités

### ✅ Toutes les fonctionnalités de la version Electron sont conservées :

- **Tableau de board** - Vue d'ensemble avec statistiques
- **Tableau Kanban** - Gestion visuelle des tâches par colonnes
- **Workflows** - Automatisation des tâches avec déclencheurs et actions
- **Statistiques** - Graphiques et analyses des performances
- **Paramètres** - Thème, export/import, réinitialisation

### 🎯 Avantages de la version Streamlit

- **Pas de compilation** - Python pur, modification immédiate
- **Installation simple** - Juste `pip install`
- **Multiplateforme** - Windows, Mac, Linux
- **Base de données SQLite** - Incluse dans Python
- **Interface web** - Accessible depuis n'importe quel navigateur
- **Pas de problèmes de version** - Compatible avec toutes les versions de Node.js

## 🗂️ Structure des fichiers

```
Workflow/
├── app.py                 # Application Streamlit principale
├── database.py           # Gestion de la base de données SQLite
├── requirements.txt      # Dépendances Python
├── run.bat              # Script de lancement (Windows)
├── workflow_manager.db  # Base de données (créée automatiquement)
└── README_STREAMLIT.md  # Ce fichier
```

## 🎨 Utilisation

### 1. Tableau de board
- Vue d'ensemble des statistiques
- Tâches récentes
- Répartition par colonne et priorité

### 2. Tableau Kanban
- Colonnes personnalisables (À faire, En cours, En révision, Terminé)
- Glisser-déposer simplifié avec sélecteurs
- Création rapide de tâches
- Indicateurs de priorité et d'échéance

### 3. Workflows
- Création de workflows automatisés
- Déclencheurs : création/mise à jour/complétion de tâche, ou planifié (cron)
- Actions : déplacer, changer priorité, ajouter étiquette, notification, créer tâche

### 4. Statistiques
- Graphiques interactifs
- Tendances sur 7 jours
- Liste détaillée des tâches

### 5. Paramètres
- Thème clair/sombre
- Export des données en JSON
- Import depuis un fichier JSON
- Réinitialisation complète

## 💾 Base de données

La base de données SQLite (`workflow_manager.db`) est créée automatiquement au premier lancement.

### Tables :
- **tasks** - Tâches avec titre, description, priorité, échéance, etc.
- **columns** - Colonnes du tableau Kanban
- **workflows** - Workflows d'automatisation
- **settings** - Paramètres (thème, etc.)

### Sauvegarde et restauration :
- **Exporter** : Télécharge un fichier JSON avec toutes les données
- **Importer** : Restaure les données depuis un fichier JSON

## 🔧 Personnalisation

### Ajouter des colonnes personnalisées
1. Allez dans la page Kanban
2. Les colonnes par défaut sont : À faire, En cours, En révision, Terminé
3. Pour modifier l'ordre ou les couleurs, vous pouvez modifier directement la base de données

### Modifier le thème
1. Allez dans Paramètres
2. Choisissez "Clair" ou "Sombre"
3. Le changement est appliqué immédiatement

## 🐛 Dépannage

### L'application ne se lance pas
1. Vérifiez que Python est installé : `python --version`
2. Vérifiez que pip est disponible : `pip --version`
3. Réinstallez les dépendances : `pip install -r requirements.txt --force-reinstall`

### Erreur de port déjà utilisé
Modifiez le port dans `run.bat` :
```batch
streamlit run app.py --server.headless true --server.port 8502
```

### Données corrompues
1. Exportez vos données (Paramètres → Exporter)
2. Réinitialisez la base de données (Paramètres → Réinitialiser)
3. Importez vos données (Paramètres → Importer)

## 📝 Notes

- L'application fonctionne en local sur votre ordinateur
- Les données sont stockées dans `workflow_manager.db`
- Pour arrêter l'application, fermez la fenêtre du terminal ou appuyez sur `Ctrl+C`
- L'application est accessible à l'adresse : `http://localhost:8501`

## 🔄 Migration depuis la version Electron

Si vous aviez des données dans l'ancienne version Electron :

1. Exportez les données depuis l'application Electron (si possible)
2. Sauvegardez le fichier JSON exporté
3. Lancez la version Streamlit
4. Importez le fichier JSON dans Paramètres → Importer

## 📄 Licence

Cette application est fournie telle quelle pour un usage personnel.

---

**Développé avec ❤️ en Streamlit**