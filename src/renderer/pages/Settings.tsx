import { useState } from 'react';
import { useStore } from '../stores/useStore';
import { 
  Moon, 
  Sun, 
  Monitor,
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Info
} from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme, exportData, importData, tasks, columns, workflows, fetchAllData } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportData();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await window.electronAPI.showOpenDialog({
        title: 'Importer les données',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile'],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        setIsImporting(true);
        // Use IPC to read the file instead of require('fs')
        const data = await window.electronAPI.importDataFromFile(result.filePaths[0]);
        if (data) {
          await importData(data);
          await fetchAllData();
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.')) {
      // Réinitialiser la base de données
      // Cette fonctionnalité nécessiterait un handler IPC supplémentaire
      alert('Fonctionnalité de réinitialisation à implémenter');
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'system', label: 'Système', icon: Monitor },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Apparence */}
      <section className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-muted">
            <Monitor size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Apparence</h2>
            <p className="text-sm text-muted-foreground">Personnalisez l'apparence de l'application</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Thème
            </label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => option.value !== 'system' && setTheme(option.value as 'light' | 'dark')}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                      ${theme === option.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-transparent hover:border-muted-foreground/20'
                      }
                      ${option.value === 'system' ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    disabled={option.value === 'system'}
                  >
                    <Icon size={24} className={theme === option.value ? 'text-primary' : 'text-muted-foreground'} />
                    <span className="text-sm">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Données */}
      <section className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-muted">
            <Database size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Données</h2>
            <p className="text-sm text-muted-foreground">Gérez vos données et sauvegardes</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Tâches</p>
              <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Colonnes</p>
              <p className="text-2xl font-bold text-foreground">{columns.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Workflows</p>
              <p className="text-2xl font-bold text-foreground">{workflows.length}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              Exporter les données
            </button>

            <button
              onClick={handleImport}
              disabled={isImporting}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              {isImporting ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Upload size={18} />
              )}
              Importer les données
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              <Trash2 size={18} />
              Réinitialiser
            </button>
          </div>
        </div>
      </section>

      {/* Informations */}
      <section className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-muted">
            <Info size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Informations</h2>
            <p className="text-sm text-muted-foreground">À propos de l'application</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm text-foreground">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Framework</span>
            <span className="text-sm text-foreground">Electron 29.1.4</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Frontend</span>
            <span className="text-sm text-foreground">React 18 + TypeScript</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Base de données</span>
            <span className="text-sm text-foreground">SQLite</span>
          </div>
        </div>
      </section>
    </div>
  );
}