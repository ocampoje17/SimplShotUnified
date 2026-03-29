import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import GeneralSettings from './components/settings/GeneralSettings';
import PresetsSettings from './components/settings/PresetsSettings';
import TemplatesSettings from './components/settings/TemplatesSettings';
import AboutSettings from './components/settings/AboutSettings';
import { loadSettings, saveSettings } from './store/settings';
import type { AppSettings } from './types';
import './index.css';

type Tab = 'general' | 'presets' | 'templates' | 'about';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'presets', label: 'Presets', icon: '📐' },
  { id: 'templates', label: 'Templates', icon: '🎨' },
  { id: 'about', label: 'About', icon: 'ℹ️' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<AppSettings>(loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Listen for tray events
  useEffect(() => {
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
      unlistenCapture.then(fn => fn());
      unlistenEditor.then(fn => fn());
    };
  }, [settings.openEditorAfterCapture]);

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
    </div>
  );
}
