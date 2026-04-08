# Workflow Manager

Application desktop de gestion automatique des tâches et workflows, développée avec Electron, React, TypeScript et SQLite.

## 🚀 Fonctionnalités

### Gestion des tâches
- **Tableau Kanban** avec drag & drop fluide
- **Priorités** (Urgent, Moyen, Faible)
- **Dates d'échéance** avec alertes de retard
- **Étiquettes** personnalisables
- **Recherche et filtres**

### Workflows automatisés
- **Déclencheurs multiples** :
  - À la création d'une tâche
  - À la mise à jour d'une tâche
  - À la complétion d'une tâche
  - Planifié (expression cron)
- **Conditions** personnalisables
- **Actions automatiques** :
  - Déplacer une tâche
  - Changer la priorité
  - Ajouter une étiquette
  - Envoyer une notification
  - Créer une nouvelle tâche

### Interface moderne
- **Mode clair/sombre**
- **Design responsive**
- **Notifications desktop** natives
- **Interface intuitive** en français

### Données et sauvegarde
- **Export JSON** des données
- **Import** de sauvegardes
- **Base de données locale** SQLite
- **Pas de cloud** - confidentialité totale

### Statistiques
- **Tableau de board** complet
- **Graphiques** de productivité
- **Suivi des tendances**
- **Répartition** par priorité et statut

## 🛠️ Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Windows, macOS ou Linux

### Étapes d'installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Lancer en mode développement**
```bash
npm run electron:dev
```

3. **Construire pour la production**
```bash
npm run electron:build
```

Les installateurs seront créés dans le dossier `release/` :
- Windows : `Workflow Manager Setup.exe`
- macOS : `Workflow Manager.dmg`
- Linux : `Workflow Manager.AppImage`

## 📁 Structure du projet

```
workflow-manager/
├── src/
│   ├── main/                    # Processus principal Electron
│   │   ├── main.ts             # Point d'entrée
│   │   ├── preload.ts          # Script de préchargement
│   │   ├── database.ts         # Configuration SQLite
│   │   └── ipc.ts              # Handlers IPC
│   └── renderer/               # Interface React
│       ├── pages/              # Pages de l'application
│       │   ├── Dashboard.tsx
│       │   ├── KanbanBoard.tsx
│       │   ├── Workflows.tsx
│       │   ├── Statistics.tsx
│       │   └── Settings.tsx
│       ├── stores/             # State management (Zustand)
│       ├── components/         # Composants réutilisables
│       └── App.tsx             # Composant principal
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── electron-builder.json
```

## 💡 Utilisation

### Créer une tâche
1. Cliquez sur "Nouvelle tâche" dans l'en-tête
2. Remplissez le formulaire (titre, description, priorité, etc.)
3. La tâche apparaît dans la colonne sélectionnée

### Utiliser le Kanban
- **Glisser-déposer** les tâches entre colonnes
- **Cliquez** sur une tâche pour la modifier
- **Icône poubelle** pour supprimer

### Configurer un workflow
1. Allez dans l'onglet "Workflows"
2. Cliquez sur "Nouveau workflow"
3. Définissez :
   - Nom du workflow
   - Déclencheur (événement ou planification)
   - Conditions (optionnel)
   - Actions à exécuter
4. Activez le workflow

### Exemples de workflows

**Workflow 1 : Notification automatique**
- Déclencheur : Tâche créée
- Condition : Priorité = Urgent
- Action : Envoyer notification

**Workflow 2 : Organisation automatique**
- Déclencheur : Tâche terminée
- Action : Déplacer vers colonne "Terminé"

**Workflow 3 : Tâche récurrente**
- Déclencheur : Planifié (0 9 * * 1 = tous les lundis 9h)
- Action : Créer tâche "Réunion hebdomadaire"

## 🔧 Technologies utilisées

- **Electron** : Framework desktop
- **React 18** : Interface utilisateur
- **TypeScript** : Typage statique
- **Vite** : Build tool rapide
- **Tailwind CSS** : Styles utilitaires
- **SQLite** : Base de données locale
- **Zustand** : State management
- **React Beautiful DnD** : Drag & drop
- **Lucide React** : Icônes modernes
- **date-fns** : Gestion des dates

## 📝 Notes de développement

### Dépendances principales
```json
{
  "electron": "^29.1.4",
  "react": "^18.2.0",
  "better-sqlite3": "^9.4.3",
  "zustand": "^4.5.2",
  "tailwindcss": "^3.4.1"
}
```

### Scripts disponibles
- `npm run dev` : Lance Vite en mode développement
- `npm run build` : Build React pour la production
- `npm run electron:dev` : Lance l'app Electron en dev
- `npm run electron:build` : Build l'app Electron
- `npm run type-check` : Vérifie les types TypeScript

## 🐛 Résolution de problèmes

### L'application ne se lance pas
1. Vérifiez que Node.js est installé : `node --version`
2. Réinstallez les dépendances : `npm ci`
3. Nettoyez le cache : `npm run build`

### Erreurs de base de données
- Supprimez le fichier de base de données : `~/.config/workflow-manager/workflow_manager.db`
- L'application recréera une nouvelle base au démarrage

### Problèmes de build Electron
- Assurez-vous d'avoir les permissions nécessaires
- Sur Linux, installez : `sudo apt install fakeroot dpkg`

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche de fonctionnalité
3. Soumettre une pull request

## 📞 Support

Pour toute question ou problème :
- Ouvrez une issue GitHub
- Consultez la documentation
- Vérifiez les issues existantes

---

**Développé avec ❤️ par Newbee dev**