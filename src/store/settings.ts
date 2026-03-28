import type { AppSettings, WidthPreset } from '../types';

const STORAGE_KEY = 'simplshot_settings';

const defaultPresets: WidthPreset[] = [
  { id: '1', name: 'Full Width', width: 1440, isEnabled: true },
  { id: '2', name: 'Article', width: 800, isEnabled: true },
  { id: '3', name: 'Social', width: 1200, isEnabled: true },
  { id: '4', name: 'Mobile', width: 390, isEnabled: true },
];

export const defaultSettings: AppSettings = {
  screenshotFormat: 'png',
  screenshotSavePath: '~/Pictures/SimplShot',
  openEditorAfterCapture: true,
  startAtLogin: false,
  widthPresets: defaultPresets,
  screenshotTemplate: {
    isEnabled: false,
    wallpaperSource: {
      type: 'gradient',
      stops: [
        { color: '#667eea', position: 0 },
        { color: '#764ba2', position: 1 },
      ],
      angle: 135,
    },
    padding: 40,
    cornerRadius: 12,
  },
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch {
    // Fall through to defaults
  }
  return defaultSettings;
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
