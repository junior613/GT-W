import { useEffect, useState } from 'react';
import { useStore } from '../stores/useStore';
import PageTransition from '../components/PageTransition';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Statistics() {
  const { tasks, columns, statistics, loading, fetchStatistics } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'trends'>('overview');

  useEffect(() => {
    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Urgent';
      case 'medium': return 'Moyen';
      case 'low': return 'Faible';
      default: return priority;
    }
  };

  // Calculer les tâches par jour pour les 7 derniers jours
  const getTasksByDay = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const createdCount = tasks.filter(t => 
        format(parseISO(t.createdAt), 'yyyy-MM-dd') === dateStr
      ).length;
      
      const completedCount = tasks.filter(t => 
        t.status === 'done' && format(parseISO(t.updatedAt), 'yyyy-MM-dd') === dateStr
      ).length;
      
      days.push({
        date: format(date, 'EEE dd', { locale: fr }),
        created: createdCount,
        completed: completedCount,
      });
    }
    return days;
  };

  const tasksByDay = getTasksByDay();
  const maxTasks = Math.max(...tasksByDay.map(d => Math.max(d.created, d.completed)), 1);

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Onglets */}
      <div className="flex border-b">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
          { id: 'tasks', label: 'Détail des tâches', icon: PieChart },
          { id: 'trends', label: 'Tendances', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Vue d'ensemble */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total des tâches</p>
                  <p className="text-3xl font-bold text-foreground">{statistics?.total || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tâches terminées</p>
                  <p className="text-3xl font-bold text-foreground">{statistics?.completed || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {statistics?.total ? Math.round((statistics.completed / statistics.total) * 100) : 0}% de complétion
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">En attente</p>
                  <p className="text-3xl font-bold text-foreground">{statistics?.pending || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">En retard</p>
                  <p className="text-3xl font-bold text-red-500">{statistics?.overdue || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Répartition par priorité */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Par priorité</h3>
              <div className="space-y-4">
                {[
                  { priority: 'high', label: 'Urgent' },
                  { priority: 'medium', label: 'Moyen' },
                  { priority: 'low', label: 'Faible' },
                ].map((item) => {
                  const data = statistics?.byPriority?.find(p => p.priority === item.priority);
                  const count = data?.count || 0;
                  const percentage = statistics?.total ? (count / statistics.total * 100) : 0;
                  
                  return (
                    <div key={item.priority}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(item.priority)}`} />
                          <span className="text-sm text-foreground">{item.label}</span>
                        </div>
                        <span className="text-sm font-medium">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${getPriorityColor(item.priority)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Par colonne</h3>
              <div className="space-y-4">
                {statistics?.byColumn?.map((item, index) => {
                  const percentage = statistics?.total ? (item.count / statistics.total * 100) : 0;
                  const column = columns.find(c => c.title === item.title);
                  
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {column?.color && (
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
                          )}
                          <span className="text-sm text-foreground">{item.title}</span>
                        </div>
                        <span className="text-sm font-medium">{item.count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className="h-3 rounded-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Détail des tâches */}
      {activeTab === 'tasks' && (
        <div className="bg-card rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-foreground">Liste des tâches</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Titre</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Priorité</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date d'échéance</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Étiquettes</th>
                </tr>
              </thead>
              <tbody>
                {tasks.slice(0, 20).map((task) => (
                  <tr key={task.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm text-foreground">{task.title}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        {columns.find(c => c.id === task.columnId)?.title || 'Aucun'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {task.dueDate ? format(parseISO(task.dueDate), 'dd MMM yyyy', { locale: fr }) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {Array.isArray(task.tags) && task.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {tag}
                          </span>
                        ))}
                        {Array.isArray(task.tags) && task.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{task.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tasks.length > 20 && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Affichage de 20 tâches sur {tasks.length}
            </div>
          )}
        </div>
      )}

      {/* Tendances */}
      {activeTab === 'trends' && (
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Activité des 7 derniers jours</h3>
          
          <div className="space-y-4">
            {tasksByDay.map((day, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground w-24">{day.date}</span>
                  <div className="flex-1 mx-4 flex gap-1 h-8">
                    <div 
                      className="bg-primary/70 rounded-r-sm transition-all"
                      style={{ width: `${(day.created / maxTasks) * 100}%`, minWidth: day.created > 0 ? '4px' : '0' }}
                    />
                    <div 
                      className="bg-green-500 rounded-r-sm transition-all"
                      style={{ width: `${(day.completed / maxTasks) * 100}%`, minWidth: day.completed > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-20 text-right">
                    {day.created} créées, {day.completed} terminées
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary/70 rounded" />
              <span className="text-sm text-muted-foreground">Créées</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span className="text-sm text-muted-foreground">Terminées</span>
            </div>
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
}
