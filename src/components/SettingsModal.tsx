import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Pin } from 'lucide-react';
import { MACOS_COLOR_PRESETS } from '../hooks/useSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedColor: string;
  onSelectColor: (hex: string) => void;
}

// Convert HSL (Hue, Saturation, Lightness) to HEX
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Estimate Hue from HEX
function hexToHue(hex: string): number {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return 35; // Default amber hue

  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  if (d === 0) return 0;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return h;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  pinnedColor,
  onSelectColor,
}) => {
  const [hue, setHue] = useState<number>(() => hexToHue(pinnedColor));
  const [hexInput, setHexInput] = useState<string>(pinnedColor);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexInput(pinnedColor);
    setHue(hexToHue(pinnedColor));
  }, [pinnedColor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value, 10);
    setHue(newHue);
    // 92% saturation and 54% lightness gives ideal vibrant dark mode accent
    const newHex = hslToHex(newHue, 92, 54);
    setHexInput(newHex);
    onSelectColor(newHex);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onSelectColor(val);
      setHue(hexToHue(val));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-2 bg-black/40 backdrop-blur-[4px] animate-fadeIn select-none no-drag-region">
      {/* macOS Popover Sheet */}
      <div
        ref={modalRef}
        className="w-full max-w-[240px] max-h-[calc(100%-10px)] overflow-y-auto bg-[#1e1e24]/94 border border-white/12 rounded-xl p-3 shadow-2xl backdrop-blur-3xl text-white/90 transform transition-all animate-scaleUp"
      >
        {/* macOS Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-2.5">
          <span className="text-[11.5px] font-medium tracking-wide text-white/85">
            Note Preferences
          </span>
          <button
            onClick={onClose}
            className="w-4 h-4 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Section: Pinned Color */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-medium text-white/60">
              Pinned Accent
            </span>
            <div className="flex items-center gap-1 text-[10px] text-white/40">
              <Pin className="w-2.5 h-2.5" style={{ color: pinnedColor }} />
              <span>Active</span>
            </div>
          </div>

          {/* Small 12-Color macOS Swatches Grid */}
          <div className="grid grid-cols-6 gap-1.5 py-0.5 justify-items-center">
            {MACOS_COLOR_PRESETS.map((preset) => {
              const isSelected =
                pinnedColor.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.hex}
                  onClick={() => onSelectColor(preset.hex)}
                  title={preset.name}
                  className={`w-[19px] h-[19px] rounded-full flex items-center justify-center transition-all hover:scale-115 active:scale-95 relative ${
                    isSelected
                      ? 'ring-2 ring-white/90 ring-offset-1 ring-offset-[#1e1e24]'
                      : 'hover:opacity-90'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                >
                  {isSelected && (
                    <Check className="w-2.5 h-2.5 text-black drop-shadow stroke-[3]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Dark Mode Custom Spectrum (No White Browser Popups!) */}
          <div className="pt-2 border-t border-white/[0.07] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-white/50">
              <span>Custom Spectrum</span>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={hexInput}
                  onChange={handleHexChange}
                  maxLength={7}
                  className="w-16 px-1 py-0.5 bg-black/40 border border-white/15 rounded text-[10px] font-mono text-white/80 text-center uppercase outline-none focus:border-white/40"
                />
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-inner flex-shrink-0"
                  style={{ backgroundColor: pinnedColor }}
                />
              </div>
            </div>

            {/* Dark Hue Slider */}
            <input
              type="range"
              min="0"
              max="360"
              value={hue}
              onChange={handleHueChange}
              className="mac-hue-slider w-full h-2 rounded-full cursor-pointer appearance-none block"
            />
          </div>

          {/* Compact Mini Live Preview */}
          <div
            className="p-1.5 rounded-lg border bg-black/25 flex items-center justify-between text-[10px] transition-colors"
            style={{
              borderColor: `${pinnedColor}70`,
              boxShadow: `0 0 10px ${pinnedColor}18`,
            }}
          >
            <div className="flex items-center gap-1 text-white/70">
              <Pin className="w-3 h-3" style={{ color: pinnedColor }} />
              <span>Preview</span>
            </div>
            <span
              className="px-1.5 py-0.2 rounded text-[9px] font-medium tracking-wide uppercase"
              style={{
                backgroundColor: `${pinnedColor}20`,
                color: pinnedColor,
              }}
            >
              Pinned
            </span>
          </div>
        </div>

        {/* macOS Action Button */}
        <div className="mt-2.5 pt-2 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-0.5 text-[11px] font-medium bg-white/10 hover:bg-white/18 active:bg-white/25 text-white/90 rounded-md border border-white/10 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
