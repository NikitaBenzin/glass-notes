import React, { useEffect } from 'react';
import { NoteHeader } from './components/NoteHeader';
import { NoteEditor } from './components/NoteEditor';
import { SettingsWindow } from './components/SettingsWindow';
import { useNote } from './hooks/useNote';
import { useSettings } from './hooks/useSettings';

export const App: React.FC = () => {
  // Check if this window instance is the dedicated Settings window
  const isSettingsRoute =
    new URLSearchParams(window.location.search).get('settings') === 'true';

  if (isSettingsRoute) {
    return <SettingsWindow />;
  }

  return <NoteApp />;
};

const NoteApp: React.FC = () => {
  const { pinnedColor, unpinnedOpacity, pinnedOpacity } = useSettings();

  const {
    noteId,
    content,
    isPinned,
    updatedAt,
    isClosing,
    isLoaded,
    updateContent,
    handleCreateNote,
    handleDeleteNote,
    handleTogglePin,
  } = useNote();

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNote();
      } else if (isCmdOrCtrl && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        handleDeleteNote();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleCreateNote, handleDeleteNote]);

  const handleOpenSettings = () => {
    if (window.electron?.openSettings) {
      window.electron.openSettings(noteId);
    }
  };

  if (!isLoaded) {
    return null; // Brief instantaneous mount
  }

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Unpinned opacity default: 95%; Pinned opacity default: 70% with accent border
  const cardBg = isPinned
    ? `rgba(24, 24, 28, ${(pinnedOpacity ?? 70) / 100})`
    : `rgba(24, 24, 28, ${(unpinnedOpacity ?? 95) / 100})`;

  return (
    <div className="window-canvas relative">
      <main
        className={`glass-card ${isPinned ? 'is-pinned' : ''} ${
          isClosing ? 'is-closing' : ''
        }`}
        style={{
          backgroundColor: cardBg,
          borderColor: isPinned ? `${pinnedColor}80` : undefined,
        }}
      >
        {/* macOS Draggable Header with Traffic Lights & Settings Button */}
        <NoteHeader
          onClose={handleDeleteNote}
          onTogglePin={handleTogglePin}
          onAdd={handleCreateNote}
          onOpenSettings={handleOpenSettings}
          isPinned={isPinned}
          pinnedColor={pinnedColor}
          updatedAt={updatedAt}
        />

        {/* Real-time Live Markdown WYSIWYG Editor */}
        <NoteEditor
          content={content}
          onChange={updateContent}
          onNewNote={handleCreateNote}
          onCloseNote={handleDeleteNote}
        />

        {/* Minimalist Hover-Reveal Footer */}
        <footer className="note-footer">
          <span>
            {wordCount} {wordCount === 1 ? 'word' : 'words'} · {charCount} chars
          </span>
          <span className="text-[10px] text-white/30 tracking-tight mr-4">
            Saved
          </span>
        </footer>

        {/* Corner resize indicator */}
        <div className="resize-grip" />
      </main>
    </div>
  );
};

export default App;
