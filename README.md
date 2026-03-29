# SimplShotUnified

A cross-platform port of [SimplShot](https://github.com/atlemo/SimplShot-App) (originally a macOS-only screenshot app) built with **Tauri 2**, **React**, **TypeScript**, and **Tailwind CSS**.

## Features

- **System tray icon** with context menu (Capture Screen, Capture Window, Open Editor, Settings, Quit)
- **Screenshot capture** – captures the primary screen or a specific window using the `xcap` library
- **Built-in editor** – canvas-based annotation editor with:
  - Annotation tools: Arrow, Rectangle, Ellipse, Text, Pen, Highlight, Blur marker
  - Color palette with 8 swatches
  - Undo / Redo (⌘Z / ⌘⇧Z)
  - Save annotated image to disk
- **Background Templates** – gradient or solid-color backgrounds, adjustable padding and corner radius
- **Width Presets** – named pixel-width presets for quick window resizing before capture
- **Settings window** – General, Presets, Templates, and About tabs
- **Cross-platform** – runs on macOS, Linux, and Windows

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Shell / System | Rust + Tauri 2 |
| UI framework | React 18 + TypeScript |
| Bundler | Vite 8 |
| Styling | Tailwind CSS 3 |
| Screen capture | `xcap` Rust crate |
| Image encoding | `image` Rust crate |
| Persistence | `localStorage` (settings) |

## Project Structure

```
simplshot-unified/
├── src/                          # React frontend
│   ├── App.tsx                   # Settings window (4 tabs)
│   ├── main.tsx                  # Hash router (/ = settings, /editor = editor)
│   ├── types.ts                  # Shared TypeScript types
│   ├── store/settings.ts         # localStorage settings store
│   ├── pages/EditorPage.tsx      # Canvas annotation editor
│   └── components/settings/     # Settings tab components
│       ├── GeneralSettings.tsx
│       ├── PresetsSettings.tsx
│       ├── TemplatesSettings.tsx
│       └── AboutSettings.tsx
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── lib.rs                # Commands, tray menu, plugin setup
│   │   └── main.rs               # Entry point
│   ├── Cargo.toml
│   └── tauri.conf.json
├── index.html
├── vite.config.ts
└── package.json
```

## Requirements

- **Node.js** 18+ and npm
- **Rust** 1.77+ (install via https://rustup.rs)
- Tauri system dependencies for your OS – see https://tauri.app/start/prerequisites/
- On **macOS**: Screen Recording permission must be granted to the app

## Development

```bash
# Install JS dependencies
npm install

# Run in dev mode (hot-reload frontend + Rust backend)
npm run tauri dev
```

## Build

```bash
# Build a production bundle
npm run tauri build
```

The distributable is placed in `src-tauri/target/release/bundle/`.

## Original App

This is a Tauri port of [SimplShot-App](https://github.com/atlemo/SimplShot-App) by [@atlemo](https://github.com/atlemo), originally a macOS-native app built with Swift/SwiftUI. The original is licensed under the MIT License.
