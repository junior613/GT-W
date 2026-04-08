export interface IElectronAPI {
  // Tâches
  getTasks: () => Promise<any[]>;
  getTask: (id: string) => Promise<any>;
  createTask: (task: any) => Promise<any>;
  updateTask: (id: string, task: any) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;

  // Colonnes
  getColumns: () => Promise<Array<{ id: string; title: string; order?: number; order_index?: number; color?: string; created_at?: string }>>;
  createColumn: (column: any) => Promise<any>;
  updateColumn: (id: string, column: any) => Promise<boolean>;
  deleteColumn: (id: string) => Promise<boolean>;
  reorderColumns: (columnOrders: { id: string; order: number }[]) => Promise<boolean>;

  // Workflows
  getWorkflows: () => Promise<any[]>;
  getWorkflow: (id: string) => Promise<any>;
  createWorkflow: (workflow: any) => Promise<any>;
  updateWorkflow: (id: string, workflow: any) => Promise<boolean>;
  deleteWorkflow: (id: string) => Promise<boolean>;
  toggleWorkflow: (id: string, enabled: boolean) => Promise<boolean>;

  // Statistiques
  getStatistics: () => Promise<any>;

  // Notifications
  showNotification: (title: string, body: string) => Promise<boolean>;

  // Fichiers
  exportData: () => Promise<boolean>;
  importData: (data: any) => Promise<boolean>;
  importDataFromFile: (filePath: string) => Promise<any>;
  showOpenDialog: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }>;

  // Thème
  getTheme: () => Promise<'light' | 'dark'>;
  setTheme: (theme: 'light' | 'dark') => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
