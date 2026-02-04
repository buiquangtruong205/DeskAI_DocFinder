// QA handlers placeholder
import { ipcMain } from 'electron';

ipcMain.handle('qa:ask', async (event, question) => {
  return { answer: '' };
});
