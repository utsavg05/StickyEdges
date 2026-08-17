import { contextBridge, ipcRenderer } from 'electron';
import type { ChecklistItem, NoteType, StickyApi, StickyColor } from './types';

const api: StickyApi = {
  createNote: () => ipcRenderer.invoke('sticky:create-note'),
  getNote: () => ipcRenderer.invoke('sticky:get-note'),
  saveContent: (content) => ipcRenderer.invoke('sticky:save-content', content),
  setTucked: (tucked) => ipcRenderer.invoke('sticky:set-tucked', tucked),
  moveBy: (deltaY) => ipcRenderer.invoke('sticky:move-by', deltaY),
  moveEmptyStateBy: (deltaY) => ipcRenderer.invoke('sticky:move-empty-state-by', deltaY),
  setColor: (color: StickyColor) => ipcRenderer.invoke('sticky:set-color', color),
  setType: (type: NoteType) => ipcRenderer.invoke('sticky:set-type', type),
  saveChecklist: (items: ChecklistItem[]) => ipcRenderer.invoke('sticky:save-checklist', items),
  deleteNote: () => ipcRenderer.invoke('sticky:delete'),
  onFocusEditor: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('sticky:focus-editor', listener);
    return () => ipcRenderer.removeListener('sticky:focus-editor', listener);
  }
};

contextBridge.exposeInMainWorld('sticky', api);
