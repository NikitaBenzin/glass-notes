import { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage, NativeImage, screen, shell } from 'electron';
import path from 'node:path';
import { NotesStore, NoteItem } from './store';

// Set application details
app.setName('GlassNotes');

const store = new NotesStore();
const windows = new Map<string, BrowserWindow>();
let tray: Tray | null = null;

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;

function getAppIcon(): NativeImage {
  const iconPath = isDev
    ? path.join(__dirname, '../public/icon.png')
    : path.join(__dirname, '../dist/icon.png');
  return nativeImage.createFromPath(iconPath);
}

function createTray() {
  if (tray) return;

  const appIcon = getAppIcon();
  const trayIcon = !appIcon.isEmpty()
    ? appIcon.resize({ width: 16, height: 16 })
    : nativeImage.createFromBuffer(
        Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGD4z0ABYBw1gGE0DBhGwwAYDYOnBqD/oYFh1ACGEc0DeDYwYHQPhwEALeMR/yU4EekAAAAASUVORK5CYII=',
          'base64'
        )
      );
  
  tray = new Tray(trayIcon);
  tray.setToolTip('GlassNotes');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'New Sticky Note',
      accelerator: 'CmdOrCtrl+Alt+N',
      click: () => createNewNote(),
    },
    {
      label: 'Show All Notes',
      click: () => {
        windows.forEach((win) => {
          if (!win.isDestroyed()) {
            win.show();
            win.focus();
          }
        });
      },
    },
    { type: 'separator' },
    {
      label: 'Quit GlassNotes',
      click: () => {
        store.flushToDisk();
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => createNewNote());
}

function createNoteWindow(note: NoteItem): BrowserWindow {
  const existingWin = windows.get(note.id);
  if (existingWin && !existingWin.isDestroyed()) {
    existingWin.focus();
    return existingWin;
  }

  const win = new BrowserWindow({
    width: note.width || 340,
    height: note.height || 380,
    minWidth: 260,
    minHeight: 200,
    x: note.x,
    y: note.y,
    frame: false,
    transparent: true,
    hasShadow: false, // Prevents Windows black rectangular borders on frameless windows; CSS renders smooth diffuse shadows
    backgroundColor: '#00000000',
    alwaysOnTop: note.isPinned ?? false,
    skipTaskbar: false,
    resizable: true,
    autoHideMenuBar: true,
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: isDev,
    },
  });

  windows.set(note.id, win);

  // Debounced bounds tracking on window move or resize
  let boundsTimer: NodeJS.Timeout | null = null;
  const syncBounds = () => {
    if (boundsTimer) clearTimeout(boundsTimer);
    boundsTimer = setTimeout(() => {
      if (!win.isDestroyed()) {
        const bounds = win.getBounds();
        store.updateBounds(note.id, bounds);
      }
    }, 250);
  };

  win.on('moved', syncBounds);
  win.on('resized', syncBounds);

  win.on('closed', () => {
    windows.delete(note.id);
  });

  // Handle in-app shortcuts (Ctrl+N to create new note, Ctrl+W to close/delete)
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      const isCmdOrCtrl = input.control || input.meta;
      if (isCmdOrCtrl && !input.alt && !input.shift && input.key.toLowerCase() === 'n') {
        event.preventDefault();
        createNewNote(note.id);
      } else if (isCmdOrCtrl && !input.alt && !input.shift && input.key.toLowerCase() === 'w') {
        event.preventDefault();
        deleteNote(note.id);
      }
    }
  });

  // Open external links in default OS browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Load URL
  if (isDev) {
    win.loadURL(`${process.env.VITE_DEV_SERVER_URL}?id=${encodeURIComponent(note.id)}`);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { id: note.id },
    });
  }

  return win;
}

function createNewNote(sourceNoteId?: string): string {
  let x = 240;
  let y = 180;
  let width = 340;
  let height = 380;

  if (sourceNoteId && windows.has(sourceNoteId)) {
    const sourceWin = windows.get(sourceNoteId);
    if (sourceWin && !sourceWin.isDestroyed()) {
      const bounds = sourceWin.getBounds();
      x = bounds.x + 35;
      y = bounds.y + 35;
      width = bounds.width;
      height = bounds.height;
    }
  } else if (windows.size > 0) {
    // Find the last active window position
    const lastWin = Array.from(windows.values())[windows.size - 1];
    if (lastWin && !lastWin.isDestroyed()) {
      const bounds = lastWin.getBounds();
      x = bounds.x + 35;
      y = bounds.y + 35;
    }
  }

  const newId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newNote = store.saveNote({
    id: newId,
    content: '',
    x,
    y,
    width,
    height,
    isPinned: false,
  });

  const win = createNoteWindow(newNote);
  win.focus();
  return newId;
}

// IPC Handlers
ipcMain.handle('note:get-initial', (_event, id: string) => {
  return store.getNote(id) || null;
});

ipcMain.on('note:save-content', (_event, { id, content }: { id: string; content: string }) => {
  store.saveNote({ id, content });
});

ipcMain.handle('note:create', (_event, sourceNoteId?: string) => {
  return createNewNote(sourceNoteId);
});

function deleteNote(id: string): void {
  store.deleteNote(id);
  const win = windows.get(id);
  if (win && !win.isDestroyed()) {
    win.close();
  }

  // If all notes are deleted, spawn a fresh empty one so user is not left empty-handed
  if (store.getNotes().length === 0) {
    setTimeout(() => {
      createNewNote();
    }, 150);
  }
}

ipcMain.handle('note:delete', (_event, id: string) => {
  deleteNote(id);
});

ipcMain.handle('note:toggle-pin', (_event, id: string) => {
  const win = windows.get(id);
  const note = store.getNote(id);
  if (win && !win.isDestroyed() && note) {
    const nextPinned = !note.isPinned;
    win.setAlwaysOnTop(nextPinned);
    store.saveNote({ id, isPinned: nextPinned });
    win.webContents.send('note:pin-changed', nextPinned);
    return nextPinned;
  }
  return false;
});

ipcMain.on('note:minimize', (_event, id: string) => {
  const win = windows.get(id);
  if (win && !win.isDestroyed()) {
    win.minimize();
  }
});

// App Settings IPC Handlers & Dedicated Window
let settingsWindow: BrowserWindow | null = null;

function openSettingsWindow(sourceNoteId?: string): BrowserWindow {
  // If settings window is already open, bring it to front and focus
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return settingsWindow;
  }

  const settingsWidth = 256;
  const settingsHeight = 410;

  let x = 320;
  let y = 220;

  if (sourceNoteId && windows.has(sourceNoteId)) {
    const sourceWin = windows.get(sourceNoteId);
    if (sourceWin && !sourceWin.isDestroyed()) {
      const bounds = sourceWin.getBounds();
      const display = screen.getDisplayMatching(bounds);

      if (bounds.x + bounds.width + settingsWidth + 12 <= display.bounds.x + display.bounds.width) {
        x = bounds.x + bounds.width + 12;
      } else if (bounds.x - settingsWidth - 12 >= display.bounds.x) {
        x = bounds.x - settingsWidth - 12;
      } else {
        x = bounds.x + 20;
      }
      y = Math.max(display.bounds.y + 10, Math.min(bounds.y, display.bounds.y + display.bounds.height - settingsHeight - 20));
    }
  }

  settingsWindow = new BrowserWindow({
    width: settingsWidth,
    height: settingsHeight,
    minWidth: settingsWidth,
    minHeight: settingsHeight,
    maxWidth: settingsWidth,
    maxHeight: settingsHeight,
    x,
    y,
    frame: false,
    transparent: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    autoHideMenuBar: true,
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: isDev,
    },
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  if (isDev) {
    settingsWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}?settings=true`);
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { settings: 'true' },
    });
  }

  return settingsWindow;
}

ipcMain.handle('settings:open', (_event, sourceNoteId?: string) => {
  openSettingsWindow(sourceNoteId);
});

ipcMain.handle('settings:close', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
  }
});

ipcMain.handle('shell:open-external', (_event, url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    shell.openExternal(url);
  }
});

ipcMain.handle('settings:get', () => {
  return store.getSettings();
});

ipcMain.handle('settings:save', (_event, newSettings) => {
  const updated = store.saveSettings(newSettings);
  // Broadcast to all open note windows
  windows.forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('settings:changed', updated);
    }
  });
  return updated;
});

app.whenReady().then(() => {
  // Remove default application menu so Ctrl+N / Ctrl+W are never intercepted by Chromium
  Menu.setApplicationMenu(null);

  createTray();

  // Register global shortcut to spawn note from anywhere
  globalShortcut.register('CommandOrControl+Alt+N', () => {
    createNewNote();
  });

  // Restore existing notes or create welcome note
  const savedNotes = store.getNotes();
  if (savedNotes.length > 0) {
    savedNotes.forEach((note) => {
      createNoteWindow(note);
    });
  } else {
    createNewNote();
  }

  app.on('activate', () => {
    if (windows.size === 0) {
      const notes = store.getNotes();
      if (notes.length > 0) {
        notes.forEach((n) => createNoteWindow(n));
      } else {
        createNewNote();
      }
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  store.flushToDisk();
});

app.on('window-all-closed', () => {
  // On Windows, keep app running in background tray unless user quits from tray
  // If no tray or desired, we can keep the process active or quit.
});
