import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import GeneralSettings from './components/settings/GeneralSettings';
import PresetsSettings from './components/settings/PresetsSettings';
import TemplatesSettings from './components/settings/TemplatesSettings';
import AboutSettings from './components/settings/AboutSettings';
import { loadSettings, saveSettings } from './store/settings';
import type { AppSettings, WindowInfo } from './types';
import './index.css';

type Tab = 'general' | 'presets' | 'templates' | 'about';

const APP_NAME = 'SimplShot';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'presets', label: 'Sizes', icon: '📐' },
  { id: 'templates', label: 'Template', icon: '🎨' },
  { id: 'about', label: 'About', icon: 'ℹ️' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [showWindowPicker, setShowWindowPicker] = useState(false);
  const [availableWindows, setAvailableWindows] = useState<WindowInfo[]>([]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Listen for tray events
  useEffect(() => {
    const unlistenCaptureWindow = listen('tray-capture-window', async () => {
      try {
        await invoke('show_settings');
        const windows = await invoke<WindowInfo[]>('get_windows');
        setAvailableWindows(windows.filter(w => w.title !== APP_NAME));
        setShowWindowPicker(true);
      } catch (e) {
        console.error('Get windows error:', e);
      }
    });

    const unlistenCapture = listen('tray-capture-screen', async () => {
      try {
        const result = await invoke<{ path: string; data_url: string }>('capture_screen');
        if (settings.openEditorAfterCapture) {
          await invoke('open_editor', { dataUrl: result.data_url });
        }
      } catch (e) {
        console.error('Capture error:', e);
      }
    });

    const unlistenEditor = listen('tray-open-editor', () => {
      invoke('open_editor', {});
    });

    return () => {
      unlistenCaptureWindow.then(fn => fn());
      unlistenCapture.then(fn => fn());
      unlistenEditor.then(fn => fn());
    };
  }, [settings.openEditorAfterCapture]);

  const handleWindowCapture = async (windowId: number) => {
    setShowWindowPicker(false);
    try {
      const result = await invoke<{ path: string; data_url: string }>('capture_window', { windowId });
      if (settings.openEditorAfterCapture) {
        await invoke('open_editor', { dataUrl: result.data_url });
      }
    } catch (e) {
      console.error('Capture window error:', e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 select-none">
      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 bg-white">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'general' && (
          <GeneralSettings settings={settings} onChange={setSettings} />
        )}
        {activeTab === 'presets' && (
          <PresetsSettings settings={settings} onChange={setSettings} />
        )}
        {activeTab === 'templates' && (
          <TemplatesSettings settings={settings} onChange={setSettings} />
        )}
        {activeTab === 'about' && <AboutSettings />}
      </div>

      {/* Window Picker Modal */}
      {showWindowPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[28rem] flex flex-col">
            <h2 className="text-base font-semibold mb-3">Select Window to Capture</h2>
            <div className="flex-1 overflow-y-auto space-y-1">
              {availableWindows.length === 0 ? (
                <p className="text-gray-500 text-sm">No windows found</p>
              ) : (
                availableWindows.map(w => (
                  <button
                    key={w.id}
                    onClick={() => handleWindowCapture(w.id)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm"
                  >
                    <div className="font-medium truncate">{w.title}</div>
                    <div className="text-gray-500 text-xs">{w.app_name}</div>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowWindowPicker(false)}
              className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
