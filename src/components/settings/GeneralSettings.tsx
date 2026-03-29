import type { AppSettings, ScreenshotFormat } from '../../types';

interface Props {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
}

const FORMATS: { value: ScreenshotFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
];

export default function GeneralSettings({ settings, onChange }: Props) {
  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">General</h2>

      {/* Format */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Screenshot Format</label>
        <div className="flex gap-2">
          {FORMATS.map(f => (
            <button
              key={f.value}
              onClick={() => onChange({ ...settings, screenshotFormat: f.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                settings.screenshotFormat === f.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save Path */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Save Location</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={settings.screenshotSavePath}
            onChange={e => onChange({ ...settings, screenshotSavePath: e.target.value })}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200">
            Browse
          </button>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <label className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-700">Open Editor After Capture</p>
            <p className="text-xs text-gray-500">Automatically open the editor when a screenshot is taken</p>
          </div>
          <Toggle
            checked={settings.openEditorAfterCapture}
            onChange={v => onChange({ ...settings, openEditorAfterCapture: v })}
          />
        </label>

        <label className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Start at Login</p>
            <p className="text-xs text-gray-500">Launch SimplShot automatically when you log in</p>
          </div>
          <Toggle
            checked={settings.startAtLogin}
            onChange={v => onChange({ ...settings, startAtLogin: v })}
          />
        </label>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
