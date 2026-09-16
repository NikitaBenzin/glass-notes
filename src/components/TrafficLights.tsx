import React from 'react';

interface TrafficLightsProps {
  onClose: () => void;
  onTogglePin: () => void;
  onAdd: () => void;
  isPinned: boolean;
  pinnedColor?: string;
}

export const TrafficLights: React.FC<TrafficLightsProps> = ({
  onClose,
  onTogglePin,
  onAdd,
  isPinned,
  pinnedColor,
}) => {
  return (
    <div className="traffic-group no-drag-region">
      {/* Red: Close / Delete Note */}
      <div
        className="traffic-light close"
        onClick={onClose}
        title="Delete note (Ctrl+W)"
      >
        <span className="traffic-glyph text-[9px] select-none">✕</span>
      </div>

      {/* Yellow: Always on Top Toggle */}
      <div
        className={`traffic-light pin ${isPinned ? 'active' : ''}`}
        onClick={onTogglePin}
        title={isPinned ? 'Unpin from Top' : 'Pin Always-on-Top'}
        style={
          isPinned && pinnedColor
            ? {
                backgroundColor: pinnedColor,
                borderColor: `${pinnedColor}cc`,
                boxShadow: `0 0 8px ${pinnedColor}99`,
              }
            : undefined
        }
      >
        <span className="traffic-glyph text-[8px] select-none">
          {isPinned ? '●' : '−'}
        </span>
      </div>

      {/* Green: Add New Sticky Note */}
      <div
        className="traffic-light add"
        onClick={onAdd}
        title="New sticky note (Ctrl+N)"
      >
        <span className="traffic-glyph text-[10px] select-none leading-none mb-[1px]">+</span>
      </div>
    </div>
  );
};
