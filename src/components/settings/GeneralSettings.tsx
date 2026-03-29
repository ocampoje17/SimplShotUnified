import type React from 'react';
import type { AppSettings, ScreenshotFormat } from '../../types';

interface Props {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
}

/** Shared 2-column row layout matching the original's `settingsRow()` helper. */
function Row({ label, children, alignTop }: { label: string; children: React.ReactNode; alignTop?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: alignTop ? 'flex-start' : 'baseline',
      gap: 10,
      padding: 'var(--mac-row-pad-v) var(--mac-row-pad-h)',
    }}>
      <div style={{
        width: 'var(--mac-label-w)',
        textAlign: 'right',
        color: 'var(--mac-secondary)',
        fontSize: 13,
        flexShrink: 0,
        paddingTop: alignTop ? 1 : 0,
      }}>
        {label}
      </div>
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--mac-separator)', margin: '0 12px' }} />;
}

function MacCheckbox({ checked, onChange, label, caption }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  caption?: string;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 1, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="checkbox"
          className="mac-checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <span style={{ fontSize: 13 }}>{label}</span>
      </div>
      {caption && (
        <span style={{ fontSize: 11, color: 'var(--mac-secondary)', paddingLeft: 20 }}>{caption}</span>
      )}
    </label>
  );
}

const FORMATS: { value: ScreenshotFormat; label: string }[] = [
  { value: 'png',  label: 'PNG'  },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
];

// Global keyboard shortcut registration is not available from the web layer;
// these rows show the shortcut labels for reference only.
const SHORTCUT_ROWS = [
  { label: 'Capture Area',  shortcut: '' },
  { label: 'Capture OCR',   shortcut: '' },
];

export default function GeneralSettings({ settings, onChange }: Props) {
  const folderName = settings.screenshotSavePath.split('/').pop() || settings.screenshotSavePath;

  return (
    <div style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 8, paddingRight: 8 }}>

      {/* Startup */}
      <Row label="Startup:">
        <MacCheckbox
          checked={settings.startAtLogin}
          onChange={v => onChange({ ...settings, startAtLogin: v })}
          label="Launch at login"
        />
      </Row>

      <Divider />

      {/* After capture */}
      <Row label="After capture:">
        <MacCheckbox
          checked={settings.openEditorAfterCapture}
          onChange={v => onChange({ ...settings, openEditorAfterCapture: v })}
          label="Open Editor automatically"
          caption="Only applies to single image captures"
        />
      </Row>

      <Divider />

      {/* Screenshot location */}
      <Row label="Screenshot location:">
        <button className="mac-popup-btn">
          <span className="folder-icon">📁</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {folderName}
          </span>
          <span className="arrow">▼</span>
        </button>
      </Row>

      <Divider />

      {/* File format */}
      <Row label="File format:">
        <div className="mac-segmented" style={{ width: 210 }}>
          {FORMATS.map(f => (
            <button
              key={f.value}
              className={settings.screenshotFormat === f.value ? 'active' : ''}
              onClick={() => onChange({ ...settings, screenshotFormat: f.value })}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Row>

      <Divider />

      {/* Keyboard shortcuts */}
      <Row label="Keyboard shortcuts:" alignTop>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SHORTCUT_ROWS.map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1, fontSize: 13 }}>{row.label}</span>
              <span style={{
                fontSize: 11,
                color: 'var(--mac-secondary)',
                border: '1px solid rgba(60,60,67,0.2)',
                borderRadius: 4,
                padding: '1px 6px',
                background: 'rgba(255,255,255,0.5)',
                minWidth: 80,
                textAlign: 'center',
              }}>
                Not set
              </span>
            </div>
          ))}
        </div>
      </Row>

      <Divider />

      {/* Permissions */}
      <Row label="Permissions:" alignTop>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PermissionRow label="Screen Recording" granted={true} />
        </div>
      </Row>
    </div>
  );
}

function PermissionRow({ label, granted }: { label: string; granted: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: granted ? '#28a745' : '#dc3545', fontSize: 14, lineHeight: 1 }}>
        {granted ? '✓' : '✕'}
      </span>
      <span style={{ fontSize: 13, flex: 1 }}>{label}</span>
      {!granted && (
        <button style={{
          fontSize: 11,
          padding: '2px 8px',
          border: '1px solid rgba(60,60,67,0.25)',
          borderRadius: 4,
          background: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          Grant…
        </button>
      )}
    </div>
  );
}
