import React from 'react';
import { TrafficLights } from './TrafficLights';
import { Pin, Settings } from 'lucide-react';

interface NoteHeaderProps {
  onClose: () => void;
  onTogglePin: () => void;
  onAdd: () => void;
  onOpenSettings: () => void;
  isPinned: boolean;
  pinnedColor?: string;
  updatedAt?: number;
}

export const NoteHeader: React.FC<NoteHeaderProps> = ({
  onClose,
  onTogglePin,
  onAdd,
  onOpenSettings,
  isPinned,
  pinnedColor = '#f59e0b',
  updatedAt,
}) => {
  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <header className="drag-region flex items-center justify-between px-3.5 py-2 border-b border-white/[0.06] select-none h-9">
      {/* Left controls: Traffic Lights */}
      <TrafficLights
        onClose={onClose}
        onTogglePin={onTogglePin}
        onAdd={onAdd}
        isPinned={isPinned}
        pinnedColor={pinnedColor}
      />

      {/* Center: Subtle Title / Date */}
      <div className="flex items-center gap-1 text-[11px] font-medium tracking-wide text-white/40 pointer-events-none">
        {isPinned && (
          <Pin
            className="w-3 h-3 inline-block mr-0.5 animate-pulse"
            style={{ color: pinnedColor }}
          />
        )}
        <span>{formattedDate || 'Sticky Note'}</span>
      </div>

      {/* Right controls: Settings Button */}
      <div className="flex items-center justify-end w-10 no-drag-region">
        <button
          onClick={onOpenSettings}
          title="Preferences / Settings"
          className="w-5 h-5 rounded flex items-center justify-center text-white/35 hover:text-white/90 hover:bg-white/10 active:scale-95 transition-all"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
