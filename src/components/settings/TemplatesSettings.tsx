import React from 'react';
import type { AppSettings, ScreenshotTemplate, WallpaperSource, GradientStop } from '../../types';

interface Props {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
}

export default function TemplatesSettings({ settings, onChange }: Props) {
  const template = settings.screenshotTemplate;

  const updateTemplate = (t: Partial<ScreenshotTemplate>) => {
    onChange({ ...settings, screenshotTemplate: { ...template, ...t } });
  };

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

      {template.isEnabled && (
        <>
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

          {/* Background Type */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Background Type</label>
            <div className="flex gap-2">
              {(['solidColor', 'gradient'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    if (type === 'solidColor') {
                      updateTemplate({ wallpaperSource: { type: 'solidColor', color: '#667eea' } });
                    } else {
                      updateTemplate({
                        wallpaperSource: {
                          type: 'gradient',
                          stops: [
                            { color: '#667eea', position: 0 },
                            { color: '#764ba2', position: 1 },
                          ],
                          angle: 135,
                        },
                      });
                    }
                  }}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    template.wallpaperSource?.type === type
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {type === 'solidColor' ? 'Solid Color' : 'Gradient'}
                </button>
              ))}
            </div>

            {template.wallpaperSource?.type === 'solidColor' && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Color:</label>
                <input
                  type="color"
                  value={(template.wallpaperSource as { type: 'solidColor'; color: string }).color}
                  onChange={e =>
                    updateTemplate({ wallpaperSource: { type: 'solidColor', color: e.target.value } })
                  }
                  className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                />
              </div>
            )}

            {template.wallpaperSource?.type === 'gradient' && (
              <GradientEditor
                source={template.wallpaperSource as { type: 'gradient'; stops: GradientStop[]; angle: number }}
                onChange={src => updateTemplate({ wallpaperSource: src })}
              />
            )}
          </div>

          {/* Padding */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-gray-700">Padding</label>
              <span className="text-sm text-gray-500">{template.padding}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={120}
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

function GradientEditor({
  source,
  onChange,
}: {
  source: { type: 'gradient'; stops: GradientStop[]; angle: number };
  onChange: (s: WallpaperSource) => void;
}) {
  return (
    <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Angle:</label>
        <input
          type="range"
          min={0}
          max={360}
          value={source.angle}
          onChange={e => onChange({ ...source, angle: parseInt(e.target.value) })}
          className="flex-1 accent-blue-600"
        />
        <span className="text-sm text-gray-500 w-12">{source.angle}°</span>
      </div>
      {source.stops.map((stop, i) => (
        <div key={i} className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Stop {i + 1}:</label>
          <input
            type="color"
            value={stop.color}
            onChange={e => {
              const stops = [...source.stops];
              stops[i] = { ...stop, color: e.target.value };
              onChange({ ...source, stops });
            }}
            className="w-10 h-8 rounded cursor-pointer border border-gray-300"
          />
        </div>
      ))}
    </div>
  );
}

function getPreviewStyle(template: ScreenshotTemplate): React.CSSProperties {
  if (!template.isEnabled || !template.wallpaperSource) {
    return { background: '#e5e7eb' };
  }
  const src = template.wallpaperSource;
  if (src.type === 'solidColor') {
    return { background: src.color };
  }
  if (src.type === 'gradient') {
    const stops = src.stops.map(s => `${s.color} ${s.position * 100}%`).join(', ');
    return { background: `linear-gradient(${src.angle}deg, ${stops})` };
  }
  return { background: '#e5e7eb' };
}
