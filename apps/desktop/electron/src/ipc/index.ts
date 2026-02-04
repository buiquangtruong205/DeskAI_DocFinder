// ipc main registration
// Handlers will be registered when registerIpcHandlers is called

export const registerIpcHandlers = () => {
  // Import handlers - they register themselves when imported
  require('./handlers/search.handlers');
  require('./handlers/ask.handlers');
  require('./handlers/favorites.handlers');
  require('./handlers/insights.handlers');
  require('./handlers/playground.handlers');
  require('./handlers/documents.handlers');
  require('./handlers/sources.handlers');

  console.log('IPC handlers registered');
};
