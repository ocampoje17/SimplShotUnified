import { useState } from 'react';
import type { AppSettings, WidthPreset } from '../../types';

interface Props {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
}

export default function PresetsSettings({ settings, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editWidth, setEditWidth] = useState('');

  const updatePresets = (presets: WidthPreset[]) => {
    onChange({ ...settings, widthPresets: presets });
  };

  const addPreset = () => {
    const newPreset: WidthPreset = {
      id: Date.now().toString(),
      name: 'New Preset',
      width: 1200,
      isEnabled: true,
    };
    updatePresets([...settings.widthPresets, newPreset]);
    startEdit(newPreset);
  };

  const startEdit = (preset: WidthPreset) => {
    setEditingId(preset.id);
    setEditName(preset.name);
    setEditWidth(preset.width.toString());
  };

  const saveEdit = () => {
    if (!editingId) return;
    updatePresets(
      settings.widthPresets.map(p =>
        p.id === editingId
          ? { ...p, name: editName, width: parseInt(editWidth) || p.width }
          : p
      )
    );
    setEditingId(null);
  };

  const deletePreset = (id: string) => {
    updatePresets(settings.widthPresets.filter(p => p.id !== id));
  };

  const togglePreset = (id: string) => {
    updatePresets(
      settings.widthPresets.map(p =>
        p.id === id ? { ...p, isEnabled: !p.isEnabled } : p
      )
    );
  };

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Width Presets</h2>
        <button
          onClick={addPreset}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Preset
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Presets appear in the tray menu for quick window resize before capture.
      </p>

      <div className="space-y-2">
        {settings.widthPresets.map(preset => (
          <div
            key={preset.id}
            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
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
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <input
                  type="number"
                  value={editWidth}
                  onChange={e => setEditWidth(e.target.value)}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <span className={`flex-1 text-sm ${preset.isEnabled ? 'text-gray-800' : 'text-gray-400'}`}>
                  {preset.name}
                </span>
                <span className="text-sm text-gray-500">{preset.width}px</span>
                <button
                  onClick={() => startEdit(preset)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deletePreset(preset.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  🗑️
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
