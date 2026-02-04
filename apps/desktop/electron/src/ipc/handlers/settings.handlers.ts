// settings handlers placeholder
import { ipcMain } from 'electron';

ipcMain.handle('settings:get', async () => ({ }));
ipcMain.handle('settings:set', async (event, settings) => ({ ok: true }));
