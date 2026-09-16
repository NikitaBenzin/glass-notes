import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

export interface NoteItem {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  pinnedColor: string;
  unpinnedOpacity: number;
  pinnedOpacity: number;
}

export interface StoreSchema {
  notes: NoteItem[];
  settings: AppSettings;
}

const DEFAULT_NOTE_WIDTH = 320;
const DEFAULT_NOTE_HEIGHT = 360;

const DEFAULT_SETTINGS: AppSettings = {
  pinnedColor: '#f59e0b', // Classic macOS Amber
  unpinnedOpacity: 95,     // 95% default unpinned opacity
  pinnedOpacity: 70,       // 70% default pinned opacity
};

export const DEFAULT_WELCOME_NOTE_CONTENT = `# Welcome! 🚀
These are your new lightweight sticky notes. They support **Markdown** on the fly.

You can make text **bold** or *italic*, and create lists:

### Weekend Plan:
- [ ] Draft UI/UX concepts for the new project
- [ ] Write a progress update for the X blog
- [ ] Grab a Negroni and chill 🥃

Just click here and start typing to clear this text!`;

export class NotesStore {
  private filePath: string;
  private data: StoreSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.filePath = path.join(userDataPath, 'notes-data.json');
    this.data = this.loadFromDisk();
  }

  private loadFromDisk(): StoreSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.notes)) {
          return {
            notes: parsed.notes,
            settings: {
              ...DEFAULT_SETTINGS,
              ...(parsed.settings || {}),
            },
          };
        }
      }
    } catch (err) {
      console.error('Failed to load notes from disk, initializing fresh:', err);
    }

    // Default first note with built-in Markdown formatting guide (First Launch Only)
    const initialNote: NoteItem = {
      id: 'welcome-note',
      content: DEFAULT_WELCOME_NOTE_CONTENT,
      x: 180,
      y: 140,
      width: DEFAULT_NOTE_WIDTH,
      height: 400,
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return {
      notes: [initialNote],
      settings: DEFAULT_SETTINGS,
    };
  }

  public getNotes(): NoteItem[] {
    return this.data.notes;
  }

  public getNote(id: string): NoteItem | undefined {
    return this.data.notes.find((n) => n.id === id);
  }

  public saveNote(note: Partial<NoteItem> & { id: string }): NoteItem {
    const existingIndex = this.data.notes.findIndex((n) => n.id === note.id);
    let updatedNote: NoteItem;

    if (existingIndex >= 0) {
      updatedNote = {
        ...this.data.notes[existingIndex],
        ...note,
        updatedAt: Date.now(),
      };
      this.data.notes[existingIndex] = updatedNote;
    } else {
      updatedNote = {
        id: note.id,
        content: note.content ?? '',
        x: note.x ?? 200,
        y: note.y ?? 200,
        width: note.width ?? DEFAULT_NOTE_WIDTH,
        height: note.height ?? DEFAULT_NOTE_HEIGHT,
        isPinned: note.isPinned ?? false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.data.notes.push(updatedNote);
    }

    this.scheduleSave();
    return updatedNote;
  }

  public deleteNote(id: string): void {
    this.data.notes = this.data.notes.filter((n) => n.id !== id);
    this.scheduleSave();
  }

  public updateBounds(id: string, bounds: { x: number; y: number; width: number; height: number }): void {
    const note = this.getNote(id);
    if (note) {
      note.x = bounds.x;
      note.y = bounds.y;
      note.width = bounds.width;
      note.height = bounds.height;
      note.updatedAt = Date.now();
      this.scheduleSave();
    }
  }

  public getSettings(): AppSettings {
    return this.data.settings || DEFAULT_SETTINGS;
  }

  public saveSettings(settings: Partial<AppSettings>): AppSettings {
    this.data.settings = {
      ...DEFAULT_SETTINGS,
      ...this.data.settings,
      ...settings,
    };
    this.scheduleSave();
    return this.data.settings;
  }

  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.flushToDisk();
    }, 250);
  }

  public flushToDisk(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write notes to disk:', err);
    }
  }
}
