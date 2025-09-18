const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  unmaximize: () => ipcRenderer.send('window:unmaximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: async () => ipcRenderer.invoke('window:isMaximized'),
  onDidChangeMaximize: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('browser-window-focus', handler);
    ipcRenderer.on('browser-window-blur', handler);
    return () => {
      ipcRenderer.removeListener('browser-window-focus', handler);
      ipcRenderer.removeListener('browser-window-blur', handler);
    };
  }
});


