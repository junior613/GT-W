import { contextBridge, ipcRenderer } from 'electron';

// Types pour les tâches
export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Types pour les colonnes
export interface Column {
  id: string;
  title: string;
  order: number;
  color?: string;
}

// Types pour les workflows
export interface Workflow {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  createdAt: string;
}

export interface WorkflowTrigger {
  type: 'date' | 'time' | 'taskCreated' | 'taskUpdated' | 'taskCompleted';
  value?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string;
}

export interface WorkflowAction {
  type: 'moveTask' | 'changePriority' | 'addTag' | 'sendNotification' | 'createTask';
  params: Record<string, any>;
}

// Exposition des méthodes IPC au renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Tâches
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  getTask: (id: string) => ipcRenderer.invoke('get-task', id),
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => 
    ipcRenderer.invoke('create-task', task),
  updateTask: (id: string, task: Partial<Task>) => 
    ipcRenderer.invoke('update-task', id, task),
  deleteTask: (id: string) => ipcRenderer.invoke('delete-task', id),

  // Colonnes
  getColumns: () => ipcRenderer.invoke('get-columns'),
  createColumn: (column: Omit<Column, 'id'>) => 
    ipcRenderer.invoke('create-column', column),
  updateColumn: (id: string, column: Partial<Column>) => 
    ipcRenderer.invoke('update-column', id, column),
  deleteColumn: (id: string) => ipcRenderer.invoke('delete-column', id),
  reorderColumns: (columnOrders: { id: string; order: number }[]) => 
    ipcRenderer.invoke('reorder-columns', columnOrders),

  // Workflows
  getWorkflows: () => ipcRenderer.invoke('get-workflows'),
  getWorkflow: (id: string) => ipcRenderer.invoke('get-workflow', id),
  createWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt'>) => 
    ipcRenderer.invoke('create-workflow', workflow),
  updateWorkflow: (id: string, workflow: Partial<Workflow>) => 
    ipcRenderer.invoke('update-workflow', id, workflow),
  deleteWorkflow: (id: string) => ipcRenderer.invoke('delete-workflow', id),
  toggleWorkflow: (id: string, enabled: boolean) => 
    ipcRenderer.invoke('toggle-workflow', id, enabled),

  // Statistiques
  getStatistics: () => ipcRenderer.invoke('get-statistics'),

  // Notifications
  showNotification: (title: string, body: string) => 
    ipcRenderer.invoke('show-notification', { title, body }),

  // Fichiers
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: (data: any) => ipcRenderer.invoke('import-data', data),
  importDataFromFile: (filePath: string) => ipcRenderer.invoke('import-data-from-file', filePath),
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Thème
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme: 'light' | 'dark') => ipcRenderer.invoke('set-theme', theme),
});