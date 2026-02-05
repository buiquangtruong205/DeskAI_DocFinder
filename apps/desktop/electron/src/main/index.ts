import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// if (require('electron-squirrel-startup')) {
//   app.quit();
// }

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Hide the default menu for a cleaner look
    autoHideMenuBar: true,
  });

  // Load the index.html of the app.
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../../renderer/dist/index.html'));
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
import { initDb } from '../services/storage/db';
import { fileScanner } from '../services/indexing/scanner';
import { registerIpcHandlers } from '../ipc';
import { sourcesRepo } from '../services/storage/repositories/sources.repo';

// ... imports

console.log("\n\n==================================================================");
console.log("   DESKAI ELECTRON MAIN PROCESS STARTED   ");
console.log("==================================================================\n\n");

app.whenReady().then(async () => {
  await initDb();
  registerIpcHandlers();

  // Start Job Queue Worker
  const { jobQueue } = require('../services/indexing/jobQueue');
  jobQueue.start();

  // Start scanning default docs folder for MVP
  const docsPath = path.join(app.getPath('documents'), 'DeskAI_Docs');
  if (!fs.existsSync(docsPath)) {
    fs.mkdirSync(docsPath, { recursive: true });
  }

  // Ensure source exists in DB
  let source = sourcesRepo.getByPath(docsPath);
  if (!source) {
    console.log('[Main] Creating default source:', docsPath);
    source = sourcesRepo.create({
      name: 'My Docs',
      path: docsPath,
      type: 'folder'
    });
  }

  // Initial background scan of the default source
  fileScanner.scanSource(source.id, docsPath).catch(err => {
    console.error("[Main] Startup scan failed:", err);
  });

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
