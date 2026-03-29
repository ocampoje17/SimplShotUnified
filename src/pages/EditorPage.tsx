import { useState, useRef, useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import type { AnnotationType, Annotation, Point } from '../types';
import { nanoid } from 'nanoid';

const TOOLS: { type: AnnotationType | 'select'; icon: string; label: string }[] = [
  { type: 'select', icon: '↖', label: 'Select' },
  { type: 'arrow', icon: '↗', label: 'Arrow' },
  { type: 'rectangle', icon: '▭', label: 'Rectangle' },
  { type: 'ellipse', icon: '◯', label: 'Ellipse' },
  { type: 'text', icon: 'T', label: 'Text' },
  { type: 'pen', icon: '✏️', label: 'Pen' },
  { type: 'highlight', icon: '🖊', label: 'Highlight' },
  { type: 'blur', icon: '⬜', label: 'Blur' },
];

const COLORS = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#ffffff', '#000000'];

export default function EditorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [activeTool, setActiveTool] = useState<AnnotationType | 'select'>('select');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);
  const [color, setColor] = useState('#FF3B30');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const imageHistoryRef = useRef<Annotation[][]>([]);

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
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();
        const angle = Math.atan2(e.y - s.y, e.x - s.x);
        const headLen = 14;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x - headLen * Math.cos(angle - 0.4), e.y - headLen * Math.sin(angle - 0.4));
        ctx.lineTo(e.x - headLen * Math.cos(angle + 0.4), e.y - headLen * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'rectangle': {
        ctx.beginPath();
        ctx.strokeRect(s.x, s.y, w, h);
        break;
      }
      case 'ellipse': {
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
      case 'pen': {
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
      case 'blur': {
        ctx.strokeStyle = '#007AFF';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(s.x, s.y, w, h);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0, 122, 255, 0.1)';
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
      strokeWidth: 3,
      points: activeTool === 'pen' ? [pt] : undefined,
    };
    setCurrentAnnotation(ann);
  }, [activeTool, color, getCanvasPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation) return;
    const pt = getCanvasPoint(e);
    setCurrentAnnotation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        endPoint: pt,
        points: prev.type === 'pen' ? [...(prev.points ?? []), pt] : prev.points,
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

    const MAX_HISTORY = 50;
    const next = [...imageHistoryRef.current, annotations];
    imageHistoryRef.current = next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    setAnnotations(prev => [...prev, finalAnnotation]);
    setRedoStack([]);
    setCurrentAnnotation(null);
  }, [isDrawing, currentAnnotation, annotations]);

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

  const containerStyle = {
    width: Math.min(canvasSize.width, window.innerWidth - 280),
    height: Math.min(canvasSize.height, window.innerHeight - 100),
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
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
        <div className="w-14 flex flex-col items-center gap-1 py-2 bg-gray-800 border-r border-gray-700">
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
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-900 p-4">
          <div className="relative shadow-2xl" style={containerStyle}>
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="absolute top-0 left-0 w-full h-full"
            />
            <canvas
              ref={overlayRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="absolute top-0 left-0 w-full h-full"
              style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
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
