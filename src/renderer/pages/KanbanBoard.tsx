import { useState, useEffect } from 'react';
import { useStore } from '../stores/useStore';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { 
  Plus, 
  MoreVertical, 
  Calendar, 
  Tag, 
  Trash2, 
  Edit,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function KanbanBoard() {
  const { 
    tasks, 
    columns, 
    loading, 
    updateTask, 
    deleteTask, 
    createTask,
    reorderColumns 
  } = useStore();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<any>(null);

  // Trier les colonnes par ordre
  const sortedColumns = [...columns].sort((a, b) => (a.order ?? a.order_index ?? 0) - (b.order ?? b.order_index ?? 0));

  // Grouper les tâches par colonne
  const getTasksByColumn = (columnId: string) => {
    return tasks.filter(task => task.columnId === columnId);
  };

  // Gérer le drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Si pas de destination, on annule
    if (!destination) return;

    // Si la tâche est déposée au même endroit
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Trouver la tâche
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Si la colonne de destination est différente
    if (destination.droppableId !== source.droppableId) {
      await updateTask(draggableId, {
        columnId: destination.droppableId,
        status: destination.droppableId, // On utilise l'ID de colonne comme status
      });
    }

    // TODO: Réorganiser l'ordre des tâches dans la colonne
  };

  // Gérer la création d'une nouvelle tâche
  const handleCreateTask = async (taskData: any) => {
    const column = columns.find(c => c.id === selectedColumn);
    await createTask({
      ...taskData,
      columnId: selectedColumn,
      status: selectedColumn || '',
    });
    setShowTaskModal(false);
    setSelectedColumn(null);
  };

  // Gérer la suppression d'une tâche
  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      await deleteTask(taskId);
    }
  };

  // Obtenir la couleur de priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 h-full">
          {sortedColumns.map((column) => {
            const columnTasks = getTasksByColumn(column.id);
            
            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-80 flex flex-col bg-muted/30 rounded-lg"
              >
                {/* En-tête de colonne */}
                <div 
                  className="p-3 border-b flex items-center justify-between"
                  style={{ 
                    borderTop: `4px solid ${column.color || '#6366f1'}` 
                  }}
                >
                  <div className="flex items-center gap-2">
                    {column.color && (
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: column.color }}
                      />
                    )}
                    <h3 className="font-semibold text-foreground">
                      {column.title}
                    </h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedColumn(column.id);
                      setEditingTask(null);
                      setShowTaskModal(true);
                    }}
                    className="p-1 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Liste des tâches */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto p-2 space-y-2 min-h-0 ${
                        snapshot.isDraggingOver ? 'bg-muted/50' : ''
                      }`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                bg-card rounded-lg p-3 shadow-sm border
                                ${snapshot.isDragging ? 'shadow-lg rotate-2' : ''}
                                hover:shadow-md transition-all
                              `}
                              style={{
                                ...provided.draggableProps.style,
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-medium text-foreground text-sm flex-1">
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setEditingTask(task)}
                                    className="p-1 hover:bg-muted rounded transition-colors"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="p-1 hover:bg-red-100 text-red-500 rounded transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              {task.description && (
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              <div className="flex items-center gap-2 mt-3 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                                  {getPriorityLabel(task.priority)}
                                </span>

                                {task.dueDate && (
                                  <span className={`text-xs flex items-center gap-1 ${
                                    isPast(parseISO(task.dueDate)) ? 'text-red-500' : 'text-muted-foreground'
                                  }`}>
                                    <Clock size={12} />
                                    {format(parseISO(task.dueDate), 'dd MMM', { locale: fr })}
                                  </span>
                                )}

                                {task.tags && Array.isArray(task.tags) && task.tags.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Tag size={12} className="text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {task.tags.length}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modal de création/édition de tâche */}
      {showTaskModal && (
        <TaskModal
          column={columns.find(c => c.id === selectedColumn)}
          task={editingTask}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSave={handleCreateTask}
        />
      )}
    </div>
  );
}

// Composant Modal pour les tâches
function TaskModal({ column, task, onClose, onSave }: any) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate ? format(parseISO(task.dueDate), 'yyyy-MM-dd') : '');
  const [tags, setTags] = useState(task?.tags?.join(', ') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      title,
      description,
      priority,
      dueDate: dueDate || undefined,
      tags: tags.split(',').map((t: string) => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">
            {task ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Titre *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
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
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Étiquettes (séparées par des virgules)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {task ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}