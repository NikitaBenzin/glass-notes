import { useState, useEffect, useCallback } from 'react';

export const MACOS_COLOR_PRESETS = [
  { name: 'Amber Gold', hex: '#f59e0b' },
  { name: 'Tangerine', hex: '#ff9500' },
  { name: 'Coral Red', hex: '#ff3b30' },
  { name: 'Apple Rose', hex: '#ff2d55' },
  { name: 'Purple', hex: '#af52de' },
  { name: 'Indigo', hex: '#5856d6' },
  { name: 'Apple Blue', hex: '#007aff' },
  { name: 'Sky Cyan', hex: '#32ade6' },
  { name: 'Teal', hex: '#30b0c7' },
  { name: 'Mint', hex: '#00c7be' },
  { name: 'Green', hex: '#34c759' },
  { name: 'Graphite', hex: '#8e8e93' },
];

export const PINNED_COLOR_PRESETS = MACOS_COLOR_PRESETS;

export function useSettings() {
  const [pinnedColor, setPinnedColor] = useState<string>('#f59e0b');
  const [unpinnedOpacity, setUnpinnedOpacity] = useState<number>(95);
  const [pinnedOpacity, setPinnedOpacity] = useState<number>(70);

  useEffect(() => {
    if (window.electron?.getSettings) {
      window.electron.getSettings().then((settings) => {
        if (settings?.pinnedColor) {
          setPinnedColor(settings.pinnedColor);
        }
        if (typeof settings?.unpinnedOpacity === 'number') {
          setUnpinnedOpacity(settings.unpinnedOpacity);
        }
        if (typeof settings?.pinnedOpacity === 'number') {
          setPinnedOpacity(settings.pinnedOpacity);
        }
      });

      const unsubscribe = window.electron.onSettingsChanged((newSettings) => {
        if (newSettings?.pinnedColor) {
          setPinnedColor(newSettings.pinnedColor);
        }
        if (typeof newSettings?.unpinnedOpacity === 'number') {
          setUnpinnedOpacity(newSettings.unpinnedOpacity);
        }
        if (typeof newSettings?.pinnedOpacity === 'number') {
          setPinnedOpacity(newSettings.pinnedOpacity);
        }
      });

      return () => {
        unsubscribe();
      };
    } else {
      const savedColor = localStorage.getItem('glassnotes_pinned_color');
      if (savedColor) {
        setPinnedColor(savedColor);
      }
      const savedUnpinnedOpacity = localStorage.getItem('glassnotes_unpinned_opacity');
      if (savedUnpinnedOpacity) {
        setUnpinnedOpacity(parseInt(savedUnpinnedOpacity, 10));
      }
      const savedPinnedOpacity = localStorage.getItem('glassnotes_pinned_opacity');
      if (savedPinnedOpacity) {
        setPinnedOpacity(parseInt(savedPinnedOpacity, 10));
      }
    }
  }, []);

  const updatePinnedColor = useCallback((color: string) => {
    setPinnedColor(color);
    if (window.electron?.saveSettings) {
      window.electron.saveSettings({ pinnedColor: color });
    } else {
      localStorage.setItem('glassnotes_pinned_color', color);
    }
  }, []);

  const updateUnpinnedOpacity = useCallback((opacity: number) => {
    setUnpinnedOpacity(opacity);
    if (window.electron?.saveSettings) {
      window.electron.saveSettings({ unpinnedOpacity: opacity });
    } else {
      localStorage.setItem('glassnotes_unpinned_opacity', opacity.toString());
    }
  }, []);

  const updatePinnedOpacity = useCallback((opacity: number) => {
    setPinnedOpacity(opacity);
    if (window.electron?.saveSettings) {
      window.electron.saveSettings({ pinnedOpacity: opacity });
    } else {
      localStorage.setItem('glassnotes_pinned_opacity', opacity.toString());
    }
  }, []);

  return {
    pinnedColor,
    unpinnedOpacity,
    pinnedOpacity,
    updatePinnedColor,
    updateUnpinnedOpacity,
    updatePinnedOpacity,
  };
}
