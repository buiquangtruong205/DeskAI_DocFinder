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
  // registerSearchHandlers(); // Removed, covered by registerIpcHandlers
  registerIpcHandlers();

  // Start Job Queue Worker
  const { jobQueue } = require('../services/indexing/jobQueue');
  jobQueue.start();

  // Start scanning default docs folder for MVP
  // In real app, this should be user configurable via IPC
  const docsPath = path.join(app.getPath('documents'), 'DeskAI_Docs'); // Example
  if (!fs.existsSync(docsPath)) {
    fs.mkdirSync(docsPath, { recursive: true });
  }

  // Ensure source exists in DB
  let source = sourcesRepo.getByPath(docsPath);
  if (!source) {
    console.log('Creating default source:', docsPath);
    source = sourcesRepo.create({
      name: 'My Docs',
      path: docsPath,
      type: 'folder'
    });
  }

  // Scan the source
  fileScanner.scanSource(source.id, docsPath).catch(err => console.error("Startup scan failed:", err));

  createWindow();

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
