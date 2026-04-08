import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Kanban, 
  Workflow, 
  BarChart3, 
  Settings, 
  Moon, 
  Sun,
  Download,
  Upload,
  Plus,
  X
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import KanbanBoard from './pages/KanbanBoard';
import Workflows from './pages/Workflows';
import Statistics from './pages/Statistics';
import SettingsPage from './pages/Settings';
import { useStore } from './stores/useStore';


function App() {
  const location = useLocation();
  const { theme, setTheme, tasks, columns, workflows, fetchAllData, createTask } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    tags: '',
  });

  useEffect(() => {
    fetchAllData();
    const loadTheme = async () => {
      try {
        const savedTheme = await window.electronAPI.getTheme();
        setTheme(savedTheme);
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, [fetchAllData, setTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    try {
      await window.electronAPI.setTheme(newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  };

  const handleExport = async () => {
    try {
      const success = await window.electronAPI.exportData();
      if (success) {
        window.electronAPI.showNotification('Exportation réussie', 'Les données ont été exportées avec succès.');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
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
        const data = await window.electronAPI.importDataFromFile(result.filePaths[0]);
        if (data) {
          await window.electronAPI.importData(data);
          await fetchAllData();
          window.electronAPI.showNotification('Importation réussie', 'Les données ont été importées avec succès.');
        }
      }
    } catch (error) {
      console.error('Error importing data:', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    await createTask({
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      dueDate: newTask.dueDate || undefined,
      tags: newTask.tags.split(',').map((t) => t.trim()).filter(Boolean),
      status: columns[0]?.id || '',
      columnId: columns[0]?.id,
    });

    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      tags: '',
    });
    setShowNewTaskModal(false);
    window.electronAPI.showNotification('Tâche créée', `"${newTask.title}" a été créée avec succès.`);
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Tableau de board' },
    { path: '/kanban', icon: Kanban, label: 'Kanban' },
    { path: '/workflows', icon: Workflow, label: 'Workflows' },
    { path: '/statistics', icon: BarChart3, label: 'Statistiques' },
    { path: '/settings', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside 
        className={`
          ${sidebarOpen ? 'w-64' : 'w-16'} 
          bg-card border-r transition-all duration-300 flex flex-col
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-lg font-bold text-foreground">
              Workflow Manager
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-foreground hover:bg-muted'
                  }
                `}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="p-4 border-t space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            {sidebarOpen && <span>{theme === 'light' ? 'Mode sombre' : 'Mode clair'}</span>}
          </button>
          
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            <Download size={20} />
            {sidebarOpen && <span>Exporter</span>}
          </button>
          
          <button
            onClick={handleImport}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            <Upload size={20} />
            {sidebarOpen && <span>Importer</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {navItems.find(item => item.path === location.pathname)?.label}
            </h2>
            <p className="text-sm text-muted-foreground">
              {tasks.length} tâches • {columns.length} colonnes • {workflows.length} workflows
            </p>
          </div>
          
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Nouvelle tâche
          </button>
        </header>

        {/* Pages */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/kanban" element={<KanbanBoard />} />
              <Route path="/workflows" element={<Workflows />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>

      {/* Modal Nouvelle Tâche */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Nouvelle tâche</h2>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Titre de la tâche"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                  placeholder="Description de la tâche"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Priorité
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Étiquettes (séparées par des virgules)
                </label>
                <input
                  type="text"
                  value={newTask.tags}
                  onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;