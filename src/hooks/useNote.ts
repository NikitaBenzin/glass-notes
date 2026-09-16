import { useState, useEffect, useRef, useCallback } from 'react';

export function useNote() {
  const [noteId, setNoteId] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [updatedAt, setUpdatedAt] = useState<number>(Date.now());
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize note ID and data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || 'welcome-note';
    setNoteId(id);

    if (window.electron) {
      window.electron.getInitialNote(id).then((note) => {
        if (note) {
          setContent(note.content || '');
          setIsPinned(note.isPinned || false);
          setUpdatedAt(note.updatedAt || Date.now());
        }
        setIsLoaded(true);
      });

      const unsubscribe = window.electron.onPinChanged((pinned) => {
        setIsPinned(pinned);
      });

      return () => {
        unsubscribe();
      };
    } else {
      // Browser fallback for previewing
      const mockSaved = localStorage.getItem(`note_${id}`);
      if (mockSaved) {
        setContent(mockSaved);
      } else {
        setContent('# Welcome to GlassNotes ✨\n\n- macOS frosted glass aesthetic\n- Frameless transparent window\n- Auto-saving content and screen bounds');
      }
      setIsLoaded(true);
    }
  }, []);

  // Debounced save
  const updateContent = useCallback(
    (newContent: string) => {
      setContent(newContent);
      setUpdatedAt(Date.now());

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        if (window.electron && noteId) {
          window.electron.saveContent(noteId, newContent);
        } else if (noteId) {
          localStorage.setItem(`note_${noteId}`, newContent);
        }
      }, 250);
    },
    [noteId]
  );

  const handleCreateNote = useCallback(() => {
    if (window.electron) {
      window.electron.createNote(noteId);
    }
  }, [noteId]);

  const handleDeleteNote = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      if (window.electron && noteId) {
        window.electron.deleteNote(noteId);
      }
    }, 180);
  }, [noteId]);

  const handleTogglePin = useCallback(async () => {
    if (window.electron && noteId) {
      const nextPin = await window.electron.togglePin(noteId);
      setIsPinned(nextPin);
    } else {
      setIsPinned((prev) => !prev);
    }
  }, [noteId]);

  return {
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
  };
}
