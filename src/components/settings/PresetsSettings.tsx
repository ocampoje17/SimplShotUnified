import type React from 'react';
import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import type { AppSettings, WidthPreset, AspectRatio } from '../../types';

interface Props {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
}

// ─── Shared macOS list row ────────────────────────────────────────────────────

interface ListRowProps {
  checked: boolean;
  onCheck: () => void;
  label: string;
  badge?: string;
  isEditing?: boolean;
  editContent?: React.ReactNode;
  onClick?: () => void;
  onContextDelete?: () => void;
  onContextEdit?: () => void;
  showEditHint?: boolean;
}

function ListRow({
  checked, onCheck, label, badge, isEditing, editContent,
  onClick, onContextDelete, onContextEdit, showEditHint,
}: ListRowProps) {
  const [hovered, setHovered] = useState(false);
  const [ctx, setCtx] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!onContextDelete && !onContextEdit) return;
    e.preventDefault();
    setCtx(true);
    const close = () => { setCtx(false); window.removeEventListener('click', close); };
    window.addEventListener('click', close);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px',
        background: hovered && !isEditing ? 'var(--mac-list-hover)' : 'transparent',
        cursor: (onClick && !isEditing) ? 'pointer' : 'default',
        borderRadius: 4,
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={!isEditing ? onClick : undefined}
      onContextMenu={handleContextMenu}
    >
      <input
        type="checkbox"
        className="mac-checkbox"
        checked={checked}
        onChange={e => { e.stopPropagation(); onCheck(); }}
      />
      {isEditing ? (
        editContent
      ) : (
        <>
          <span style={{
            flex: 1,
            fontSize: 13,
            color: checked ? 'var(--mac-primary)' : 'var(--mac-secondary)',
          }}>
            {label}
          </span>
          {badge && <span style={{ fontSize: 11, color: 'var(--mac-secondary)' }}>{badge}</span>}
          {showEditHint && hovered && !badge && (
            <span style={{ fontSize: 10, color: 'var(--mac-tertiary)' }}>click to edit</span>
          )}
        </>
      )}
      {/* Context menu */}
      {ctx && (
        <div style={{
          position: 'absolute', top: '100%', left: 40, zIndex: 100,
          background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.15)',
          borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          overflow: 'hidden', minWidth: 120,
        }}>
          {onContextEdit && (
            <button
              onClick={e => { e.stopPropagation(); setCtx(false); onContextEdit(); }}
              style={{ display: 'block', width: '100%', padding: '6px 12px', textAlign: 'left', fontSize: 13, border: 'none', background: 'transparent', cursor: 'pointer' }}
            >Edit</button>
          )}
          {onContextDelete && (
            <button
              onClick={e => { e.stopPropagation(); setCtx(false); onContextDelete(); }}
              style={{ display: 'block', width: '100%', padding: '6px 12px', textAlign: 'left', fontSize: 13, border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc3545' }}
            >Delete</button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Width Presets ────────────────────────────────────────────────────────────

function WidthPresetsPanel({ settings, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editWidth, setEditWidth] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addLabel, setAddLabel] = useState('');
  const [addWidth, setAddWidth] = useState('1200');

  const update = useCallback((p: WidthPreset[]) => onChange({ ...settings, widthPresets: p }), [onChange, settings]);

  const toggle = (id: string) => update(settings.widthPresets.map(p => p.id === id ? { ...p, isEnabled: !p.isEnabled } : p));

  const startEdit = (p: WidthPreset) => {
    setEditingId(p.id);
    setEditLabel(p.label);
    setEditWidth(p.width.toString());
  };

  const saveEdit = () => {
    if (!editingId) return;
    const w = parseInt(editWidth);
    update(settings.widthPresets.map(p =>
      p.id === editingId
        ? { ...p, label: editLabel || `${w}px`, width: Number.isNaN(w) ? p.width : w }
        : p,
    ));
    setEditingId(null);
  };

  const addPreset = () => {
    const w = parseInt(addWidth);
    update([...settings.widthPresets, {
      id: nanoid(),
      label: addLabel || `${w}px`,
      width: Number.isNaN(w) ? 1200 : w,
      isBuiltIn: false,
      isEnabled: true,
    }]);
    setShowAdd(false);
    setAddLabel('');
    setAddWidth('1200');
  };

  const del = (id: string) => update(settings.widthPresets.filter(p => p.id !== id));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Width Presets</div>

      {/* List */}
      <div style={{
        flex: 1,
        border: '1px solid rgba(60,60,67,0.18)',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.7)',
        padding: '4px 0',
        minHeight: 140,
        overflow: 'auto',
      }}>
        {settings.widthPresets.map(p => (
          <ListRow
            key={p.id}
            checked={p.isEnabled}
            onCheck={() => toggle(p.id)}
            label={p.label}
            badge={p.isBuiltIn ? 'Built-in' : (p.label !== `${p.width}px` ? `${p.width}px` : undefined)}
            isEditing={editingId === p.id}
            editContent={
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <input
                  type="text"
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  placeholder="Label"
                  style={{ flex: 1, fontSize: 12, padding: '2px 4px', border: '1px solid rgba(60,60,67,0.3)', borderRadius: 3 }}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && saveEdit()}
                />
                <input
                  type="number"
                  value={editWidth}
                  onChange={e => setEditWidth(e.target.value)}
                  style={{ width: 55, fontSize: 12, padding: '2px 4px', border: '1px solid rgba(60,60,67,0.3)', borderRadius: 3 }}
                  onKeyDown={e => e.key === 'Enter' && saveEdit()}
                />
                <span style={{ fontSize: 11, color: 'var(--mac-secondary)' }}>px</span>
                <button onClick={saveEdit} style={btnStyle}>Done</button>
                <button onClick={() => setEditingId(null)} style={{ ...btnStyle, color: 'var(--mac-secondary)' }}>✕</button>
              </div>
            }
            onClick={p.isBuiltIn ? undefined : () => startEdit(p)}
            showEditHint={!p.isBuiltIn}
            onContextEdit={p.isBuiltIn ? undefined : () => startEdit(p)}
            onContextDelete={p.isBuiltIn ? undefined : () => del(p.id)}
          />
        ))}
      </div>

      {/* Add preset inline */}
      {showAdd ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <input
            type="text"
            value={addLabel}
            onChange={e => setAddLabel(e.target.value)}
            placeholder="Label (optional)"
            style={{ flex: 1, fontSize: 12, padding: '3px 6px', border: '1px solid rgba(60,60,67,0.3)', borderRadius: 4 }}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && addPreset()}
          />
          <input
            type="number"
            value={addWidth}
            onChange={e => setAddWidth(e.target.value)}
            style={{ width: 55, fontSize: 12, padding: '3px 6px', border: '1px solid rgba(60,60,67,0.3)', borderRadius: 4 }}
            onKeyDown={e => e.key === 'Enter' && addPreset()}
          />
          <span style={{ fontSize: 11, color: 'var(--mac-secondary)' }}>px</span>
          <button onClick={addPreset} style={btnStyle}>Add</button>
          <button onClick={() => setShowAdd(false)} style={{ ...btnStyle, color: 'var(--mac-secondary)' }}>Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          style={{ ...btnStyle, marginTop: 8, alignSelf: 'flex-start' }}
        >
          Add Width Preset
        </button>
      )}
    </div>
  );
}

// ─── Aspect Ratios ────────────────────────────────────────────────────────────

function AspectRatiosPanel({ settings, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editW, setEditW] = useState('');
  const [editH, setEditH] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addW, setAddW] = useState('16');
  const [addH, setAddH] = useState('9');

  const update = useCallback((r: AspectRatio[]) => onChange({ ...settings, aspectRatios: r }), [onChange, settings]);

  const toggle = (id: string) => update(settings.aspectRatios.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));

  const startEdit = (r: AspectRatio) => {
    setEditingId(r.id);
    setEditW(r.widthComponent.toString());
    setEditH(r.heightComponent.toString());
  };

  const saveEdit = () => {
    if (!editingId) return;
    const w = parseInt(editW);
    const h = parseInt(editH);
    update(settings.aspectRatios.map(r =>
      r.id === editingId
        ? { ...r, widthComponent: Number.isNaN(w) ? r.widthComponent : w, heightComponent: Number.isNaN(h) ? r.heightComponent : h }
        : r,
    ));
    setEditingId(null);
  };

  const addRatio = () => {
    const w = parseInt(addW);
    const h = parseInt(addH);
    update([...settings.aspectRatios, {
      id: nanoid(),
      widthComponent: Number.isNaN(w) ? 16 : w,
      heightComponent: Number.isNaN(h) ? 9 : h,
      isBuiltIn: false,
      isEnabled: true,
    }]);
    setShowAdd(false);
    setAddW('16'); setAddH('9');
  };

  const del = (id: string) => update(settings.aspectRatios.filter(r => r.id !== id));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Aspect Ratios</div>

      <div style={{
        flex: 1,
        border: '1px solid rgba(60,60,67,0.18)',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.7)',
        padding: '4px 0',
        minHeight: 140,
        overflow: 'auto',
      }}>
        {settings.aspectRatios.map(r => (
          <ListRow
            key={r.id}
            checked={r.isEnabled}
            onCheck={() => toggle(r.id)}
            label={`${r.widthComponent}:${r.heightComponent}`}
            badge={r.isBuiltIn ? 'Built-in' : undefined}
            isEditing={editingId === r.id}
            editContent={
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <input
                  type="number"
                  value={editW}
                  onChange={e => setEditW(e.target.value)}
                  style={{ width: 44, fontSize: 12, padding: '2px 4px', border: '1px solid rgba(60,60,67,0.3)', borderRadius: 3 }}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && saveEdit()}
                />
                <span style={{ fontSize: 11 }}>:</span>
                <input
                  type="number"
                  value={editH}
                  onChange={e => setEditH(e.target.value)}
                  style={{ width: 44, fontSize: 12, padding: '2px 4px', border: '1px solid rgba(60,60,67,0.3)', borderRadius: 3 }}
                  onKeyDown={e => e.key === 'Enter' && saveEdit()}
                />
                <button onClick={saveEdit} style={btnStyle}>Done</button>
                <button onClick={() => setEditingId(null)} style={{ ...btnStyle, color: 'var(--mac-secondary)' }}>✕</button>
              </div>
            }
            onClick={r.isBuiltIn ? undefined : () => startEdit(r)}
            showEditHint={!r.isBuiltIn}
            onContextEdit={r.isBuiltIn ? undefined : () => startEdit(r)}
            onContextDelete={r.isBuiltIn ? undefined : () => del(r.id)}
          />
        ))}
      </div>

      {showAdd ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <input
            type="number"
            value={addW}
            onChange={e => setAddW(e.target.value)}
            style={{ width: 44, fontSize: 12, padding: '3px 6px', border: '1px solid rgba(60,60,67,0.3)', borderRadius: 4 }}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && addRatio()}
          />
          <span style={{ fontSize: 11 }}>:</span>
          <input
            type="number"
            value={addH}
            onChange={e => setAddH(e.target.value)}
            style={{ width: 44, fontSize: 12, padding: '3px 6px', border: '1px solid rgba(60,60,67,0.3)', borderRadius: 4 }}
            onKeyDown={e => e.key === 'Enter' && addRatio()}
          />
          <button onClick={addRatio} style={btnStyle}>Add</button>
          <button onClick={() => setShowAdd(false)} style={{ ...btnStyle, color: 'var(--mac-secondary)' }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} style={{ ...btnStyle, marginTop: 8, alignSelf: 'flex-start' }}>
          Add Aspect Ratio
        </button>
      )}
    </div>
  );
}

// ─── Shared button style ──────────────────────────────────────────────────────
const btnStyle: React.CSSProperties = {
  fontSize: 12,
  padding: '3px 8px',
  border: '1px solid rgba(60,60,67,0.25)',
  borderRadius: 5,
  background: 'rgba(255,255,255,0.6)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  color: 'var(--mac-primary)',
  whiteSpace: 'nowrap',
};

// ─── Main export ──────────────────────────────────────────────────────────────

export default function PresetsSettings({ settings, onChange }: Props) {
  return (
    <div style={{ padding: 16, display: 'flex', gap: 20 }}>
      <WidthPresetsPanel settings={settings} onChange={onChange} />
      <div style={{ width: 1, background: 'var(--mac-separator)', alignSelf: 'stretch' }} />
      <AspectRatiosPanel settings={settings} onChange={onChange} />
    </div>
  );
}
