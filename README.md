# GlassNotes ✨

> A lightweight, minimalist macOS-style dark-mode sticky notes application for Windows, featuring instant WYSIWYG Markdown editing, autonomous frameless windows, and custom glassmorphic aesthetics.

---

## 🌟 Overview

**GlassNotes** brings the sleek, refined design language of macOS to Windows desktop notes. Every note runs as an independent, frameless, transparent glass card that can be freely dragged, pinned always-on-top, and resized anywhere on your screen.

With real-time **WYSIWYG Markdown**, you format your thoughts seamlessly without toggling between "Edit" and "Preview" modes — headers, bold, italics, code blocks, and interactive task checklists render instantly right under your cursor.

---

## 🛠️ Tech Stack

- **Desktop Framework:** [Electron](https://www.electronjs.org/) (Multi-window architecture, frameless transparent `BrowserWindow` instances, native system tray, low-level IPC bridge)
- **UI Library:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + Custom Vanilla CSS (Frosted glassmorphism with `backdrop-filter: blur(36px) saturate(190%)`, specular rim highlights, macOS traffic-light window controls)
- **WYSIWYG Editor:** [TipTap v3](https://tiptap.dev/) + ProseMirror + `@tiptap/extension-placeholder` + `tiptap-markdown` (Instant live formatting as you type)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Bundler & Build Tooling:** [Vite 8](https://vitejs.dev/) + `vite-plugin-electron` + `electron-builder`

---

## ✨ Features

- 🪟 **Autonomous Frameless Windows:** Each sticky note is a dedicated, borderless desktop window with 16px smooth rounded corners and zero square background artifacts.
- ✍️ **Live Markdown WYSIWYG (Notion/Obsidian Style):**
  - `# ` creates large headings, `## ` medium headings, `### ` subheadings.
  - `**bold**`, `*italic*`, and `~~strikethrough~~` format instantly.
  - `- ` or `* ` creates bulleted lists; `1. ` creates ordered numbered lists.
  - `[ ] ` creates interactive checklist tasks with clickable checkboxes.
  - \`code\` chips and ```` code blocks.
- 🚀 **First-Launch Welcome Note:** Launches out-of-the-box with a pre-configured Markdown formatting cheat sheet.
- 💭 **Dynamic Ambient Placeholders:** Empty new notes start completely blank with a randomly selected ambient placeholder phrase that matches the frosted-glass opacity:
  - *"Quick note..."*
  - *"Next weekend project..."*
  - *"Dark-mode aesthetics..."*
  - *"Road to independence..."*
  Disappears the exact millisecond you begin typing.
- 📌 **Always-on-Top Pinning:** Pin crucial notes to float above all Windows apps and games with customizable opacity.
- 🎨 **External Preferences Window:**
  - Dedicated singleton window outside the active note.
  - 12 Apple system color presets + custom 360° hue spectrum slider for pinned notes.
  - **Dual Opacity Controls:** Independent sliders for **Unpinned Opacity** (default: 95%) and **Pinned Opacity** (default: 70%).
  - Live real-time preview chip and instant IPC synchronization across all open notes.
- 💾 **Automatic State Persistence:** Keystrokes, window positions `(x, y)`, and dimensions `(w, h)` are debounced and saved to `%APPDATA%/GlassNotes/notes-data.json`.
- ⌨️ **Keyboard Shortcuts:**
  - `Ctrl + N`: Create a new note
  - `Ctrl + W`: Close/delete the active note
  - `Ctrl + Alt + N`: Global hotkey to summon a note from anywhere in Windows
  - `Esc`: Close Preferences window

---

## 🚀 Getting Started Locally (Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- Windows 10 or Windows 11

### 1. Install Dependencies
Clone the repository or navigate to the project root directory, then run:

```bash
npm install
```

### 2. Start Development Server
Run the local Vite development server with Electron hot-module replacement (HMR):

```bash
npm run dev
```

The application will launch with a default note window on your desktop. Edits in `src/` or `electron/` reload automatically.

---

## 📦 Packaging and Building Standalone Executables (.exe)

GlassNotes is configured with `electron-builder` to package standalone Windows executables with zero external dependencies required on the target machine.

### Build Scripts in `package.json`

| Command | Output Type | Description |
| :--- | :--- | :--- |
| `npm run package:portable` | **Portable `.exe`** | Creates a single standalone `.exe` that runs anywhere without installation. |
| `npm run package:nsis` | **Setup Installer `.exe`** | Creates an official Windows installer with desktop & Start menu shortcuts. |
| `npm run package:dir` | **Unpacked Directory** | Unpacks the executable and runtime files to a local folder for rapid testing. |
| `npm run package` | **Both Targets** | Builds both NSIS installer and Portable `.exe` in one step. |

---

### Step-by-Step Instructions

#### Option A: Build a Single Portable `.exe` (Recommended for Personal Use)
To produce a portable `.exe` that you can place on a USB drive or run on any Windows PC:

1. Open your terminal in the project root:
   ```bash
   npm run package:portable
   ```
2. The compilation pipeline will:
   - Run the TypeScript compiler (`tsc`) to validate types.
   - Bundle the React frontend with Vite into `dist/`.
   - Bundle the Electron main and preload processes into `dist-electron/`.
   - Package everything into a standalone executable using `electron-builder`.
3. Locate the generated executable:
   ```
   release/GlassNotes 1.0.0.exe
   ```
4. Double-click to run immediately — no installation needed.

---

#### Option B: Build a Windows Installer (`Setup.exe`)
To generate a professional installer with directory selection and desktop shortcuts:

1. Run:
   ```bash
   npm run package:nsis
   ```
2. Locate the generated setup file:
   ```
   release/GlassNotes Setup 1.0.0.exe
   ```
3. Run the installer to install GlassNotes to `C:\Users\<User>\AppData\Local\Programs\GlassNotes`.

---

#### Option C: Build an Unpacked Testing Directory
To quickly test the production bundle without waiting for compression:

1. Run:
   ```bash
   npm run package:dir
   ```
2. Launch the unpacked binary directly:
   ```
   release/win-unpacked/GlassNotes.exe
   ```

---

## 📁 Project Architecture

```
pc-notes/
├── electron/
│   ├── main.ts              # Multi-window orchestrator, system tray, IPC handlers
│   ├── preload.ts           # Secure context bridge exposing IPC methods to window.electron
│   ├── store.ts             # Persistent JSON storage engine (%APPDATA%/GlassNotes/notes-data.json)
│   └── tsconfig.json        # Electron TypeScript configuration
├── src/
│   ├── components/
│   │   ├── NoteEditor.tsx    # TipTap WYSIWYG editor with live Markdown & dynamic placeholders
│   │   ├── NoteHeader.tsx    # Draggable title bar with macOS traffic lights & preferences button
│   │   ├── SettingsWindow.tsx# Dedicated preferences window (accent colors & dual opacity sliders)
│   │   └── TrafficLights.tsx # macOS red, yellow, green interactive buttons
│   ├── hooks/
│   │   ├── useNote.ts        # Note lifecycle, auto-save debounce, and pin state management
│   │   └── useSettings.ts    # Accent color & unpinned/pinned opacity state synchronizer
│   ├── styles/
│   │   └── index.css         # Frosted glassmorphism, typography, sliders & placeholder CSS
│   ├── types/
│   │   └── electron.d.ts     # TypeScript interface for window.electron APIs
│   ├── App.tsx               # Root view router (switches between Note view and Settings view)
│   ├── main.tsx              # React DOM entry point
│   └── vite-env.d.ts         # Vite client type definitions
├── package.json              # Project scripts, dependencies, and electron-builder build config
├── vite.config.ts            # Vite + React + Tailwind CSS + Electron plugin configuration
└── tsconfig.json             # React TypeScript configuration
```

---

## 📄 License

MIT © [NikitaBenzin](https://github.com/NikitaBenzin)
