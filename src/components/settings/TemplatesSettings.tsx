import type React from 'react';
import type { AppSettings, BuiltInGradient, ScreenshotTemplate } from '../../types';
import { BUILT_IN_GRADIENTS, BUILT_IN_GRADIENT_NAMES } from '../../types';

interface Props {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
}

/** Same `settingsRow` pattern used in GeneralSettings. */
function Row({ label, children, alignTop }: { label: string; children: React.ReactNode; alignTop?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: alignTop ? 'flex-start' : 'center',
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
  return `linear-gradient(${def.angle}deg, ${def.colors.join(', ')})`;
}

function templateBackground(template: ScreenshotTemplate): string {
  if (!template.isEnabled) return 'transparent';
  if (template.wallpaperSource.type === 'builtInGradient') return gradientCss(template.wallpaperSource.gradient);
  return '#e5e7eb';
}

/** Preview thumbnail — mirrors the Swift TemplatePreviewView layout */
function TemplatePreview({ template }: { template: ScreenshotTemplate }) {
  const canvasW = 240;
  const canvasH = 135;
  const paddingFrac = template.padding / 200;
  const previewPad = 8 + paddingFrac * 36;
  const ssW = canvasW - previewPad * 2;
  const ssH = canvasH - previewPad * 2;
  const radius = 4 + (template.cornerRadius / 40) * 10;

  return (
    <div style={{
      width: canvasW,
      height: canvasH,
      borderRadius: 6,
      overflow: 'hidden',
      background: template.isEnabled ? templateBackground(template) : 'repeating-conic-gradient(#ccc 0% 25%, #e5e5e5 0% 50%) 0 0 / 10px 10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      {template.isEnabled && (
        <div style={{
          width: ssW,
          height: ssH,
          background: '#fff',
          borderRadius: radius,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}>
          {/* mock window chrome */}
          <div style={{ height: '22%', background: '#f2f2f2', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', paddingLeft: 6, gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ccc' }} />
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.08)', marginRight: 6 }} />
          </div>
          <div style={{ height: '78%', background: '#fff' }} />
        </div>
      )}
    </div>
  );
}

/** Swatch grid for picking a gradient or solid color */
function SwatchGrid({ keys, selected, onSelect }: { keys: BuiltInGradient[]; selected: BuiltInGradient; onSelect: (k: BuiltInGradient) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {keys.map(k => (
        <button
          key={k}
          title={BUILT_IN_GRADIENT_NAMES[k]}
          onClick={() => onSelect(k)}
          style={{
            width: 36,
            height: 24,
            borderRadius: 5,
            border: selected === k ? '2px solid var(--mac-accent)' : '1px solid rgba(60,60,67,0.2)',
            background: gradientCss(k),
            cursor: 'pointer',
            padding: 0,
            outline: selected === k ? '2px solid rgba(0,122,255,0.3)' : 'none',
            outlineOffset: 1,
            transform: selected === k ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.1s',
          }}
        />
      ))}
    </div>
  );
}

export default function TemplatesSettings({ settings, onChange }: Props) {
  const template = settings.screenshotTemplate;

  const update = (t: Partial<ScreenshotTemplate>) =>
    onChange({ ...settings, screenshotTemplate: { ...template, ...t } });

  const selectedGradient =
    template.wallpaperSource.type === 'builtInGradient'
      ? template.wallpaperSource.gradient
      : 'oceanDreams';

  const selectGradient = (g: BuiltInGradient) =>
    update({ wallpaperSource: { type: 'builtInGradient', gradient: g } });

  return (
    <div style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 8, paddingRight: 8 }}>

      {/* Preview */}
      <Row label="Preview:" alignTop>
        <TemplatePreview template={template} />
      </Row>

      <Divider />

      {/* Background selection (when enabled) */}
      <Row label="Background:" alignTop>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--mac-secondary)', marginBottom: 4 }}>Gradients</div>
            <SwatchGrid keys={GRADIENT_KEYS} selected={selectedGradient} onSelect={selectGradient} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--mac-secondary)', marginBottom: 4 }}>Solid Colors</div>
            <SwatchGrid keys={SOLID_KEYS} selected={selectedGradient} onSelect={selectGradient} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--mac-tertiary)' }}>
            Selected: {BUILT_IN_GRADIENT_NAMES[selectedGradient]}
          </div>
        </div>
      </Row>

      <Divider />

      {/* Padding slider */}
      <Row label="Padding:">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 280 }}>
          <input
            type="range"
            min={20}
            max={200}
            value={template.padding}
            onChange={e => update({ padding: parseInt(e.target.value) })}
            style={{ flex: 1, accentColor: 'var(--mac-accent)' }}
          />
          <span style={{ fontSize: 12, color: 'var(--mac-secondary)', width: 44, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {template.padding}px
          </span>
        </div>
      </Row>

      <Divider />

      {/* Corner radius slider */}
      <Row label="Corner radius:">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 280 }}>
          <input
            type="range"
            min={0}
            max={40}
            value={template.cornerRadius}
            onChange={e => update({ cornerRadius: parseInt(e.target.value) })}
            style={{ flex: 1, accentColor: 'var(--mac-accent)' }}
          />
          <span style={{ fontSize: 12, color: 'var(--mac-secondary)', width: 44, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {template.cornerRadius}px
          </span>
        </div>
      </Row>

      <Divider />

      {/* Apply toggle */}
      <Row label="Apply:">
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="checkbox"
            className="mac-checkbox"
            checked={template.isEnabled}
            onChange={e => update({ isEnabled: e.target.checked })}
          />
          <span style={{ fontSize: 13 }}>Apply selected template to screenshots</span>
        </label>
      </Row>
    </div>
  );
}
