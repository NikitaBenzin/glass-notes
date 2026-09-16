import { contextBridge, ipcRenderer } from 'electron';

export interface AppSettings {
  pinnedColor: string;
  unpinnedOpacity?: number;
  pinnedOpacity?: number;
}

export interface ElectronAPI {
  getInitialNote: (id: string) => Promise<{
    id: string;
    content: string;
    isPinned: boolean;
    createdAt: number;
    updatedAt: number;
  } | null>;
  saveContent: (id: string, content: string) => void;
  createNote: (sourceNoteId?: string) => Promise<string>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<boolean>;
  onPinChanged: (callback: (isPinned: boolean) => void) => () => void;
  minimizeNote: (id: string) => void;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  onSettingsChanged: (callback: (settings: AppSettings) => void) => () => void;
  openSettings: (sourceNoteId?: string) => Promise<void>;
  closeSettings: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;
}

const api: ElectronAPI = {
  getInitialNote: (id: string) => ipcRenderer.invoke('note:get-initial', id),
  saveContent: (id: string, content: string) => {
    ipcRenderer.send('note:save-content', { id, content });
  },
  createNote: (sourceNoteId?: string) => ipcRenderer.invoke('note:create', sourceNoteId),
  deleteNote: (id: string) => ipcRenderer.invoke('note:delete', id),
  togglePin: (id: string) => ipcRenderer.invoke('note:toggle-pin', id),
  minimizeNote: (id: string) => ipcRenderer.send('note:minimize', id),
  onPinChanged: (callback: (isPinned: boolean) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, isPinned: boolean) => {
      callback(isPinned);
    };
    ipcRenderer.on('note:pin-changed', subscription);
    return () => {
      ipcRenderer.removeListener('note:pin-changed', subscription);
    };
  },
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: Partial<AppSettings>) => ipcRenderer.invoke('settings:save', settings),
  onSettingsChanged: (callback: (settings: AppSettings) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, newSettings: AppSettings) => {
      callback(newSettings);
    };
    ipcRenderer.on('settings:changed', subscription);
    return () => {
      ipcRenderer.removeListener('settings:changed', subscription);
    };
  },
  openSettings: (sourceNoteId?: string) => ipcRenderer.invoke('settings:open', sourceNoteId),
  closeSettings: () => ipcRenderer.invoke('settings:close'),
  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
};

contextBridge.exposeInMainWorld('electron', api);
