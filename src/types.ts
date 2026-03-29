export interface WidthPreset {
  id: string;
  label: string;
  width: number;
  isBuiltIn: boolean;
  isEnabled: boolean;
}

export interface AspectRatio {
  id: string;
  widthComponent: number;
  heightComponent: number;
  isBuiltIn: boolean;
  isEnabled: boolean;
}

export type BuiltInGradient =
  | 'sunsetBlaze'
  | 'oceanDreams'
  | 'purpleHaze'
  | 'forestMist'
  | 'coralReef'
  | 'mintFresh'
  | 'goldenHour'
  | 'midnightSky'
  | 'darkEmber'
  | 'carbonSteel'
  | 'solidWhite'
  | 'solidBlack'
  | 'solidGray'
  | 'solidRed'
  | 'solidOrange'
  | 'solidYellow'
  | 'solidGreen'
  | 'solidBlue'
  | 'solidPurple'
  | 'solidPink';

export interface GradientDefinition {
  colors: string[];
  angle: number;
}

export const BUILT_IN_GRADIENTS: Record<BuiltInGradient, GradientDefinition> = {
  sunsetBlaze:  { colors: ['#FF6B6B', '#FFE56E'], angle: 135 },
  oceanDreams:  { colors: ['#4FAAFF', '#00F2FF'], angle: 135 },
  purpleHaze:   { colors: ['#A8EDE9', '#FFD7E3'], angle: 135 },
  forestMist:   { colors: ['#6679EB', '#4A2AA4'], angle: 135 },
  coralReef:    { colors: ['#EF95FC', '#F5576A'], angle: 135 },
  mintFresh:    { colors: ['#4FAAFF', '#42E87A'], angle: 135 },
  goldenHour:   { colors: ['#FB8BFF', '#2BD1FF', '#2BFFA5'], angle: 135 },
  midnightSky:  { colors: ['#1A2980', '#26D0CE'], angle: 135 },
  darkEmber:    { colors: ['#2C1C3D', '#8C4266'], angle: 135 },
  carbonSteel:  { colors: ['#1E2938', '#383F52', '#4A5464'], angle: 135 },
  solidWhite:   { colors: ['#FFFFFF'], angle: 0 },
  solidBlack:   { colors: ['#1A1A1A'], angle: 0 },
  solidGray:    { colors: ['#8C8C94'], angle: 0 },
  solidRed:     { colors: ['#EB4340'], angle: 0 },
  solidOrange:  { colors: ['#FF9400'], angle: 0 },
  solidYellow:  { colors: ['#FFD60A'], angle: 0 },
  solidGreen:   { colors: ['#33C759'], angle: 0 },
  solidBlue:    { colors: ['#007AFF'], angle: 0 },
  solidPurple:  { colors: ['#9151DE'], angle: 0 },
  solidPink:    { colors: ['#FF6195'], angle: 0 },
};

export const BUILT_IN_GRADIENT_NAMES: Record<BuiltInGradient, string> = {
  sunsetBlaze:  'Sunset Blaze',
  oceanDreams:  'Ocean Dreams',
  purpleHaze:   'Purple Haze',
  forestMist:   'Forest Mist',
  coralReef:    'Coral Reef',
  mintFresh:    'Mint Fresh',
  goldenHour:   'Golden Hour',
  midnightSky:  'Midnight Sky',
  darkEmber:    'Dark Ember',
  carbonSteel:  'Carbon Steel',
  solidWhite:   'White',
  solidBlack:   'Black',
  solidGray:    'Gray',
  solidRed:     'Red',
  solidOrange:  'Orange',
  solidYellow:  'Yellow',
  solidGreen:   'Green',
  solidBlue:    'Blue',
  solidPurple:  'Purple',
  solidPink:    'Pink',
};

export type WallpaperSource =
  | { type: 'builtInGradient'; gradient: BuiltInGradient }
  | { type: 'customImage'; path: string };

export interface ScreenshotTemplate {
  isEnabled: boolean;
  wallpaperSource: WallpaperSource;
  padding: number;
  cornerRadius: number;
}

export type ScreenshotFormat = 'png' | 'jpeg' | 'webp';

export interface AppSettings {
  screenshotFormat: ScreenshotFormat;
  screenshotSavePath: string;
  openEditorAfterCapture: boolean;
  startAtLogin: boolean;
  widthPresets: WidthPreset[];
  aspectRatios: AspectRatio[];
  screenshotTemplate: ScreenshotTemplate;
}

export type ArrowStyle = 'chevron' | 'triangle' | 'curved' | 'sketch';

export type AnnotationType =
  | 'arrow'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'text'
  | 'freeDraw'
  | 'highlight'
  | 'pixelate'
  | 'spotlight'
  | 'numberedStep'
  | 'measurement'
  | 'crop';

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
  stepNumber?: number;
  arrowStyle?: ArrowStyle;
  points?: Point[];
}
