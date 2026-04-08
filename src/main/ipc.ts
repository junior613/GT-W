import { ipcMain, dialog } from 'electron';
import { mainWindow } from './main';
import {
  taskRepository,
  columnRepository,
  workflowRepository,
  settingRepository,
  statisticsRepository,
  TaskRow,
} from './database';
import fs from 'fs';
import { CronJob } from 'cron';

// Stockage des jobs cron pour les workflows
const cronJobs: Map<string, CronJob> = new Map();

export const setupIpcHandlers = () => {
  // ===== GESTION DES TÂCHES =====
  
  ipcMain.handle('get-tasks', () => {
    try {
      const tasks = taskRepository.getAll();
      return tasks.map((task: TaskRow) => ({
        ...task,
        tags: JSON.parse(task.tags || '[]'),
      }));
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  });

  ipcMain.handle('get-task', (_event: any, id: string) => {
    try {
      const task = taskRepository.getById(id);
      if (task) {
        return { ...task, tags: JSON.parse(task.tags || '[]') };
      }
      return null;
    } catch (error) {
      console.error('Error getting task:', error);
      return null;
    }
  });

  ipcMain.handle('create-task', (_event: any, taskData: any) => {
    try {
      const task = taskRepository.create(taskData);
      if (task) {
        // Déclencher les workflows de type 'taskCreated'
        triggerWorkflows('taskCreated', {
          ...task,
          due_date: task.dueDate || null,
          column_id: task.columnId || null,
          created_at: task.createdAt,
          updated_at: task.updatedAt,
          tags: JSON.stringify(task.tags || []),
        } as TaskRow);
        return task;
      }
      return null;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  });

  ipcMain.handle('update-task', (_event: any, id: string, taskData: any) => {
    try {
      const success = taskRepository.update(id, taskData);
      if (success) {
        const task = taskRepository.getById(id);
        if (task) {
          // Déclencher les workflows de type 'taskUpdated'
          triggerWorkflows('taskUpdated', task);
          
          // Vérifier si la tâche vient d'être complétée
          if (taskData.status === 'done') {
            triggerWorkflows('taskCompleted', task);
          }
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
    }
  });

  ipcMain.handle('delete-task', (_event: any, id: string) => {
    try {
      return taskRepository.delete(id);
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  });

  // ===== GESTION DES COLONNES =====
  
  ipcMain.handle('get-columns', () => {
    try {
      return columnRepository.getAll();
    } catch (error) {
      console.error('Error getting columns:', error);
      return [];
    }
  });

  ipcMain.handle('create-column', (_event: any, columnData: any) => {
    try {
      return columnRepository.create(columnData);
    } catch (error) {
      console.error('Error creating column:', error);
      return null;
    }
  });

  ipcMain.handle('update-column', (_event: any, id: string, columnData: any) => {
    try {
      return columnRepository.update(id, columnData);
    } catch (error) {
      console.error('Error updating column:', error);
      return false;
    }
  });

  ipcMain.handle('delete-column', (_event: any, id: string) => {
    try {
      return columnRepository.delete(id);
    } catch (error) {
      console.error('Error deleting column:', error);
      return false;
    }
  });

  ipcMain.handle('reorder-columns', (_event: any, columnOrders: any[]) => {
    try {
      return columnRepository.reorder(columnOrders);
    } catch (error) {
      console.error('Error reordering columns:', error);
      return false;
    }
  });

  // ===== GESTION DES WORKFLOWS =====
  
  ipcMain.handle('get-workflows', () => {
    try {
      return workflowRepository.getAll().map((workflow: any) => ({
        ...workflow,
        trigger: {
          type: workflow.trigger_type,
          value: workflow.trigger_value,
        },
        conditions: JSON.parse(workflow.conditions || '[]'),
        actions: JSON.parse(workflow.actions || '[]'),
      }));
    } catch (error) {
      console.error('Error getting workflows:', error);
      return [];
    }
  });

  ipcMain.handle('get-workflow', (_event: any, id: string) => {
    try {
      const workflow = workflowRepository.getById(id);
      if (workflow) {
        return {
          ...workflow,
          trigger: {
            type: workflow.trigger_type,
            value: workflow.trigger_value,
          },
          conditions: JSON.parse(workflow.conditions || '[]'),
          actions: JSON.parse(workflow.actions || '[]'),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting workflow:', error);
      return null;
    }
  });

  ipcMain.handle('create-workflow', (_event: any, workflowData: any) => {
    try {
      const workflow = workflowRepository.create({
        ...workflowData,
        trigger_type: workflowData.trigger?.type,
        trigger_value: workflowData.trigger?.value,
        conditions: JSON.stringify(workflowData.conditions || []),
        actions: JSON.stringify(workflowData.actions || []),
      });
      
      const triggerType = workflowData.trigger?.type || workflow?.trigger_type;

      if (workflow && workflowData.enabled !== false && triggerType === 'time') {
        scheduleWorkflow(workflow);
      }
      
      return workflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      return null;
    }
  });

  ipcMain.handle('update-workflow', (_event: any, id: string, workflowData: any) => {
    try {
      // Annuler le job cron existant
      const existingJob = cronJobs.get(id);
      if (existingJob) {
        existingJob.stop();
        cronJobs.delete(id);
      }
      
      const updateData = { ...workflowData };
      if (workflowData.trigger) {
        updateData.trigger_type = workflowData.trigger.type;
        updateData.trigger_value = workflowData.trigger.value;
      }
      if (workflowData.conditions) updateData.conditions = JSON.stringify(workflowData.conditions);
      if (workflowData.actions) updateData.actions = JSON.stringify(workflowData.actions);

      const success = workflowRepository.update(id, updateData);
      
      const triggerType = workflowData.trigger?.type || (success && workflowRepository.getById(id)?.trigger_type);

      if (success && workflowData.enabled && triggerType === 'time') {
        const workflow = workflowRepository.getById(id);
        if (workflow) {
          scheduleWorkflow(workflow);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error updating workflow:', error);
      return false;
    }
  });

  ipcMain.handle('delete-workflow', (_event: any, id: string) => {
    try {
      // Annuler le job cron existant
      const existingJob = cronJobs.get(id);
      if (existingJob) {
        existingJob.stop();
        cronJobs.delete(id);
      }
      
      return workflowRepository.delete(id);
    } catch (error) {
      console.error('Error deleting workflow:', error);
      return false;
    }
  });

  ipcMain.handle('toggle-workflow', (_event: any, id: string, enabled: boolean) => {
    try {
      // Annuler le job cron existant
      const existingJob = cronJobs.get(id);
      if (existingJob) {
        existingJob.stop();
        cronJobs.delete(id);
      }
      
      const success = workflowRepository.update(id, { enabled });
      
      if (success && enabled) {
        const workflow = workflowRepository.getById(id);
        if (workflow && workflow.trigger_type === 'time') {
          scheduleWorkflow(workflow);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error toggling workflow:', error);
      return false;
    }
  });

  // ===== STATISTIQUES =====
  
  ipcMain.handle('get-statistics', () => {
    try {
      return statisticsRepository.getOverview();
    } catch (error) {
      console.error('Error getting statistics:', error);
      return null;
    }
  });

  // ===== EXPORT/IMPORT =====
  
  ipcMain.handle('export-data', async () => {
    try {
      const result = await dialog.showSaveDialog(mainWindow!, {
        title: 'Exporter les données',
        defaultPath: 'workflow-manager-backup.json',
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });

      if (result.canceled || !result.filePath) return false;

      const data = {
        tasks: taskRepository.getAll().map((task: any) => ({
          ...task,
          tags: JSON.parse(task.tags || '[]'),
        })),
        columns: columnRepository.getAll(),
        workflows: workflowRepository.getAll().map((workflow: any) => ({
          ...workflow,
          conditions: JSON.parse(workflow.conditions || '[]'),
          actions: JSON.parse(workflow.actions || '[]'),
        })),
        exportedAt: new Date().toISOString(),
      };

      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
      
      // Afficher une notification de succès
      new (require('electron')).Notification({
        title: 'Exportation réussie',
        body: 'Les données ont été exportées avec succès.',
      }).show();
      
      return true;
    } catch (error) {
      console.error('Error exporting data:', error);
      return false;
    }
  });

  ipcMain.handle('import-data', (_event: any, data: any) => {
    try {
      // Importer les colonnes
      if (data.columns && Array.isArray(data.columns)) {
        for (const column of data.columns) {
          columnRepository.create({
            title: column.title,
            order_index: column.order_index,
            color: column.color,
          });
        }
      }

      // Importer les tâches
      if (data.tasks && Array.isArray(data.tasks)) {
        for (const task of data.tasks) {
          taskRepository.create({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.due_date,
            tags: Array.isArray(task.tags) ? task.tags : [],
            columnId: task.column_id,
          });
        }
      }

      // Importer les workflows
      if (data.workflows && Array.isArray(data.workflows)) {
        for (const workflow of data.workflows) {
          workflowRepository.create({
            name: workflow.name,
            trigger_type: workflow.trigger_type,
            trigger_value: workflow.trigger_value,
            conditions: workflow.conditions,
            actions: workflow.actions,
            enabled: !!workflow.enabled,
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  });

  ipcMain.handle('import-data-from-file', (_event: any, filePath: string) => {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading import file:', error);
      return null;
    }
  });

  ipcMain.handle('show-open-dialog', async (_event: any, options: any) => {
    try {
      return await dialog.showOpenDialog(mainWindow!, options);
    } catch (error) {
      console.error('Error showing open dialog:', error);
      return { canceled: true, filePaths: [] };
    }
  });

  // ===== THÈME =====
  
  ipcMain.handle('get-theme', () => {
    try {
      return settingRepository.get('theme') || 'light';
    } catch (error) {
      console.error('Error getting theme:', error);
      return 'light';
    }
  });

  ipcMain.handle('set-theme', (_event: any, theme: 'light' | 'dark') => {
    try {
      return settingRepository.set('theme', theme);
    } catch (error) {
      console.error('Error setting theme:', error);
      return false;
    }
  });
};

// Planifier un workflow basé sur le temps
const scheduleWorkflow = (workflow: any) => {
  if (workflow.trigger_type !== 'time' || !workflow.trigger_value) return;

  try {
    const job = new CronJob(workflow.trigger_value, () => {
      // Exécuter le workflow
      executeWorkflow(workflow);
    });

    job.start();
    cronJobs.set(workflow.id, job);
  } catch (error) {
    console.error('Error scheduling workflow:', error);
  }
};

// Déclencher les workflows basés sur un événement
const triggerWorkflows = (eventType: string, task: TaskRow) => {
  const workflows = workflowRepository.getEnabled();
  
  for (const workflow of workflows) {
    const parsedWorkflow = {
      ...workflow,
      conditions: JSON.parse(workflow.conditions || '[]'),
      actions: JSON.parse(workflow.actions || '[]'),
    };

    if (parsedWorkflow.trigger_type === eventType) {
      // Vérifier les conditions
      if (checkConditions(parsedWorkflow.conditions, task)) {
        executeWorkflowActions(parsedWorkflow.actions, task);
      }
    }
  }
};

// Vérifier si les conditions sont remplies
const checkConditions = (conditions: any[], task: TaskRow): boolean => {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((condition: any) => {
    const taskValue = (task as any)[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return taskValue === condition.value;
      case 'notEquals':
        return taskValue !== condition.value;
      case 'contains':
        return taskValue && taskValue.includes(condition.value);
      case 'greaterThan':
        return taskValue && taskValue > condition.value;
      case 'lessThan':
        return taskValue && taskValue < condition.value;
      default:
        return true;
    }
  });
};

// Exécuter les actions d'un workflow
const executeWorkflowActions = (actions: any[], task: TaskRow) => {
  for (const action of actions) {
    switch (action.type) {
      case 'moveTask':
        taskRepository.update(task.id, { columnId: action.params.columnId });
        break;
      case 'changePriority':
        taskRepository.update(task.id, { priority: action.params.priority });
        break;
      case 'addTag':
        const currentTags = JSON.parse(task.tags || '[]');
        if (!currentTags.includes(action.params.tag)) {
          currentTags.push(action.params.tag);
          taskRepository.update(task.id, { tags: currentTags });
        }
        break;
      case 'sendNotification':
        new (require('electron')).Notification({
          title: action.params.title || 'Workflow',
          body: action.params.body || `Action automatique sur: ${task.title}`,
        }).show();
        break;
      case 'createTask':
        taskRepository.create({
          title: action.params.title,
          description: action.params.description || '',
          status: action.params.status || 'todo',
          priority: action.params.priority || 'medium',
          columnId: action.params.columnId,
        });
        break;
    }
  }
};

// Exécuter un workflow complet
const executeWorkflow = (workflow: any) => {
  // Pour les workflows temporels, on peut créer des tâches automatiquement
  if (workflow.trigger_type === 'time') {
    const actions = JSON.parse(workflow.actions || '[]');
    
    for (const action of actions) {
      if (action.type === 'createTask') {
        taskRepository.create({
          title: action.params.title,
          description: action.params.description || '',
          status: action.params.status || 'todo',
          priority: action.params.priority || 'medium',
          columnId: action.params.columnId,
        });
        
        new (require('electron')).Notification({
          title: 'Tâche automatique créée',
          body: action.params.title,
        }).show();
      }
    }
  }
};