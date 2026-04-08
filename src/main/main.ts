import { app, BrowserWindow, ipcMain, Notification, dialog } from 'electron';
import path from 'path';
import { initializeDatabase, getDb } from './database';
import { setupIpcHandlers } from './ipc';

let mainWindow: BrowserWindow | null = null;

// Vitesse de développement Vite
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Workflow Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../../public/icon.png'),
    titleBarStyle: 'hiddenInset',
  });

  // Charger l'application
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Gérer les notifications
ipcMain.handle('show-notification', (event, { title, body }) => {
  new Notification({ title, body }).show();
});

// Gérer les dialogues de fichiers
ipcMain.handle('show-open-dialog', (event, options) => {
  return dialog.showOpenDialog(mainWindow!, options);
});

ipcMain.handle('show-save-dialog', (event, options) => {
  return dialog.showSaveDialog(mainWindow!, options);
});

app.whenReady().then(async () => {
  // Initialiser la base de données
  await initializeDatabase();
  
  // Configurer les handlers IPC
  setupIpcHandlers();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Fermer la base de données
  const db = getDb();
  if (db) {
    db.close();
  }
});

export { mainWindow };