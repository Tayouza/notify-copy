const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notifycopy', {
  onShow: (callback) => {
    const handler = (_event, data) => {
      if (typeof callback === 'function') callback(data);
    };
    ipcRenderer.on('toast:show', handler);
    return () => {
      ipcRenderer.removeListener('toast:show', handler);
    };
  },
  onHide: (callback) => {
    const handler = (_event) => {
      if (typeof callback === 'function') callback();
    };
    ipcRenderer.on('toast:hide', handler);
    return () => {
      ipcRenderer.removeListener('toast:hide', handler);
    };
  },
  onTheme: (callback) => {
    const handler = (_event, data) => {
      if (typeof callback === 'function') callback(data);
    };
    ipcRenderer.on('toast:theme', handler);
    return () => {
      ipcRenderer.removeListener('toast:theme', handler);
    };
  },
  ready: () => {
    ipcRenderer.send('toast:ready');
  },
});