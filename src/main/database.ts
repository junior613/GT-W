import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';

let db: Database.Database | null = null;

// Chemin de la base de données
const getDbPath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'workflow_manager.db');
};

// Initialiser la base de données
export const initializeDatabase = () => {
  const dbPath = getDbPath();
  db = new Database(dbPath);
  
  // Activer les clés étrangères
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  // Créer les tables
  createTables();
  
  // Insérer les données par défaut
  seedDefaultData();
  
  return db;
};

// Créer les tables
const createTables = () => {
  if (!db) return;

  // Table des colonnes (statuts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS columns (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      color TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table des tâches
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      due_date TEXT,
      tags TEXT DEFAULT '[]',
      column_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE SET NULL
    )
  `);

  // Table des workflows
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      trigger_value TEXT,
      conditions TEXT DEFAULT '[]',
      actions TEXT DEFAULT '[]',
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table des paramètres
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Index pour améliorer les performances
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)
  `);
};

// Insérer les données par défaut
const seedDefaultData = () => {
  if (!db) return;

  // Vérifier si les colonnes par défaut existent déjà
  const columnCount = db.prepare('SELECT COUNT(*) as count FROM columns').get() as { count: number };
  
  if (columnCount.count === 0) {
    // Colonnes par défaut (style Kanban)
    const defaultColumns = [
      { id: uuidv4(), title: 'À faire', order_index: 0, color: '#ef4444' },
      { id: uuidv4(), title: 'En cours', order_index: 1, color: '#f59e0b' },
      { id: uuidv4(), title: 'En révision', order_index: 2, color: '#3b82f6' },
      { id: uuidv4(), title: 'Terminé', order_index: 3, color: '#22c55e' },
    ];

    const insertColumn = db.prepare(`
      INSERT INTO columns (id, title, order_index, color) 
      VALUES (?, ?, ?, ?)
    `);

    for (const column of defaultColumns) {
      insertColumn.run(column.id, column.title, column.order_index, column.color);
    }

    // Paramètre de thème par défaut
    db.prepare(`
      INSERT OR IGNORE INTO settings (key, value) 
      VALUES ('theme', 'light')
    `).run();
  }
};

// Obtenir l'instance de la base de données
export const getDb = () => db;

export interface TaskRow {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  tags: string;
  column_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ColumnRow {
  id: string;
  title: string;
  order_index: number;
  color: string | null;
  created_at: string;
}

export interface WorkflowRow {
  id: string;
  name: string;
  trigger_type: string;
  trigger_value: string | null;
  conditions: string;
  actions: string;
  enabled: number;
  created_at: string;
  updated_at: string;
}

// CRUD pour les tâches
export const taskRepository = {
  getAll: (): TaskRow[] => {
    if (!db) return [];
    return db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as TaskRow[];
  },

  getById: (id: string): TaskRow | null => {
    if (!db) return null;
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | null;
  },

  getByColumn: (columnId: string): TaskRow[] => {
    if (!db) return [];
    return db.prepare('SELECT * FROM tasks WHERE column_id = ? ORDER BY created_at DESC').all(columnId) as TaskRow[];
  },

  create: (task: {
    title: string;
    description?: string;
    status: string;
    priority?: string;
    dueDate?: string;
    tags?: string[];
    columnId?: string;
  }) => {
    if (!db) return null;
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, description, status, priority, due_date, tags, column_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      task.title,
      task.description || '',
      task.status,
      task.priority || 'medium',
      task.dueDate || null,
      JSON.stringify(task.tags || []),
      task.columnId || null,
      now,
      now
    );
    
    return { id, ...task, createdAt: now, updatedAt: now };
  },

  update: (id: string, task: Partial<{
    title: string;
    description?: string;
    status: string;
    priority?: string;
    dueDate?: string;
    tags?: string[];
    columnId?: string;
  }>) => {
    if (!db) return false;
    
    const fields: string[] = [];
    const values: any[] = [];
    
    if (task.title !== undefined) { fields.push('title = ?'); values.push(task.title); }
    if (task.description !== undefined) { fields.push('description = ?'); values.push(task.description); }
    if (task.status !== undefined) { fields.push('status = ?'); values.push(task.status); }
    if (task.priority !== undefined) { fields.push('priority = ?'); values.push(task.priority); }
    if (task.dueDate !== undefined) { fields.push('due_date = ?'); values.push(task.dueDate); }
    if (task.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(task.tags)); }
    if (task.columnId !== undefined) { fields.push('column_id = ?'); values.push(task.columnId); }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    const stmt = db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values).changes > 0;
  },

  delete: (id: string) => {
    if (!db) return false;
    return db.prepare('DELETE FROM tasks WHERE id = ?').run(id).changes > 0;
  },
};

// CRUD pour les colonnes
export const columnRepository = {
  getAll: (): ColumnRow[] => {
    if (!db) return [];
    return db.prepare('SELECT * FROM columns ORDER BY order_index').all() as ColumnRow[];
  },

  getById: (id: string): ColumnRow | null => {
    if (!db) return null;
    return db.prepare('SELECT * FROM columns WHERE id = ?').get(id) as ColumnRow | null;
  },

  create: (column: { title: string; order_index: number; color?: string }) => {
    if (!db) return null;
    const id = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO columns (id, title, order_index, color)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(id, column.title, column.order_index, column.color || null);
    
    return { id, ...column };
  },

  update: (id: string, column: Partial<{ title: string; order_index: number; color?: string }>) => {
    if (!db) return false;
    
    const fields: string[] = [];
    const values: any[] = [];
    
    if (column.title !== undefined) { fields.push('title = ?'); values.push(column.title); }
    if (column.order_index !== undefined) { fields.push('order_index = ?'); values.push(column.order_index); }
    if (column.color !== undefined) { fields.push('color = ?'); values.push(column.color); }
    
    values.push(id);
    
    const stmt = db.prepare(`UPDATE columns SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values).changes > 0;
  },

  delete: (id: string) => {
    if (!db) return false;
    return db.prepare('DELETE FROM columns WHERE id = ?').run(id).changes > 0;
  },

  reorder: (columnOrders: { id: string; order: number }[]) => {
    if (!db) return false;
    
    const updateStmt = db.prepare('UPDATE columns SET order_index = ? WHERE id = ?');
    
    for (const { id, order } of columnOrders) {
      updateStmt.run(order, id);
    }
    
    return true;
  },
};

// CRUD pour les workflows
export const workflowRepository = {
  getAll: (): WorkflowRow[] => {
    if (!db) return [];
    return db.prepare('SELECT * FROM workflows ORDER BY created_at DESC').all() as WorkflowRow[];
  },

  getById: (id: string): WorkflowRow | null => {
    if (!db) return null;
    return db.prepare('SELECT * FROM workflows WHERE id = ?').get(id) as WorkflowRow | null;
  },

  getEnabled: (): WorkflowRow[] => {
    if (!db) return [];
    return db.prepare('SELECT * FROM workflows WHERE enabled = 1').all() as WorkflowRow[];
  },

  create: (workflow: {
    name: string;
    trigger_type: string;
    trigger_value?: string;
    conditions?: any[];
    actions?: any[];
    enabled?: boolean;
  }) => {
    if (!db) return null;
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO workflows (id, name, trigger_type, trigger_value, conditions, actions, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      workflow.name,
      workflow.trigger_type,
      workflow.trigger_value || null,
      JSON.stringify(workflow.conditions || []),
      JSON.stringify(workflow.actions || []),
      workflow.enabled !== false ? 1 : 0,
      now,
      now
    );
    
    return { id, ...workflow, createdAt: now };
  },

  update: (id: string, workflow: Partial<{
    name: string;
    trigger_type: string;
    trigger_value?: string;
    conditions?: any[];
    actions?: any[];
    enabled?: boolean;
  }>) => {
    if (!db) return false;
    
    const fields: string[] = [];
    const values: any[] = [];
    
    if (workflow.name !== undefined) { fields.push('name = ?'); values.push(workflow.name); }
    if (workflow.trigger_type !== undefined) { fields.push('trigger_type = ?'); values.push(workflow.trigger_type); }
    if (workflow.trigger_value !== undefined) { fields.push('trigger_value = ?'); values.push(workflow.trigger_value); }
    if (workflow.conditions !== undefined) { fields.push('conditions = ?'); values.push(JSON.stringify(workflow.conditions)); }
    if (workflow.actions !== undefined) { fields.push('actions = ?'); values.push(JSON.stringify(workflow.actions)); }
    if (workflow.enabled !== undefined) { fields.push('enabled = ?'); values.push(workflow.enabled ? 1 : 0); }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    const stmt = db.prepare(`UPDATE workflows SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values).changes > 0;
  },

  delete: (id: string) => {
    if (!db) return false;
    return db.prepare('DELETE FROM workflows WHERE id = ?').run(id).changes > 0;
  },
};

// Repository pour les paramètres
export const settingRepository = {
  get: (key: string) => {
    if (!db) return null;
    const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    return result ? JSON.parse(result.value) : null;
  },

  set: (key: string, value: any) => {
    if (!db) return false;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO settings (key, value) 
      VALUES (?, ?)
    `);
    return stmt.run(key, JSON.stringify(value)).changes > 0;
  },
};

// Statistiques
export const statisticsRepository = {
  getOverview: () => {
    if (!db) return null;
    
    const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
    const completedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'").get() as { count: number };
    const pendingTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status != 'done'").get() as { count: number };
    const overdueTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE due_date < datetime('now') AND status != 'done'").get() as { count: number };
    
    const tasksByPriority = db.prepare('SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority').all() as { priority: string; count: number }[];
    const tasksByColumn = db.prepare(`
      SELECT c.title, COUNT(t.id) as count 
      FROM columns c 
      LEFT JOIN tasks t ON c.id = t.column_id 
      GROUP BY c.id
    `).all() as { title: string; count: number }[];
    
    return {
      total: totalTasks.count,
      completed: completedTasks.count,
      pending: pendingTasks.count,
      overdue: overdueTasks.count,
      byPriority: tasksByPriority,
      byColumn: tasksByColumn,
    };
  },
};