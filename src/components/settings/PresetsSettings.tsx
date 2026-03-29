import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import type { AppSettings, WidthPreset, AspectRatio } from '../../types';

interface Props {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
}

// ─── Width Presets ────────────────────────────────────────────────────────────

function WidthPresets({ settings, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editWidth, setEditWidth] = useState('');

  const updatePresets = useCallback(
    (presets: WidthPreset[]) => onChange({ ...settings, widthPresets: presets }),
    [onChange, settings],
  );

  const startEdit = (preset: WidthPreset) => {
    setEditingId(preset.id);
    setEditLabel(preset.label);
    setEditWidth(preset.width.toString());
  };

  const addPreset = useCallback(() => {
    const newPreset: WidthPreset = {
      id: nanoid(),
      label: 'New Preset',
      width: 1200,
      isBuiltIn: false,
      isEnabled: true,
    };
    updatePresets([...settings.widthPresets, newPreset]);
    startEdit(newPreset);
  }, [updatePresets, settings.widthPresets]);

  const saveEdit = () => {
    if (!editingId) return;
    const parsedWidth = parseInt(editWidth);
    updatePresets(
      settings.widthPresets.map(p =>
        p.id === editingId
          ? { ...p, label: editLabel || `${parsedWidth}px`, width: Number.isNaN(parsedWidth) ? p.width : parsedWidth }
          : p,
      ),
    );
    setEditingId(null);
  };

  const deletePreset = (id: string) => updatePresets(settings.widthPresets.filter(p => p.id !== id));

  const togglePreset = (id: string) =>
    updatePresets(settings.widthPresets.map(p => (p.id === id ? { ...p, isEnabled: !p.isEnabled } : p)));

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-800">Width Presets</h3>
        <button
          onClick={addPreset}
          className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add
        </button>
      </div>

      <div className="space-y-1.5 flex-1">
        {settings.widthPresets.map(preset => (
          <div
            key={preset.id}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg"
          >
            <input
              type="checkbox"
              checked={preset.isEnabled}
              onChange={() => togglePreset(preset.id)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            {editingId === preset.id ? (
              <>
                <input
                  type="text"
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  placeholder="Label"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <input
                  type="number"
                  value={editWidth}
                  onChange={e => setEditWidth(e.target.value)}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500">px</span>
                <button
                  onClick={saveEdit}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <span className={`flex-1 text-sm truncate ${preset.isEnabled ? 'text-gray-800' : 'text-gray-400'}`}>
                  {preset.label}
                </span>
                {preset.isBuiltIn ? (
                  <span className="text-xs text-gray-400">Built-in</span>
                ) : (
                  <>
                    <span className="text-sm text-gray-500">{preset.width}px</span>
                    <button onClick={() => startEdit(preset)} className="p-1 text-gray-400 hover:text-gray-600 text-xs">✏️</button>
                    <button onClick={() => deletePreset(preset.id)} className="p-1 text-gray-400 hover:text-red-500 text-xs">🗑️</button>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Aspect Ratios ────────────────────────────────────────────────────────────

function AspectRatios({ settings, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editW, setEditW] = useState('');
  const [editH, setEditH] = useState('');

  const updateRatios = useCallback(
    (ratios: AspectRatio[]) => onChange({ ...settings, aspectRatios: ratios }),
    [onChange, settings],
  );

  const startEdit = (ratio: AspectRatio) => {
    setEditingId(ratio.id);
    setEditW(ratio.widthComponent.toString());
    setEditH(ratio.heightComponent.toString());
  };

  const addRatio = useCallback(() => {
    const newRatio: AspectRatio = {
      id: nanoid(),
      widthComponent: 16,
      heightComponent: 9,
      isBuiltIn: false,
      isEnabled: true,
    };
    updateRatios([...settings.aspectRatios, newRatio]);
    startEdit(newRatio);
  }, [updateRatios, settings.aspectRatios]);

  const saveEdit = () => {
    if (!editingId) return;
    const w = parseInt(editW);
    const h = parseInt(editH);
    updateRatios(
      settings.aspectRatios.map(r =>
        r.id === editingId
          ? {
              ...r,
              widthComponent: Number.isNaN(w) ? r.widthComponent : w,
              heightComponent: Number.isNaN(h) ? r.heightComponent : h,
            }
          : r,
      ),
    );
    setEditingId(null);
  };

  const deleteRatio = (id: string) => updateRatios(settings.aspectRatios.filter(r => r.id !== id));

  const toggleRatio = (id: string) =>
    updateRatios(settings.aspectRatios.map(r => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r)));

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-800">Aspect Ratios</h3>
        <button
          onClick={addRatio}
          className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add
        </button>
      </div>

      <div className="space-y-1.5 flex-1">
        {settings.aspectRatios.map(ratio => (
          <div
            key={ratio.id}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg"
          >
            <input
              type="checkbox"
              checked={ratio.isEnabled}
              onChange={() => toggleRatio(ratio.id)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            {editingId === ratio.id ? (
              <>
                <input
                  type="number"
                  value={editW}
                  onChange={e => setEditW(e.target.value)}
                  className="w-14 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <span className="text-sm text-gray-500">:</span>
                <input
                  type="number"
                  value={editH}
                  onChange={e => setEditH(e.target.value)}
                  className="w-14 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={saveEdit}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <span className={`flex-1 text-sm font-mono ${ratio.isEnabled ? 'text-gray-800' : 'text-gray-400'}`}>
                  {ratio.widthComponent}:{ratio.heightComponent}
                </span>
                {ratio.isBuiltIn ? (
                  <span className="text-xs text-gray-400">Built-in</span>
                ) : (
                  <>
                    <button onClick={() => startEdit(ratio)} className="p-1 text-gray-400 hover:text-gray-600 text-xs">✏️</button>
                    <button onClick={() => deleteRatio(ratio.id)} className="p-1 text-gray-400 hover:text-red-500 text-xs">🗑️</button>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function PresetsSettings({ settings, onChange }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Presets appear in the tray menu for quick window resize and aspect-ratio selection before capture.
      </p>
      <div className="flex gap-6">
        <WidthPresets settings={settings} onChange={onChange} />
        <div className="w-px bg-gray-200 self-stretch" />
        <AspectRatios settings={settings} onChange={onChange} />
      </div>
    </div>
  );
}
