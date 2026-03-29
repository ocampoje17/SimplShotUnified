import { useState, useRef, useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import type { AnnotationType, Annotation, Point, ArrowStyle } from '../types';
import { nanoid } from 'nanoid';

const TOOLS: { type: AnnotationType | 'select'; icon: string; label: string }[] = [
  { type: 'select',       icon: '↖',  label: 'Select' },
  { type: 'arrow',        icon: '↗',  label: 'Arrow' },
  { type: 'freeDraw',     icon: '✏️', label: 'Free Drawing' },
  { type: 'measurement',  icon: '📏', label: 'Measurement' },
  { type: 'rectangle',    icon: '▭',  label: 'Rectangle' },
  { type: 'circle',       icon: '◯',  label: 'Circle' },
  { type: 'line',         icon: '╱',  label: 'Line' },
  { type: 'text',         icon: 'T',  label: 'Text' },
  { type: 'pixelate',     icon: '⊞',  label: 'Pixelate' },
  { type: 'spotlight',    icon: '◎',  label: 'Spotlight' },
  { type: 'numberedStep', icon: '①',  label: 'Steps' },
  { type: 'highlight',    icon: '🖊',  label: 'Highlight' },
  { type: 'crop',         icon: '⬚',  label: 'Crop' },
];

const COLORS = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#ffffff', '#000000'];

const ARROW_STYLES: { value: ArrowStyle; label: string }[] = [
  { value: 'chevron',  label: 'Arrow' },
  { value: 'triangle', label: 'Filled' },
  { value: 'curved',   label: 'Curved' },
  { value: 'sketch',   label: 'Sketch' },
];

export default function EditorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [activeTool, setActiveTool] = useState<AnnotationType | 'select'>('select');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);
  const [color, setColor] = useState('#FF3B30');
  const [arrowStyle, setArrowStyle] = useState<ArrowStyle>('chevron');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [zoom, setZoom] = useState(1);
  const imageHistoryRef = useRef<Annotation[][]>([]);
  const stepCounterRef = useRef(1);

  // Load image from event or URL params
  useEffect(() => {
    const hash = window.location.hash;
    const queryStart = hash.indexOf('?');
    const params = new URLSearchParams(queryStart >= 0 ? hash.slice(queryStart + 1) : '');
    const imagePath = params.get('image');

    if (imagePath) {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setCanvasSize({ width: img.width, height: img.height });
      };
      // Only allow data URLs or absolute file paths – reject paths with traversal sequences
      if (imagePath.startsWith('data:')) {
        img.src = imagePath;
      } else if (/^[^<>"'\n\r]+$/.test(imagePath) && !imagePath.includes('..')) {
        img.src = `asset://localhost/${imagePath}`;
      }
    }

    const unlistenData = listen<string>('load-image-data', e => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setCanvasSize({ width: img.width, height: img.height });
      };
      img.src = e.payload;
    });

    return () => {
      unlistenData.then(fn => fn());
    };
  }, []);

  function drawArrow(
    ctx: CanvasRenderingContext2D,
    sx: number, sy: number, ex: number, ey: number,
    style: ArrowStyle,
    headLen: number,
  ) {
    const angle = Math.atan2(ey - sy, ex - sx);
    if (style === 'curved') {
      // Arc shaft
      const mx = (sx + ex) / 2 - (ey - sy) * 0.2;
      const my = (sy + ey) / 2 + (ex - sx) * 0.2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.stroke();
    } else if (style === 'sketch') {
      // Wavy shaft approximation
      const steps = 6;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const px = sx + (ex - sx) * t;
        const py = sy + (ey - sy) * t;
        const wave = (i % 2 === 0 ? 1 : -1) * headLen * 0.2;
        ctx.lineTo(px - Math.sin(angle) * wave, py + Math.cos(angle) * wave);
      }
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    // Arrowhead
    if (style === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - headLen * Math.cos(angle - 0.4), ey - headLen * Math.sin(angle - 0.4));
      ctx.lineTo(ex - headLen * Math.cos(angle + 0.4), ey - headLen * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();
    } else {
      // Chevron (open V)
      ctx.beginPath();
      ctx.moveTo(ex - headLen * Math.cos(angle - 0.4), ey - headLen * Math.sin(angle - 0.4));
      ctx.lineTo(ex, ey);
      ctx.lineTo(ex - headLen * Math.cos(angle + 0.4), ey - headLen * Math.sin(angle + 0.4));
      ctx.stroke();
    }
  }

  function drawAnnotation(ctx: CanvasRenderingContext2D, ann: Annotation) {
    ctx.save();
    ctx.strokeStyle = ann.color;
    ctx.fillStyle = ann.color;
    ctx.lineWidth = ann.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const { startPoint: s, endPoint: e } = ann;
    const w = e.x - s.x;
    const h = e.y - s.y;

    switch (ann.type) {
      case 'arrow': {
        drawArrow(ctx, s.x, s.y, e.x, e.y, ann.arrowStyle ?? 'chevron', 14);
        break;
      }
      case 'line': {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();
        break;
      }
      case 'measurement': {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();
        // End caps
        const angle = Math.atan2(e.y - s.y, e.x - s.x) + Math.PI / 2;
        const cap = 8;
        [[s.x, s.y], [e.x, e.y]].forEach(([px, py]) => {
          ctx.beginPath();
          ctx.moveTo(px - Math.cos(angle) * cap, py - Math.sin(angle) * cap);
          ctx.lineTo(px + Math.cos(angle) * cap, py + Math.sin(angle) * cap);
          ctx.stroke();
        });
        // Label
        const dist = Math.round(Math.hypot(e.x - s.x, e.y - s.y));
        ctx.font = `bold ${ann.strokeWidth * 5}px sans-serif`;
        ctx.fillText(`${dist}px`, (s.x + e.x) / 2 + 6, (s.y + e.y) / 2 - 6);
        break;
      }
      case 'rectangle': {
        ctx.beginPath();
        ctx.strokeRect(s.x, s.y, w, h);
        break;
      }
      case 'circle': {
        ctx.beginPath();
        ctx.ellipse(s.x + w / 2, s.y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'text': {
        if (ann.text) {
          ctx.font = `${ann.strokeWidth * 6}px sans-serif`;
          ctx.fillText(ann.text, s.x, s.y);
        }
        break;
      }
      case 'numberedStep': {
        const r = ann.strokeWidth * 5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${r * 1.1}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(ann.stepNumber ?? 1), s.x, s.y);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
        break;
      }
      case 'freeDraw': {
        if (ann.points && ann.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(ann.points[0].x, ann.points[0].y);
          ann.points.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }
        break;
      }
      case 'highlight': {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = ann.color;
        ctx.fillRect(s.x, s.y, w, h);
        ctx.globalAlpha = 1;
        break;
      }
      case 'pixelate': {
        ctx.strokeStyle = '#007AFF';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(s.x, s.y, w, h);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0, 122, 255, 0.1)';
        ctx.fillRect(s.x, s.y, w, h);
        // "P" label to indicate pixelate
        ctx.fillStyle = '#007AFF';
        ctx.font = `bold ${ann.strokeWidth * 5}px sans-serif`;
        ctx.fillText('P', s.x + 4, s.y + ann.strokeWidth * 6);
        break;
      }
      case 'spotlight': {
        const rx = Math.abs(w / 2);
        const ry = Math.abs(h / 2);
        const cx = s.x + w / 2;
        const cy = s.y + h / 2;
        // Dark overlay with ellipse cutout
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(
          Math.min(s.x, e.x) - canvasSize.width,
          Math.min(s.y, e.y) - canvasSize.height,
          canvasSize.width * 3,
          canvasSize.height * 3,
        );
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
      case 'crop': {
        ctx.strokeStyle = '#007AFF';
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(s.x, s.y, w, h);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0,122,255,0.08)';
        ctx.fillRect(s.x, s.y, w, h);
        break;
      }
    }
    ctx.restore();
  }

  // Render base image + committed annotations to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (image) {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No image loaded', canvas.width / 2, canvas.height / 2);
    }

    annotations.forEach(ann => drawAnnotation(ctx, ann));
  }, [image, annotations, canvasSize]);

  // Render in-progress annotation on overlay
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (currentAnnotation) {
      drawAnnotation(ctx, currentAnnotation);
    }
  }, [currentAnnotation]);

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = overlayRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') return;
    const pt = getCanvasPoint(e);
    setIsDrawing(true);
    const ann: Annotation = {
      id: nanoid(),
      type: activeTool as AnnotationType,
      startPoint: pt,
      endPoint: pt,
      color,
      strokeWidth,
      arrowStyle: activeTool === 'arrow' ? arrowStyle : undefined,
      stepNumber: activeTool === 'numberedStep' ? stepCounterRef.current : undefined,
      points: activeTool === 'freeDraw' ? [pt] : undefined,
    };
    setCurrentAnnotation(ann);
  }, [activeTool, color, strokeWidth, arrowStyle, getCanvasPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation) return;
    const pt = getCanvasPoint(e);
    setCurrentAnnotation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        endPoint: pt,
        points: prev.type === 'freeDraw' ? [...(prev.points ?? []), pt] : prev.points,
      };
    });
  }, [isDrawing, currentAnnotation, getCanvasPoint]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentAnnotation) return;
    setIsDrawing(false);

    let finalAnnotation = currentAnnotation;
    if (currentAnnotation.type === 'text') {
      const text = window.prompt('Enter text:');
      if (!text) {
        setCurrentAnnotation(null);
        return;
      }
      finalAnnotation = { ...currentAnnotation, text };
    }
    if (currentAnnotation.type === 'numberedStep') {
      stepCounterRef.current += 1;
    }
    if (currentAnnotation.type === 'crop') {
      // Apply crop: update canvas size to the selected region
      const { startPoint: s, endPoint: en } = currentAnnotation;
      const x = Math.min(s.x, en.x);
      const y = Math.min(s.y, en.y);
      const w = Math.abs(en.x - s.x);
      const h = Math.abs(en.y - s.y);
      if (w > 10 && h > 10 && image) {
        const offscreen = document.createElement('canvas');
        offscreen.width = w;
        offscreen.height = h;
        const ctx = offscreen.getContext('2d')!;
        ctx.drawImage(image, -x, -y, canvasSize.width, canvasSize.height);
        const cropped = new Image();
        cropped.onload = () => {
          setImage(cropped);
          setCanvasSize({ width: w, height: h });
          setAnnotations([]);
          imageHistoryRef.current = [];
        };
        cropped.src = offscreen.toDataURL();
      }
      setCurrentAnnotation(null);
      return;
    }

    const MAX_HISTORY = 50;
    const next = [...imageHistoryRef.current, annotations];
    imageHistoryRef.current = next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    setAnnotations(prev => [...prev, finalAnnotation]);
    setRedoStack([]);
    setCurrentAnnotation(null);
  }, [isDrawing, currentAnnotation, annotations, image, canvasSize]);

  const undo = useCallback(() => {
    if (imageHistoryRef.current.length === 0) return;
    const prev = imageHistoryRef.current[imageHistoryRef.current.length - 1];
    imageHistoryRef.current = imageHistoryRef.current.slice(0, -1);
    setRedoStack(r => [...r, annotations]);
    setAnnotations(prev);
  }, [annotations]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(r => r.slice(0, -1));
    imageHistoryRef.current = [...imageHistoryRef.current, annotations];
    setAnnotations(next);
  }, [redoStack, annotations]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setZoom(z => Math.min(z + 0.25, 4));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        setZoom(z => Math.max(z - 0.25, 0.25));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        setZoom(1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const showStatus = (text: string, isError = false) => {
    setStatusMessage({ text, isError });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const merged = document.createElement('canvas');
    merged.width = canvas.width;
    merged.height = canvas.height;
    const mCtx = merged.getContext('2d')!;
    mCtx.drawImage(canvas, 0, 0);
    const overlay = overlayRef.current;
    if (overlay) mCtx.drawImage(overlay, 0, 0);
    const dataUrl = merged.toDataURL('image/png');
    try {
      const path = await invoke<string>('save_screenshot', { dataUrl, format: 'png' });
      showStatus(`Saved to: ${path}`);
    } catch (err) {
      showStatus(`Error saving: ${err}`, true);
    }
  };

  const displayWidth = canvasSize.width * zoom;
  const displayHeight = canvasSize.height * zoom;

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <span className="font-semibold text-sm">SimplShot Editor</span>
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            className="px-3 py-1.5 text-xs bg-gray-700 rounded hover:bg-gray-600"
            title="Undo (⌘Z)"
          >
            ↩ Undo
          </button>
          <button
            onClick={redo}
            className="px-3 py-1.5 text-xs bg-gray-700 rounded hover:bg-gray-600"
            title="Redo (⌘⇧Z)"
          >
            ↪ Redo
          </button>
          <div className="w-px h-5 bg-gray-600" />
          {/* Zoom controls */}
          <button
            onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))}
            className="px-2 py-1.5 text-xs bg-gray-700 rounded hover:bg-gray-600"
            title="Zoom out (⌘-)"
          >−</button>
          <span className="text-xs text-gray-300 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(z + 0.25, 4))}
            className="px-2 py-1.5 text-xs bg-gray-700 rounded hover:bg-gray-600"
            title="Zoom in (⌘+)"
          >+</button>
          <button
            onClick={() => setZoom(1)}
            className="px-2 py-1.5 text-xs bg-gray-700 rounded hover:bg-gray-600"
            title="Reset zoom (⌘0)"
          >Fit</button>
          <div className="w-px h-5 bg-gray-600" />
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs bg-blue-600 rounded hover:bg-blue-500"
          >
            Save
          </button>
        </div>
      </div>

      {/* Status toast */}
      {statusMessage && (
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm shadow-lg z-50 ${
            statusMessage.isError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Tool Sidebar */}
        <div className="w-14 flex flex-col items-center gap-1 py-2 bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0">
          {TOOLS.map(tool => (
            <button
              key={tool.type}
              onClick={() => setActiveTool(tool.type)}
              title={tool.label}
              className={`w-10 h-10 flex items-center justify-center rounded text-sm transition-colors ${
                activeTool === tool.type
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tool.icon}
            </button>
          ))}

          <div className="w-8 h-px bg-gray-600 my-2" />

          {/* Color swatches */}
          <div className="flex flex-col gap-1">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  color === c ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ background: c }}
              />
            ))}
          </div>

          {/* Stroke width */}
          <div className="w-8 h-px bg-gray-600 my-2" />
          <div className="flex flex-col gap-1 items-center">
            {[1, 2, 3, 5].map(w => (
              <button
                key={w}
                onClick={() => setStrokeWidth(w)}
                title={`Stroke ${w}px`}
                className={`w-8 h-6 flex items-center justify-center rounded transition-colors ${
                  strokeWidth === w ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
              >
                <div className="bg-white rounded-full" style={{ width: '60%', height: w }} />
              </button>
            ))}
          </div>

          {/* Arrow style (only shown for arrow tool) */}
          {activeTool === 'arrow' && (
            <>
              <div className="w-8 h-px bg-gray-600 my-2" />
              {ARROW_STYLES.map(as => (
                <button
                  key={as.value}
                  onClick={() => setArrowStyle(as.value)}
                  title={as.label}
                  className={`w-10 h-7 flex items-center justify-center rounded text-xs transition-colors ${
                    arrowStyle === as.value ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {as.label}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto flex items-start justify-center bg-gray-900 p-4">
          <div
            className="relative shadow-2xl flex-shrink-0"
            style={{ width: displayWidth, height: displayHeight }}
          >
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="absolute top-0 left-0"
              style={{ width: displayWidth, height: displayHeight }}
            />
            <canvas
              ref={overlayRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="absolute top-0 left-0"
              style={{
                width: displayWidth,
                height: displayHeight,
                cursor: activeTool === 'select' ? 'default' : 'crosshair',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
