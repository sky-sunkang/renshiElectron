const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  db: {
    addItem: (name, value) => ipcRenderer.invoke('db:addItem', name, value),
    getAllItems: () => ipcRenderer.invoke('db:getAllItems'),
    getItemById: (id) => ipcRenderer.invoke('db:getItemById', id),
    updateItem: (id, name, value) => ipcRenderer.invoke('db:updateItem', id, name, value),
    deleteItem: (id) => ipcRenderer.invoke('db:deleteItem', id),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    close: () => ipcRenderer.invoke('window:close'),
  },
})
