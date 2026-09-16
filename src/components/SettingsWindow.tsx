import React, { useState, useEffect } from 'react';
import { Check, Pin } from 'lucide-react';
import { useSettings, MACOS_COLOR_PRESETS } from '../hooks/useSettings';

// Convert HSL to HEX
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
  if (isNaN(num)) return 35; // Amber default

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

export const SettingsWindow: React.FC = () => {
  const {
    pinnedColor,
    unpinnedOpacity,
    pinnedOpacity,
    updatePinnedColor,
    updateUnpinnedOpacity,
    updatePinnedOpacity,
  } = useSettings();
  const [hue, setHue] = useState<number>(() => hexToHue(pinnedColor));
  const [hexInput, setHexInput] = useState<string>(pinnedColor);

  useEffect(() => {
    setHexInput(pinnedColor);
    setHue(hexToHue(pinnedColor));
  }, [pinnedColor]);

  const handleClose = () => {
    if (window.electron?.closeSettings) {
      window.electron.closeSettings();
    } else {
      window.close();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value, 10);
    setHue(newHue);
    const newHex = hslToHex(newHue, 92, 54);
    setHexInput(newHex);
    updatePinnedColor(newHex);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      updatePinnedColor(val);
      setHue(hexToHue(val));
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden p-0 m-0 bg-transparent flex select-none">
      <main className="flex-1 flex flex-col bg-[#1c1c22]/95 border border-white/12 rounded-2xl shadow-2xl backdrop-blur-3xl text-white/90 overflow-hidden">
        {/* macOS Draggable Header */}
        <header className="drag-region flex items-center justify-between px-3 h-8 border-b border-white/[0.07] flex-shrink-0">
          {/* Traffic light red close button */}
          <div className="no-drag-region flex items-center">
            <button
              onClick={handleClose}
              title="Close (Esc)"
              className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] hover:brightness-110 active:scale-90 transition-all flex items-center justify-center group cursor-pointer"
            >
              <span className="opacity-0 group-hover:opacity-90 text-[8px] text-black font-bold leading-none">
                ✕
              </span>
            </button>
          </div>

          {/* Centered Title */}
          <span className="text-[11px] font-medium tracking-wide text-white/70 pointer-events-none">
            Preferences
          </span>

          <div className="w-3 pointer-events-none" />
        </header>

        {/* Settings Body - Exactly fits height, ZERO scrollbars */}
        <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden">
          {/* Section: Color Swatches */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-white/60">
                Pinned Note Accent
              </span>
              <div className="flex items-center gap-1 text-[9.5px] text-white/40">
                <Pin className="w-2.5 h-2.5" style={{ color: pinnedColor }} />
                <span>Active</span>
              </div>
            </div>

            {/* 12 Small macOS Swatches */}
            <div className="grid grid-cols-6 gap-1.5 py-0.5 justify-items-center">
              {MACOS_COLOR_PRESETS.map((preset) => {
                const isSelected =
                  pinnedColor.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    onClick={() => updatePinnedColor(preset.hex)}
                    title={preset.name}
                    className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-transform hover:scale-115 active:scale-95 relative cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-white/95 ring-offset-1 ring-offset-[#1c1c22]'
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
          </div>

          {/* Section: Custom Spectrum & Hue Slider */}
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

            <input
              type="range"
              min="0"
              max="360"
              value={hue}
              onChange={handleHueChange}
              className="mac-hue-slider w-full h-2 rounded-full cursor-pointer appearance-none block"
            />
          </div>

          {/* Section: Window Opacity Sliders (Unpinned & Pinned) */}
          <div className="pt-2 border-t border-white/[0.07] space-y-2">
            {/* Unpinned Opacity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-white/60">
                <span>Unpinned Opacity</span>
                <span className="font-mono text-[9.5px] px-1.5 py-0.2 rounded bg-white/10 text-white/90">
                  {unpinnedOpacity}%
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="5"
                value={unpinnedOpacity}
                onChange={(e) => updateUnpinnedOpacity(parseInt(e.target.value, 10))}
                className="mac-opacity-slider w-full block cursor-pointer"
              />
            </div>

            {/* Pinned Opacity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-white/60">
                <span className="flex items-center gap-1">
                  <Pin className="w-2.5 h-2.5" style={{ color: pinnedColor }} />
                  <span>Pinned Opacity</span>
                </span>
                <span className="font-mono text-[9.5px] px-1.5 py-0.2 rounded bg-white/10 text-white/90">
                  {pinnedOpacity}%
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="5"
                value={pinnedOpacity}
                onChange={(e) => updatePinnedOpacity(parseInt(e.target.value, 10))}
                className="mac-opacity-slider w-full block cursor-pointer"
              />
            </div>
          </div>

          {/* Live Preview Chip */}
          <div
            className="p-1.5 rounded-lg border flex items-center justify-between text-[10px] transition-colors"
            style={{
              backgroundColor: `rgba(24, 24, 28, ${(pinnedOpacity ?? 70) / 100})`,
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
              Pinned ({pinnedOpacity}%)
            </span>
          </div>

          {/* Done Button */}
          <div className="pt-1 border-t border-white/[0.07] flex justify-end">
            <button
              onClick={handleClose}
              className="px-3.5 py-0.5 text-[11px] font-medium bg-white/10 hover:bg-white/18 active:bg-white/25 text-white/90 rounded-md border border-white/10 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
