"use strict";

// electron/src/preload/index.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("api", {
  // Example API
  send: (channel, data) => {
    let validChannels = ["toMain"];
    if (validChannels.includes(channel)) {
      import_electron.ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    let validChannels = ["fromMain"];
    if (validChannels.includes(channel)) {
      import_electron.ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  invoke: (channel, ...args) => import_electron.ipcRenderer.invoke(channel, ...args)
});
