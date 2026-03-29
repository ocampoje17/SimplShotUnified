import type { AppSettings, WidthPreset, AspectRatio } from '../types';

const STORAGE_KEY = 'simplshot_settings';

const defaultWidthPresets: WidthPreset[] = [
  { id: '1', label: '960px', width: 960, isBuiltIn: true, isEnabled: true },
  { id: '2', label: '1280px', width: 1280, isBuiltIn: true, isEnabled: true },
  { id: '3', label: '1920px', width: 1920, isBuiltIn: true, isEnabled: true },
];

const defaultAspectRatios: AspectRatio[] = [
  { id: 'r1', widthComponent: 16, heightComponent: 9, isBuiltIn: true, isEnabled: true },
  { id: 'r2', widthComponent: 4,  heightComponent: 3, isBuiltIn: true, isEnabled: true },
  { id: 'r3', widthComponent: 3,  heightComponent: 2, isBuiltIn: true, isEnabled: true },
  { id: 'r4', widthComponent: 1,  heightComponent: 1, isBuiltIn: true, isEnabled: true },
];

export const defaultSettings: AppSettings = {
  screenshotFormat: 'png',
  screenshotSavePath: '~/Desktop/SimplShot Screenshots',
  openEditorAfterCapture: true,
  startAtLogin: false,
  widthPresets: defaultWidthPresets,
  aspectRatios: defaultAspectRatios,
  screenshotTemplate: {
    isEnabled: false,
    wallpaperSource: { type: 'builtInGradient', gradient: 'oceanDreams' },
    padding: 80,
    cornerRadius: 24,
  },
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as Partial<AppSettings>;
      const storedTemplate = stored.screenshotTemplate ?? {};
      // Migrate legacy WallpaperSource that used `type: 'gradient'` / `type: 'solidColor'`
      let wallpaperSource: AppSettings['screenshotTemplate']['wallpaperSource'] | undefined =
        (storedTemplate as Partial<AppSettings['screenshotTemplate']>).wallpaperSource;
      const legacyType = (wallpaperSource as unknown as { type?: string } | undefined)?.type;
      if (legacyType === 'gradient' || legacyType === 'solidColor') {
        wallpaperSource = { type: 'builtInGradient', gradient: 'oceanDreams' };
      }
      if (!wallpaperSource) wallpaperSource = defaultSettings.screenshotTemplate.wallpaperSource;
      return {
        ...defaultSettings,
        ...stored,
        aspectRatios: stored.aspectRatios ?? defaultSettings.aspectRatios,
        screenshotTemplate: {
          ...defaultSettings.screenshotTemplate,
          ...storedTemplate,
          wallpaperSource,
        },
      };
    }
  } catch {
    // Fall through to defaults
  }
  return defaultSettings;
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
