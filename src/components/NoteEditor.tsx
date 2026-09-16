import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

interface NoteEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  onNewNote?: () => void;
  onCloseNote?: () => void;
}

export const PLACEHOLDER_PHRASES = [
  'Quick note...',
  'Next weekend project...',
  'Dark-mode aesthetics...',
  'Road to independence...',
];

export const NoteEditor: React.FC<NoteEditorProps> = ({
  content,
  onChange,
  onNewNote,
  onCloseNote,
}) => {
  const isUpdatingRef = useRef(false);

  // Randomly select one of the designated placeholder phrases for empty notes
  const [placeholderText] = React.useState<string>(() => {
    const randomIndex = Math.floor(Math.random() * PLACEHOLDER_PHRASES.length);
    return PLACEHOLDER_PHRASES[randomIndex];
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: '-',
        linkify: true,
      }),
      Placeholder.configure({
        placeholder: placeholderText,
        emptyEditorClass: 'is-editor-empty',
        emptyNodeClass: 'is-empty',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'note-tiptap-editor no-drag-region focus:outline-none',
        spellcheck: 'false',
      },
      handleKeyDown: (_view, event) => {
        const isCmdOrCtrl = event.ctrlKey || event.metaKey;
        // Ctrl+N for new note
        if (isCmdOrCtrl && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'n') {
          event.preventDefault();
          onNewNote?.();
          return true;
        }
        // Ctrl+W for closing note
        if (isCmdOrCtrl && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'w') {
          event.preventDefault();
          onCloseNote?.();
          return true;
        }
        return false;
      },
      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement;
        const link = target.closest('a');
        if (link && link.href) {
          event.preventDefault();
          if (window.electron?.openExternal) {
            window.electron.openExternal(link.href);
          } else {
            window.open(link.href, '_blank', 'noopener,noreferrer');
          }
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      isUpdatingRef.current = true;
      const md = (editor.storage as any).markdown?.getMarkdown?.() ?? editor.getHTML();
      onChange(md);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    },
  });

  // Sync content if changed externally (e.g. initial load or reset)
  useEffect(() => {
    if (editor && !editor.isDestroyed && !isUpdatingRef.current) {
      const currentMd = (editor.storage as any).markdown?.getMarkdown?.() ?? '';
      if (content !== currentMd && !editor.isFocused) {
        editor.commands.setContent(content || '');
      }
    }
  }, [content, editor]);

  // Focus editor on initial mount
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.commands.focus('end');
    }
  }, [editor]);

  return (
    <div
      onClick={() => {
        if (editor && !editor.isFocused) {
          editor.commands.focus('end');
        }
      }}
      className="note-editor-wrapper no-drag-region"
    >
      <EditorContent editor={editor} />
    </div>
  );
};
