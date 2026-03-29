export interface WidthPreset {
  id: string;
  name: string;
  width: number;
  isEnabled: boolean;
}

export interface AspectRatio {
  id: string;
  name: string;
  width: number;
  height: number;
  isEnabled: boolean;
}

export interface GradientStop {
  color: string;
  position: number;
}

export interface ScreenshotTemplate {
  isEnabled: boolean;
  wallpaperSource: WallpaperSource | null;
  padding: number;
  cornerRadius: number;
}

export type WallpaperSource =
  | { type: 'solidColor'; color: string }
  | { type: 'gradient'; stops: GradientStop[]; angle: number }
  | { type: 'image'; path: string };

export type ScreenshotFormat = 'png' | 'jpeg' | 'webp';

export interface AppSettings {
  screenshotFormat: ScreenshotFormat;
  screenshotSavePath: string;
  openEditorAfterCapture: boolean;
  startAtLogin: boolean;
  widthPresets: WidthPreset[];
  screenshotTemplate: ScreenshotTemplate;
}

export type AnnotationType =
  | 'arrow'
  | 'rectangle'
  | 'ellipse'
  | 'text'
  | 'blur'
  | 'highlight'
  | 'pen';

export interface WindowInfo {
  id: number;
  title: string;
  app_name: string;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  startPoint: Point;
  endPoint: Point;
  color: string;
  strokeWidth: number;
  text?: string;
  points?: Point[];
}
