// ipc main registration
// Handlers will be registered when registerIpcHandlers is called

import { registerAskHandlers } from './handlers/ask.handlers';
import { registerPlaygroundHandlers } from './handlers/playground.handlers';

export const registerIpcHandlers = () => {
  // Import handlers - they register themselves when imported
  require('./handlers/search.handlers');
  require('./handlers/favorites.handlers');
  require('./handlers/insights.handlers');
  require('./handlers/documents.handlers');
  require('./handlers/sources.handlers');

  // Call register functions for handlers that don't self-register
  registerAskHandlers();
  registerPlaygroundHandlers();

  console.log('IPC handlers registered');
};
