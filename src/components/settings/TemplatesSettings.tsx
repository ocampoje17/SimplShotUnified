import type React from 'react';
import type { AppSettings, BuiltInGradient, ScreenshotTemplate } from '../../types';
import { BUILT_IN_GRADIENTS, BUILT_IN_GRADIENT_NAMES } from '../../types';

interface Props {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
}

const GRADIENT_KEYS: BuiltInGradient[] = [
  'sunsetBlaze', 'oceanDreams', 'purpleHaze', 'forestMist', 'coralReef',
  'mintFresh', 'goldenHour', 'midnightSky', 'darkEmber', 'carbonSteel',
];

const SOLID_KEYS: BuiltInGradient[] = [
  'solidWhite', 'solidBlack', 'solidGray', 'solidRed', 'solidOrange',
  'solidYellow', 'solidGreen', 'solidBlue', 'solidPurple', 'solidPink',
];

function gradientCss(key: BuiltInGradient): string {
  const def = BUILT_IN_GRADIENTS[key];
  if (def.colors.length === 1) return def.colors[0];
  const stops = def.colors.join(', ');
  return `linear-gradient(${def.angle}deg, ${stops})`;
}

function SwatchGrid({
  keys,
  selected,
  onSelect,
}: {
  keys: BuiltInGradient[];
  selected: BuiltInGradient;
  onSelect: (g: BuiltInGradient) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {keys.map(key => (
        <button
          key={key}
          title={BUILT_IN_GRADIENT_NAMES[key]}
          onClick={() => onSelect(key)}
          className={`w-12 h-8 rounded-md transition-all ${
            selected === key ? 'ring-2 ring-blue-500 ring-offset-1 scale-105' : ''
          } ${key === 'solidWhite' ? 'border border-gray-300' : ''}`}
          style={{ background: gradientCss(key) }}
        />
      ))}
    </div>
  );
}

function getPreviewStyle(template: ScreenshotTemplate): React.CSSProperties {
  if (!template.isEnabled) return { background: '#e5e7eb' };
  const src = template.wallpaperSource;
  if (src.type === 'builtInGradient') {
    return { background: gradientCss(src.gradient) };
  }
  return { background: '#e5e7eb' };
}

export default function TemplatesSettings({ settings, onChange }: Props) {
  const template = settings.screenshotTemplate;

  const updateTemplate = (t: Partial<ScreenshotTemplate>) => {
    onChange({ ...settings, screenshotTemplate: { ...template, ...t } });
  };

  const selectedGradient =
    template.wallpaperSource.type === 'builtInGradient'
      ? template.wallpaperSource.gradient
      : 'oceanDreams';

  const selectGradient = (g: BuiltInGradient) =>
    updateTemplate({ wallpaperSource: { type: 'builtInGradient', gradient: g } });

  const previewStyle = getPreviewStyle(template);

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Background Templates</h2>

      {/* Enable toggle */}
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={template.isEnabled}
          onChange={e => updateTemplate({ isEnabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <span className="text-sm font-medium text-gray-700">Enable background template</span>
      </label>

      {/* Preview */}
      <div
        className="w-full h-36 rounded-xl shadow-inner flex items-center justify-center overflow-hidden"
        style={previewStyle}
      >
        <div
          className="bg-white shadow-2xl"
          style={{
            width: `calc(100% - ${template.padding * 2}px)`,
            maxWidth: 300,
            height: 80,
            borderRadius: template.cornerRadius,
            opacity: 0.9,
          }}
        />
      </div>

      {template.isEnabled && (
        <>
          {/* Gradients */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Gradients</label>
            <SwatchGrid keys={GRADIENT_KEYS} selected={selectedGradient} onSelect={selectGradient} />
          </div>

          {/* Solid Colors */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Solid Colors</label>
            <SwatchGrid keys={SOLID_KEYS} selected={selectedGradient} onSelect={selectGradient} />
          </div>

          {/* Selected name */}
          <p className="text-xs text-gray-500">
            Selected: <span className="font-medium">{BUILT_IN_GRADIENT_NAMES[selectedGradient]}</span>
          </p>

          {/* Padding */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-gray-700">Padding</label>
              <span className="text-sm text-gray-500">{template.padding}px</span>
            </div>
            <input
              type="range"
              min={20}
              max={200}
              value={template.padding}
              onChange={e => updateTemplate({ padding: parseInt(e.target.value) })}
              className="w-full accent-blue-600"
            />
          </div>

          {/* Corner Radius */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-gray-700">Screenshot Corner Radius</label>
              <span className="text-sm text-gray-500">{template.cornerRadius}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={template.cornerRadius}
              onChange={e => updateTemplate({ cornerRadius: parseInt(e.target.value) })}
              className="w-full accent-blue-600"
            />
          </div>
        </>
      )}
    </div>
  );
}
