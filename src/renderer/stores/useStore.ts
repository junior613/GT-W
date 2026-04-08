import { create } from 'zustand';

// Types
export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags: string[];
  columnId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  order?: number;
  order_index?: number;
  color?: string;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: {
    type: 'date' | 'time' | 'taskCreated' | 'taskUpdated' | 'taskCompleted';
    value?: string;
  };
  conditions: Array<{
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: string;
  }>;
  actions: Array<{
    type: 'moveTask' | 'changePriority' | 'addTag' | 'sendNotification' | 'createTask';
    params: Record<string, any>;
  }>;
  enabled: boolean;
  createdAt: string;
}

export interface Statistics {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  byPriority: Array<{ priority: string; count: number }>;
  byColumn: Array<{ title: string; count: number }>;
}

interface AppState {
  // Données
  tasks: Task[];
  columns: Column[];
  workflows: Workflow[];
  statistics: Statistics | null;
  theme: 'light' | 'dark';
  loading: boolean;
  error: string | null;

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  fetchAllData: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchColumns: () => Promise<void>;
  fetchWorkflows: () => Promise<void>;
  fetchStatistics: () => Promise<void>;
  
  // Tâches
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task | null>;
  updateTask: (id: string, task: Partial<Task>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  
  // Colonnes
  createColumn: (column: Omit<Column, 'id'>) => Promise<Column | null>;
  updateColumn: (id: string, column: Partial<Column>) => Promise<boolean>;
  deleteColumn: (id: string) => Promise<boolean>;
  reorderColumns: (columnOrders: { id: string; order: number }[]) => Promise<boolean>;
  
  // Workflows
  createWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt'>) => Promise<Workflow | null>;
  updateWorkflow: (id: string, workflow: Partial<Workflow>) => Promise<boolean>;
  deleteWorkflow: (id: string) => Promise<boolean>;
  toggleWorkflow: (id: string, enabled: boolean) => Promise<boolean>;
  
  // Notifications
  showNotification: (title: string, body: string) => Promise<boolean>;
  
  // Export/Import
  exportData: () => Promise<boolean>;
  importData: (data: any) => Promise<boolean>;
  
  // UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // État initial
  tasks: [],
  columns: [],
  workflows: [],
  statistics: null,
  theme: 'light',
  loading: false,
  error: null,

  // Actions
  setTheme: (theme) => set({ theme }),

  fetchAllData: async () => {
    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().fetchTasks(),
        get().fetchColumns(),
        get().fetchWorkflows(),
        get().fetchStatistics(),
      ]);
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchTasks: async () => {
    try {
      const tasks = await window.electronAPI.getTasks();
      set({ tasks });
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
    }
  },

  fetchColumns: async () => {
    try {
      const columns = await window.electronAPI.getColumns();
      set({ columns });
    } catch (error: any) {
      console.error('Error fetching columns:', error);
    }
  },

  fetchWorkflows: async () => {
    try {
      const workflows = await window.electronAPI.getWorkflows();
      set({ workflows });
    } catch (error: any) {
      console.error('Error fetching workflows:', error);
    }
  },

  fetchStatistics: async () => {
    try {
      const statistics = await window.electronAPI.getStatistics();
      set({ statistics });
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
    }
  },

  createTask: async (taskData) => {
    try {
      const task = await window.electronAPI.createTask(taskData);
      if (task) {
        set((state) => ({ tasks: [...state.tasks, task] }));
        get().fetchStatistics();
      }
      return task;
    } catch (error: any) {
      console.error('Error creating task:', error);
      return null;
    }
  },

  updateTask: async (id, taskData) => {
    try {
      const success = await window.electronAPI.updateTask(id, taskData);
      if (success) {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...taskData, updatedAt: new Date().toISOString() } : task
          ),
        }));
        get().fetchStatistics();
      }
      return success;
    } catch (error: any) {
      console.error('Error updating task:', error);
      return false;
    }
  },

  deleteTask: async (id) => {
    try {
      const success = await window.electronAPI.deleteTask(id);
      if (success) {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
        get().fetchStatistics();
      }
      return success;
    } catch (error: any) {
      console.error('Error deleting task:', error);
      return false;
    }
  },

  createColumn: async (columnData) => {
    try {
      const column = await window.electronAPI.createColumn(columnData);
      if (column) {
        set((state) => ({ columns: [...state.columns, column] }));
      }
      return column;
    } catch (error: any) {
      console.error('Error creating column:', error);
      return null;
    }
  },

  updateColumn: async (id, columnData) => {
    try {
      const success = await window.electronAPI.updateColumn(id, columnData);
      if (success) {
        set((state) => ({
          columns: state.columns.map((column) =>
            column.id === id ? { ...column, ...columnData } : column
          ),
        }));
      }
      return success;
    } catch (error: any) {
      console.error('Error updating column:', error);
      return false;
    }
  },

  deleteColumn: async (id) => {
    try {
      const success = await window.electronAPI.deleteColumn(id);
      if (success) {
        set((state) => ({
          columns: state.columns.filter((column) => column.id !== id),
        }));
      }
      return success;
    } catch (error: any) {
      console.error('Error deleting column:', error);
      return false;
    }
  },

  reorderColumns: async (columnOrders) => {
    try {
      const success = await window.electronAPI.reorderColumns(columnOrders);
      if (success) {
        set((state) => ({
          columns: state.columns.map((column) => {
            const newOrder = columnOrders.find((o) => o.id === column.id);
            return newOrder ? { ...column, order: newOrder.order } : column;
          }),
        }));
      }
      return success;
    } catch (error: any) {
      console.error('Error reordering columns:', error);
      return false;
    }
  },

  createWorkflow: async (workflowData) => {
    try {
      const workflow = await window.electronAPI.createWorkflow(workflowData);
      if (workflow) {
        set((state) => ({ workflows: [...state.workflows, workflow] }));
      }
      return workflow;
    } catch (error: any) {
      console.error('Error creating workflow:', error);
      return null;
    }
  },

  updateWorkflow: async (id, workflowData) => {
    try {
      const success = await window.electronAPI.updateWorkflow(id, workflowData);
      if (success) {
        set((state) => ({
          workflows: state.workflows.map((workflow) =>
            workflow.id === id ? { ...workflow, ...workflowData } : workflow
          ),
        }));
      }
      return success;
    } catch (error: any) {
      console.error('Error updating workflow:', error);
      return false;
    }
  },

  deleteWorkflow: async (id) => {
    try {
      const success = await window.electronAPI.deleteWorkflow(id);
      if (success) {
        set((state) => ({
          workflows: state.workflows.filter((workflow) => workflow.id !== id),
        }));
      }
      return success;
    } catch (error: any) {
      console.error('Error deleting workflow:', error);
      return false;
    }
  },

  toggleWorkflow: async (id, enabled) => {
    try {
      const success = await window.electronAPI.toggleWorkflow(id, enabled);
      if (success) {
        set((state) => ({
          workflows: state.workflows.map((workflow) =>
            workflow.id === id ? { ...workflow, enabled } : workflow
          ),
        }));
      }
      return success;
    } catch (error: any) {
      console.error('Error toggling workflow:', error);
      return false;
    }
  },

  showNotification: async (title, body) => {
    try {
      return await window.electronAPI.showNotification(title, body);
    } catch (error: any) {
      console.error('Error showing notification:', error);
      return false;
    }
  },

  exportData: async () => {
    try {
      return await window.electronAPI.exportData();
    } catch (error: any) {
      console.error('Error exporting data:', error);
      return false;
    }
  },

  importData: async (data) => {
    try {
      const success = await window.electronAPI.importData(data);
      if (success) {
        await get().fetchAllData();
      }
      return success;
    } catch (error: any) {
      console.error('Error importing data:', error);
      return false;
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));