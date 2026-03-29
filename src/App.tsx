import { useState, useEffect } from 'react';
import type React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import GeneralSettings from './components/settings/GeneralSettings';
import PresetsSettings from './components/settings/PresetsSettings';
import TemplatesSettings from './components/settings/TemplatesSettings';
import AboutSettings from './components/settings/AboutSettings';
import { loadSettings, saveSettings } from './store/settings';
import type { AppSettings, WindowInfo } from './types';
import './index.css';

type Tab = 'general' | 'sizes' | 'template' | 'about';

const APP_NAME = 'SimplShot';

// SF Symbol-inspired SVG icons (inline, no external dependency)
function IconGear() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <path d="M7.36 1.5a.75.75 0 0 0-.732.586L6.3 3.24a5.48 5.48 0 0 0-.928.538l-1.12-.374A.75.75 0 0 0 3.3 3.7L2.05 5.95a.75.75 0 0 0 .178.95l.896.762a5.6 5.6 0 0 0 0 1.076l-.896.762a.75.75 0 0 0-.178.95l1.25 2.25a.75.75 0 0 0 .952.304l1.12-.374c.29.2.6.378.928.538l.328 1.154A.75.75 0 0 0 7.36 14.5h2.28a.75.75 0 0 0 .732-.586l.328-1.154c.328-.16.638-.338.928-.538l1.12.374a.75.75 0 0 0 .952-.304l1.25-2.25a.75.75 0 0 0-.178-.95l-.896-.762a5.6 5.6 0 0 0 0-1.076l.896-.762a.75.75 0 0 0 .178-.95l-1.25-2.25a.75.75 0 0 0-.952-.304l-1.12.374a5.48 5.48 0 0 0-.928-.538L10.372 2.086A.75.75 0 0 0 9.64 1.5H7.36ZM9 6.25a2.75 2.75 0 1 1 0 5.5 2.75 2.75 0 0 1 0-5.5Z"/>
    </svg>
  );
}
function IconRuler() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h11A1.5 1.5 0 0 1 16 5.5v7A1.5 1.5 0 0 1 14.5 14h-11A1.5 1.5 0 0 1 2 12.5v-7Zm1.5-.25a.25.25 0 0 0-.25.25v7c0 .138.112.25.25.25h11a.25.25 0 0 0 .25-.25v-7a.25.25 0 0 0-.25-.25h-11ZM5 7.75a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 5 7.75Zm2.75.75a.75.75 0 0 1 1.5 0v1a.75.75 0 0 1-1.5 0v-1Zm3.5-.75a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1a.75.75 0 0 1 .75-.75Z"/>
    </svg>
  );
}
function IconPhoto() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <path d="M3.25 2.5h11.5A1.75 1.75 0 0 1 16.5 4.25v9.5a1.75 1.75 0 0 1-1.75 1.75H3.25A1.75 1.75 0 0 1 1.5 13.75v-9.5A1.75 1.75 0 0 1 3.25 2.5Zm0 1.25a.5.5 0 0 0-.5.5v6.172l2.636-2.638a.75.75 0 0 1 1.06 0L8.5 9.837l2.47-2.469a.75.75 0 0 1 1.06 0L15 10.342V4.25a.5.5 0 0 0-.5-.5H3.25ZM15 12.44l-3-3.001-2.47 2.47a.75.75 0 0 1-1.06 0L6.417 9.856 3 13.273v.477a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V12.44ZM6.75 6.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/>
    </svg>
  );
}
function IconInfo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <path d="M9 1.5a7.5 7.5 0 1 0 0 15A7.5 7.5 0 0 0 9 1.5ZM8.25 7a.75.75 0 0 1 1.5 0v5a.75.75 0 0 1-1.5 0V7ZM9 5.75a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75Z"/>
    </svg>
  );
}

const TABS: { id: Tab; label: string; Icon: () => React.ReactElement }[] = [
  { id: 'general',  label: 'General',  Icon: IconGear  },
  { id: 'sizes',    label: 'Sizes',    Icon: IconRuler },
  { id: 'template', label: 'Template', Icon: IconPhoto },
  { id: 'about',    label: 'About',    Icon: IconInfo  },
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--mac-bg)' }}>
      {/* macOS-style toolbar tab bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        background: 'var(--mac-toolbar-bg)',
        borderBottom: '1px solid var(--mac-separator)',
        padding: '6px 8px 0',
        gap: '2px',
        flexShrink: 0,
      }}>
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: '6px 16px 5px',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                background: isActive ? 'var(--mac-bg)' : 'transparent',
                color: isActive ? 'var(--mac-accent)' : 'var(--mac-secondary)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '11px',
                fontWeight: isActive ? 500 : 400,
                minWidth: 72,
                boxShadow: isActive ? '0 0 0 0.5px rgba(0,0,0,0.12)' : 'none',
                position: 'relative',
              }}
            >
              <Icon />
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'general'  && <GeneralSettings  settings={settings} onChange={setSettings} />}
        {activeTab === 'sizes'    && <PresetsSettings   settings={settings} onChange={setSettings} />}
        {activeTab === 'template' && <TemplatesSettings settings={settings} onChange={setSettings} />}
        {activeTab === 'about'    && <AboutSettings />}
      </div>

      {/* Window Picker Modal */}
      {showWindowPicker && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50,
        }}>
          <div style={{
            background: 'var(--mac-bg)',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            padding: '16px',
            width: 340,
            maxHeight: 380,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Select Window to Capture</div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {availableWindows.length === 0 ? (
                <p style={{ color: 'var(--mac-secondary)', fontSize: 13 }}>No windows found</p>
              ) : availableWindows.map(w => (
                <button
                  key={w.id}
                  onClick={() => handleWindowCapture(w.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 8px',
                    borderRadius: 5,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--mac-list-hover)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.title}</div>
                  <div style={{ color: 'var(--mac-secondary)', fontSize: 11 }}>{w.app_name}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowWindowPicker(false)}
              style={{
                marginTop: 12,
                padding: '5px 12px',
                fontSize: 13,
                border: '1px solid rgba(60,60,67,0.25)',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                alignSelf: 'flex-end',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
