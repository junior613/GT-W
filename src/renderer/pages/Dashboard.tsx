import { useEffect, useState } from 'react';
import { useStore } from '../stores/useStore';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Calendar,
  Tag,
  ArrowRight
} from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Dashboard() {
  const { tasks, columns, statistics, loading } = useStore();
  const [recentTasks, setRecentTasks] = useState<any[]>([]);

  useEffect(() => {
    // Trier les tâches par date de création (plus récentes en premier)
    const sorted = [...tasks].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setRecentTasks(sorted.slice(0, 5));
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getColumnTitle = (columnId?: string) => {
    const column = columns.find(c => c.id === columnId);
    return column?.title || 'Aucune';
  };

  const getStatsCards = () => [
    {
      title: 'Total des tâches',
      value: statistics?.total || 0,
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Tâches terminées',
      value: statistics?.completed || 0,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'En attente',
      value: statistics?.pending || 0,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    {
      title: 'En retard',
      value: statistics?.overdue || 0,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getStatsCards().map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-card rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tâches récentes */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Tâches récentes
            </h3>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={14} />
            </button>
          </div>
          
          {recentTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune tâche pour le moment
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'high' ? 'Urgent' : task.priority === 'medium' ? 'Moyen' : 'Faible'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getColumnTitle(task.columnId)}
                      </span>
                      {task.dueDate && (
                        <span className={`text-xs flex items-center gap-1 ${
                          isPast(parseISO(task.dueDate)) && task.status !== 'done'
                            ? 'text-red-500'
                            : 'text-muted-foreground'
                        }`}>
                          <Calendar size={12} />
                          {format(parseISO(task.dueDate), 'dd MMM', { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Répartition par colonne */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Répartition par colonne
          </h3>
          
          {statistics?.byColumn && statistics.byColumn.length > 0 ? (
            <div className="space-y-4">
              {statistics.byColumn.map((item, index) => {
                const percentage = statistics.total > 0 
                  ? (item.count / statistics.total * 100) 
                  : 0;
                const column = columns.find(c => c.title === item.title);
                
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {column?.color && (
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: column.color }}
                          />
                        )}
                        <span className="text-sm text-foreground">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {item.count}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </div>

      {/* Tâches par priorité */}
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Tâches par priorité
        </h3>
        
        {statistics?.byPriority && statistics.byPriority.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { priority: 'high', label: 'Urgent', color: 'red' },
              { priority: 'medium', label: 'Moyen', color: 'yellow' },
              { priority: 'low', label: 'Faible', color: 'green' },
            ].map((item) => {
              const data = statistics.byPriority.find(p => p.priority === item.priority);
              const count = data?.count || 0;
              const percentage = statistics.total > 0 
                ? (count / statistics.total * 100) 
                : 0;
              
              return (
                <div
                  key={item.priority}
                  className={`p-4 rounded-lg border-l-4 ${
                    item.color === 'red' 
                      ? 'border-red-500 bg-red-50 dark:bg-red-950' 
                      : item.color === 'yellow'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                      : 'border-green-500 bg-green-50 dark:bg-green-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      item.color === 'red' 
                        ? 'text-red-700 dark:text-red-300' 
                        : item.color === 'yellow'
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : 'text-green-700 dark:text-green-300'
                    }`}>
                      {item.label}
                    </span>
                    <span className="text-2xl font-bold text-foreground">
                      {count}
                    </span>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        item.color === 'red' ? 'bg-red-500' : 
                        item.color === 'yellow' ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs mt-2 text-muted-foreground">
                    {percentage.toFixed(1)}% du total
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Aucune donnée disponible
          </div>
        )}
      </div>
    </div>
  );
}