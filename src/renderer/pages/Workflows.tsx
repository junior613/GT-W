import { useState } from 'react';
import { useStore } from '../stores/useStore';
import PageTransition from '../components/PageTransition';
import { 
  Plus, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  Edit,
  Clock,
  Zap,
  Filter,
  ArrowRight
} from 'lucide-react';

export default function Workflows() {
  const { workflows, columns, createWorkflow, updateWorkflow, deleteWorkflow, toggleWorkflow, loading } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      time: 'Planifié',
      taskCreated: 'Tâche créée',
      taskUpdated: 'Tâche mise à jour',
      taskCompleted: 'Tâche terminée',
      date: 'Date spécifique',
    };
    return labels[type] || type;
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'time': return Clock;
      case 'taskCreated': 
      case 'taskUpdated': 
      case 'taskCompleted': return Zap;
      default: return Clock;
    }
  };

  const getActionsCount = (actions: any[]) => {
    const labels: Record<string, string> = {
      moveTask: 'Déplacer',
      changePriority: 'Priorité',
      addTag: 'Étiquette',
      sendNotification: 'Notification',
      createTask: 'Créer tâche',
    };
    return actions.map((a: any) => labels[a.type] || a.type).join(', ');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce workflow ?')) {
      await deleteWorkflow(id);
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
    <PageTransition>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground">
            {workflows.filter(w => w.enabled).length} workflows actifs sur {workflows.length}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingWorkflow(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Nouveau workflow
        </button>
      </div>

      {workflows.length === 0 ? (
        <div className="bg-card rounded-lg shadow-sm border p-12 text-center">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Aucun workflow
          </h3>
          <p className="text-muted-foreground mb-6">
            Créez votre premier workflow pour automatiser vos tâches
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Créer un workflow
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {workflows.map((workflow) => {
            const TriggerIcon = getTriggerIcon(workflow.trigger?.type || 'time');
            
            return (
              <div
                key={workflow.id}
                className="bg-card rounded-lg shadow-sm border p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {workflow.name}
                      </h3>
                      {workflow.enabled ? (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                          Actif
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 rounded-full">
                          Inactif
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <TriggerIcon size={16} />
                        <span>Déclencheur: {getTriggerLabel(workflow.trigger?.type || 'time')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ArrowRight size={16} />
                        <span>Actions: {getActionsCount(workflow.actions || [])}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleWorkflow(workflow.id, !workflow.enabled)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      {workflow.enabled ? (
                        <ToggleRight size={24} className="text-green-500" />
                      ) : (
                        <ToggleLeft size={24} className="text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingWorkflow(workflow);
                        setShowModal(true);
                      }}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(workflow.id)}
                      className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <WorkflowModal
          workflow={editingWorkflow}
          columns={columns}
          onClose={() => {
            setShowModal(false);
            setEditingWorkflow(null);
          }}
          onSave={async (data: any) => {
            if (editingWorkflow) {
              await updateWorkflow(editingWorkflow.id, data);
            } else {
              await createWorkflow(data);
            }
            setShowModal(false);
            setEditingWorkflow(null);
          }}
        />
      )}
    </div>
    </PageTransition>
  );
}

// Modal pour créer/éditer un workflow
function WorkflowModal({ workflow, columns, onClose, onSave }: any) {
  const [name, setName] = useState(workflow?.name || '');
  const [triggerType, setTriggerType] = useState(workflow?.trigger?.type || 'taskCreated');
  const [triggerValue, setTriggerValue] = useState(workflow?.trigger?.value || '');
  const [actions, setActions] = useState(workflow?.actions || []);
  const [enabled, setEnabled] = useState(workflow?.enabled !== false);

  const addAction = () => {
    setActions([...actions, { type: 'moveTask', params: {} }]);
  };

  const updateAction = (index: number, field: string, value: any) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setActions(newActions);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_: any, i: number) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      trigger: { type: triggerType, value: triggerValue },
      actions,
      enabled,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">
            {workflow ? 'Modifier le workflow' : 'Nouveau workflow'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nom du workflow *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Déplacer automatiquement les tâches urgentes"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Déclencheur
            </label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="taskCreated">Tâche créée</option>
              <option value="taskUpdated">Tâche mise à jour</option>
              <option value="taskCompleted">Tâche terminée</option>
              <option value="time">Planifié (cron)</option>
            </select>
          </div>

          {triggerType === 'time' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Expression cron
              </label>
              <input
                type="text"
                value={triggerValue}
                onChange={(e) => setTriggerValue(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: 0 9 * * 1 (Tous les lundis à 9h)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: minute heure jour mois jourSemaine
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">
                Actions
              </label>
              <button
                type="button"
                onClick={addAction}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Ajouter
              </button>
            </div>

            {actions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Aucune action configurée
              </p>
            ) : (
              <div className="space-y-4">
                {actions.map((action: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Action {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeAction(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                          Type d'action
                        </label>
                        <select
                          value={action.type}
                          onChange={(e) => updateAction(index, 'type', e.target.value)}
                          className="w-full px-2 py-1.5 border rounded bg-background text-foreground text-sm"
                        >
                          <option value="moveTask">Déplacer la tâche</option>
                          <option value="changePriority">Changer la priorité</option>
                          <option value="addTag">Ajouter une étiquette</option>
                          <option value="sendNotification">Envoyer une notification</option>
                          <option value="createTask">Créer une nouvelle tâche</option>
                        </select>
                      </div>

                      {action.type === 'moveTask' && (
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">
                            Colonne de destination
                          </label>
                          <select
                            value={action.params.columnId || ''}
                            onChange={(e) => updateAction(index, 'params', { ...action.params, columnId: e.target.value })}
                            className="w-full px-2 py-1.5 border rounded bg-background text-foreground text-sm"
                          >
                            <option value="">Sélectionner une colonne</option>
                            {columns.map((col: any) => (
                              <option key={col.id} value={col.id}>{col.title}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {action.type === 'changePriority' && (
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">
                            Priorité
                          </label>
                          <select
                            value={action.params.priority || 'medium'}
                            onChange={(e) => updateAction(index, 'params', { ...action.params, priority: e.target.value })}
                            className="w-full px-2 py-1.5 border rounded bg-background text-foreground text-sm"
                          >
                            <option value="low">Faible</option>
                            <option value="medium">Moyenne</option>
                            <option value="high">Urgente</option>
                          </select>
                        </div>
                      )}

                      {action.type === 'addTag' && (
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">
                            Étiquette
                          </label>
                          <input
                            type="text"
                            value={action.params.tag || ''}
                            onChange={(e) => updateAction(index, 'params', { ...action.params, tag: e.target.value })}
                            className="w-full px-2 py-1.5 border rounded bg-background text-foreground text-sm"
                            placeholder="Nom de l'étiquette"
                          />
                        </div>
                      )}

                      {action.type === 'sendNotification' && (
                        <>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                              Titre
                            </label>
                            <input
                              type="text"
                              value={action.params.title || ''}
                              onChange={(e) => updateAction(index, 'params', { ...action.params, title: e.target.value })}
                              className="w-full px-2 py-1.5 border rounded bg-background text-foreground text-sm"
                              placeholder="Titre de la notification"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                              Message
                            </label>
                            <input
                              type="text"
                              value={action.params.body || ''}
                              onChange={(e) => updateAction(index, 'params', { ...action.params, body: e.target.value })}
                              className="w-full px-2 py-1.5 border rounded bg-background text-foreground text-sm"
                              placeholder="Message de la notification"
                            />
                          </div>
                        </>
                      )}

                      {action.type === 'createTask' && (
                        <>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                              Titre de la tâche
                            </label>
                            <input
                              type="text"
                              value={action.params.title || ''}
                              onChange={(e) => updateAction(index, 'params', { ...action.params, title: e.target.value })}
                              className="w-full px-2 py-1.5 border rounded bg-background text-foreground text-sm"
                              placeholder="Titre"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                              Colonne
                            </label>
                            <select
                              value={action.params.columnId || ''}
                              onChange={(e) => updateAction(index, 'params', { ...action.params, columnId: e.target.value })}
                              className="w-full px-2 py-1.5 border rounded bg-background text-foreground text-sm"
                            >
                              <option value="">Sélectionner une colonne</option>
                              {columns.map((col: any) => (
                                <option key={col.id} value={col.id}>{col.title}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="enabled" className="text-sm text-foreground">
              Activer ce workflow immédiatement
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
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
              {workflow ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}