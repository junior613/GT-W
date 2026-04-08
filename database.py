import sqlite3
import json
import os
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import uuid4

class DatabaseManager:
    def __init__(self, db_path: str = "workflow_manager.db"):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Obtenir une connexion à la base de données"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_database(self):
        """Initialiser la base de données avec les tables et données par défaut"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Activer les clés étrangères
        cursor.execute("PRAGMA foreign_keys = ON")
        
        # Créer les tables
        cursor.executescript("""
            -- Table des colonnes (statuts)
            CREATE TABLE IF NOT EXISTS columns (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                order_index INTEGER NOT NULL,
                color TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Table des tâches
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
            );
            
            -- Table des workflows
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
            );
            
            -- Table des paramètres
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            
            -- Index pour améliorer les performances
            CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
            CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id);
            CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
        """)
        
        # Insérer les données par défaut
        self.seed_default_data(conn)
        
        conn.commit()
        conn.close()
    
    def seed_default_data(self, conn):
        """Insérer les données par défaut"""
        cursor = conn.cursor()
        
        # Vérifier si les colonnes par défaut existent
        cursor.execute("SELECT COUNT(*) as count FROM columns")
        result = cursor.fetchone()
        
        if result['count'] == 0:
            # Colonnes par défaut (style Kanban)
            default_columns = [
                {'id': str(uuid4()), 'title': 'À faire', 'order_index': 0, 'color': '#ef4444'},
                {'id': str(uuid4()), 'title': 'En cours', 'order_index': 1, 'color': '#f59e0b'},
                {'id': str(uuid4()), 'title': 'En révision', 'order_index': 2, 'color': '#3b82f6'},
                {'id': str(uuid4()), 'title': 'Terminé', 'order_index': 3, 'color': '#22c55e'},
            ]
            
            for column in default_columns:
                cursor.execute("""
                    INSERT INTO columns (id, title, order_index, color) 
                    VALUES (?, ?, ?, ?)
                """, (column['id'], column['title'], column['order_index'], column['color']))
            
            # Paramètre de thème par défaut
            cursor.execute("""
                INSERT OR IGNORE INTO settings (key, value) 
                VALUES ('theme', 'light')
            """)
        
        conn.commit()
    
    # ===== GESTION DES TÂCHES =====
    
    def get_all_tasks(self) -> List[Dict[str, Any]]:
        """Récupérer toutes les tâches"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC")
        tasks = []
        for row in cursor.fetchall():
            task = dict(row)
            task['tags'] = json.loads(task['tags'] or '[]')
            tasks.append(task)
        conn.close()
        return tasks
    
    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Récupérer une tâche par ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            task = dict(row)
            task['tags'] = json.loads(task['tags'] or '[]')
            return task
        return None
    
    def create_task(self, task_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Créer une nouvelle tâche"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        task_id = str(uuid4())
        now = datetime.now().isoformat()
        
        cursor.execute("""
            INSERT INTO tasks (id, title, description, status, priority, due_date, tags, column_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            task_id,
            task_data['title'],
            task_data.get('description', ''),
            task_data['status'],
            task_data.get('priority', 'medium'),
            task_data.get('dueDate'),
            json.dumps(task_data.get('tags', [])),
            task_data.get('columnId'),
            now,
            now
        ))
        
        conn.commit()
        conn.close()
        
        return {
            'id': task_id,
            **task_data,
            'createdAt': now,
            'updatedAt': now
        }
    
    def update_task(self, task_id: str, task_data: Dict[str, Any]) -> bool:
        """Mettre à jour une tâche"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        fields = []
        values = []
        
        if 'title' in task_data:
            fields.append('title = ?')
            values.append(task_data['title'])
        if 'description' in task_data:
            fields.append('description = ?')
            values.append(task_data['description'])
        if 'status' in task_data:
            fields.append('status = ?')
            values.append(task_data['status'])
        if 'priority' in task_data:
            fields.append('priority = ?')
            values.append(task_data['priority'])
        if 'dueDate' in task_data:
            fields.append('due_date = ?')
            values.append(task_data['dueDate'])
        if 'tags' in task_data:
            fields.append('tags = ?')
            values.append(json.dumps(task_data['tags']))
        if 'columnId' in task_data:
            fields.append('column_id = ?')
            values.append(task_data['columnId'])
        
        # Toujours mettre à jour updated_at
        fields.append('updated_at = ?')
        values.append(datetime.now().isoformat())
        values.append(task_id)
        
        query = f"UPDATE tasks SET {', '.join(fields)} WHERE id = ?"
        cursor.execute(query, values)
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    
    def delete_task(self, task_id: str) -> bool:
        """Supprimer une tâche"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    
    # ===== GESTION DES COLONNES =====
    
    def get_all_columns(self) -> List[Dict[str, Any]]:
        """Récupérer toutes les colonnes"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM columns ORDER BY order_index")
        columns = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return columns
    
    def create_column(self, column_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Créer une nouvelle colonne"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        column_id = str(uuid4())
        
        cursor.execute("""
            INSERT INTO columns (id, title, order_index, color)
            VALUES (?, ?, ?, ?)
        """, (column_id, column_data['title'], column_data['order_index'], column_data.get('color')))
        
        conn.commit()
        conn.close()
        
        return {'id': column_id, **column_data}
    
    def update_column(self, column_id: str, column_data: Dict[str, Any]) -> bool:
        """Mettre à jour une colonne"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        fields = []
        values = []
        
        if 'title' in column_data:
            fields.append('title = ?')
            values.append(column_data['title'])
        if 'order_index' in column_data:
            fields.append('order_index = ?')
            values.append(column_data['order_index'])
        if 'color' in column_data:
            fields.append('color = ?')
            values.append(column_data['color'])
        
        values.append(column_id)
        
        query = f"UPDATE columns SET {', '.join(fields)} WHERE id = ?"
        cursor.execute(query, values)
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    
    def delete_column(self, column_id: str) -> bool:
        """Supprimer une colonne"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM columns WHERE id = ?", (column_id,))
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    
    def reorder_columns(self, column_orders: List[Dict[str, Any]]) -> bool:
        """Réorganiser l'ordre des colonnes"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        for item in column_orders:
            cursor.execute("UPDATE columns SET order_index = ? WHERE id = ?", (item['order'], item['id']))
        
        success = True
        conn.commit()
        conn.close()
        return success
    
    # ===== GESTION DES WORKFLOWS =====
    
    def get_all_workflows(self) -> List[Dict[str, Any]]:
        """Récupérer tous les workflows"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM workflows ORDER BY created_at DESC")
        workflows = []
        for row in cursor.fetchall():
            workflow = dict(row)
            workflow['trigger'] = {
                'type': workflow['trigger_type'],
                'value': workflow['trigger_value']
            }
            workflow['conditions'] = json.loads(workflow['conditions'] or '[]')
            workflow['actions'] = json.loads(workflow['actions'] or '[]')
            workflows.append(workflow)
        conn.close()
        return workflows
    
    def create_workflow(self, workflow_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Créer un nouveau workflow"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        workflow_id = str(uuid4())
        now = datetime.now().isoformat()
        
        cursor.execute("""
            INSERT INTO workflows (id, name, trigger_type, trigger_value, conditions, actions, enabled, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            workflow_id,
            workflow_data['name'],
            workflow_data['trigger']['type'],
            workflow_data['trigger'].get('value'),
            json.dumps(workflow_data.get('conditions', [])),
            json.dumps(workflow_data.get('actions', [])),
            1 if workflow_data.get('enabled', True) else 0,
            now,
            now
        ))
        
        conn.commit()
        conn.close()
        
        return {
            'id': workflow_id,
            **workflow_data,
            'createdAt': now
        }
    
    def update_workflow(self, workflow_id: str, workflow_data: Dict[str, Any]) -> bool:
        """Mettre à jour un workflow"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        fields = []
        values = []
        
        if 'name' in workflow_data:
            fields.append('name = ?')
            values.append(workflow_data['name'])
        if 'trigger' in workflow_data:
            fields.append('trigger_type = ?')
            values.append(workflow_data['trigger']['type'])
            fields.append('trigger_value = ?')
            values.append(workflow_data['trigger'].get('value'))
        if 'conditions' in workflow_data:
            fields.append('conditions = ?')
            values.append(json.dumps(workflow_data['conditions']))
        if 'actions' in workflow_data:
            fields.append('actions = ?')
            values.append(json.dumps(workflow_data['actions']))
        if 'enabled' in workflow_data:
            fields.append('enabled = ?')
            values.append(1 if workflow_data['enabled'] else 0)
        
        fields.append('updated_at = ?')
        values.append(datetime.now().isoformat())
        values.append(workflow_id)
        
        query = f"UPDATE workflows SET {', '.join(fields)} WHERE id = ?"
        cursor.execute(query, values)
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    
    def delete_workflow(self, workflow_id: str) -> bool:
        """Supprimer un workflow"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM workflows WHERE id = ?", (workflow_id,))
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    
    def toggle_workflow(self, workflow_id: str, enabled: bool) -> bool:
        """Activer/désactiver un workflow"""
        return self.update_workflow(workflow_id, {'enabled': enabled})
    
    # ===== STATISTIQUES =====
    
    def get_statistics(self) -> Dict[str, Any]:
        """Obtenir les statistiques"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Total des tâches
        cursor.execute("SELECT COUNT(*) as count FROM tasks")
        total = cursor.fetchone()['count']
        
        # Tâches terminées
        cursor.execute("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'")
        completed = cursor.fetchone()['count']
        
        # Tâches en attente
        cursor.execute("SELECT COUNT(*) as count FROM tasks WHERE status != 'done'")
        pending = cursor.fetchone()['count']
        
        # Tâches en retard
        cursor.execute("SELECT COUNT(*) as count FROM tasks WHERE due_date < datetime('now') AND status != 'done'")
        overdue = cursor.fetchone()['count']
        
        # Tâches par priorité
        cursor.execute("SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority")
        by_priority = [{'priority': row['priority'], 'count': row['count']} for row in cursor.fetchall()]
        
        # Tâches par colonne
        cursor.execute("""
            SELECT c.title, COUNT(t.id) as count 
            FROM columns c 
            LEFT JOIN tasks t ON c.id = t.column_id 
            GROUP BY c.id
        """)
        by_column = [{'title': row['title'], 'count': row['count']} for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            'total': total,
            'completed': completed,
            'pending': pending,
            'overdue': overdue,
            'byPriority': by_priority,
            'byColumn': by_column
        }
    
    # ===== PARAMÈTRES =====
    
    def get_setting(self, key: str) -> Any:
        """Obtenir un paramètre"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
        row = cursor.fetchone()
        conn.close()
        if row:
            try:
                return json.loads(row[0])
            except (json.JSONDecodeError, TypeError):
                return row[0]
        return None
    
    def set_setting(self, key: str, value: Any) -> bool:
        """Définir un paramètre"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO settings (key, value) 
            VALUES (?, ?)
        """, (key, json.dumps(value)))
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    
    # ===== EXPORT/IMPORT =====
    
    def export_data(self) -> Dict[str, Any]:
        """Exporter toutes les données"""
        return {
            'tasks': self.get_all_tasks(),
            'columns': self.get_all_columns(),
            'workflows': self.get_all_workflows(),
            'exportedAt': datetime.now().isoformat()
        }
    
    def import_data(self, data: Dict[str, Any]) -> bool:
        """Importer des données"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # Importer les colonnes
            if 'columns' in data:
                for column in data['columns']:
                    cursor.execute("""
                        INSERT INTO columns (id, title, order_index, color)
                        VALUES (?, ?, ?, ?)
                    """, (
                        column.get('id', str(uuid4())),
                        column['title'],
                        column.get('order_index', 0),
                        column.get('color')
                    ))
            
            # Importer les tâches
            if 'tasks' in data:
                for task in data['tasks']:
                    cursor.execute("""
                        INSERT INTO tasks (id, title, description, status, priority, due_date, tags, column_id, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        task.get('id', str(uuid4())),
                        task['title'],
                        task.get('description', ''),
                        task.get('status', 'todo'),
                        task.get('priority', 'medium'),
                        task.get('due_date'),
                        json.dumps(task.get('tags', [])),
                        task.get('column_id'),
                        task.get('created_at', datetime.now().isoformat()),
                        task.get('updated_at', datetime.now().isoformat())
                    ))
            
            # Importer les workflows
            if 'workflows' in data:
                for workflow in data['workflows']:
                    cursor.execute("""
                        INSERT INTO workflows (id, name, trigger_type, trigger_value, conditions, actions, enabled, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        workflow.get('id', str(uuid4())),
                        workflow['name'],
                        workflow.get('trigger_type', 'taskCreated'),
                        workflow.get('trigger_value'),
                        json.dumps(workflow.get('conditions', [])),
                        json.dumps(workflow.get('actions', [])),
                        1 if workflow.get('enabled', True) else 0,
                        workflow.get('created_at', datetime.now().isoformat()),
                        workflow.get('updated_at', datetime.now().isoformat())
                    ))
            
            conn.commit()
            return True
        except Exception as e:
            print(f"Erreur lors de l'import: {e}")
            return False
        finally:
            conn.close()