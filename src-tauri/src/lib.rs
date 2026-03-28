use base64::{engine::general_purpose, Engine as _};
use image::{DynamicImage, ImageFormat};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager, Runtime,
};
use xcap::Monitor;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WindowInfo {
    pub id: u32,
    pub title: String,
    pub app_name: String,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CaptureResult {
    pub path: String,
    pub width: u32,
    pub height: u32,
    pub data_url: Option<String>,
}

fn get_screenshots_dir() -> PathBuf {
    let home = dirs::home_dir().unwrap_or_else(|| {
        std::env::temp_dir()
    });
    home.join("Pictures").join("SimplShot")
}

fn ensure_screenshots_dir() -> PathBuf {
    let dir = get_screenshots_dir();
    std::fs::create_dir_all(&dir).ok();
    dir
}

fn image_to_data_url(img: &DynamicImage) -> String {
    let mut bytes = Vec::new();
    img.write_to(&mut std::io::Cursor::new(&mut bytes), ImageFormat::Png)
        .ok();
    let b64 = general_purpose::STANDARD.encode(&bytes);
    format!("data:image/png;base64,{}", b64)
}

#[tauri::command]
pub fn get_windows() -> Vec<WindowInfo> {
    xcap::Window::all()
        .unwrap_or_default()
        .into_iter()
        .filter(|w| !w.title().is_empty() && !w.is_minimized())
        .map(|w| WindowInfo {
            id: w.id(),
            title: w.title().to_string(),
            app_name: w.app_name().to_string(),
            width: w.width(),
            height: w.height(),
        })
        .collect()
}

#[tauri::command]
pub async fn capture_window(window_id: u32, format: Option<String>) -> Result<CaptureResult, String> {
    let windows = xcap::Window::all().map_err(|e| e.to_string())?;
    let win = windows
        .into_iter()
        .find(|w| w.id() == window_id)
        .ok_or("Window not found")?;

    let img = win.capture_image().map_err(|e| e.to_string())?;
    let (width, height) = (img.width(), img.height());
    let dynamic = DynamicImage::ImageRgba8(img);

    let ext = format.as_deref().unwrap_or("png");
    let dir = ensure_screenshots_dir();
    let filename = format!(
        "SimplShot_{}.{}",
        chrono::Local::now().format("%Y%m%d_%H%M%S"),
        ext
    );
    let path = dir.join(&filename);

    let fmt = match ext {
        "jpg" | "jpeg" => ImageFormat::Jpeg,
        "webp" => ImageFormat::WebP,
        _ => ImageFormat::Png,
    };
    dynamic
        .save_with_format(&path, fmt)
        .map_err(|e| e.to_string())?;

    let data_url = image_to_data_url(&dynamic);

    Ok(CaptureResult {
        path: path.to_string_lossy().to_string(),
        width,
        height,
        data_url: Some(data_url),
    })
}

#[tauri::command]
pub async fn capture_screen(format: Option<String>) -> Result<CaptureResult, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let monitor = monitors.into_iter().next().ok_or("No monitor found")?;
    let img = monitor.capture_image().map_err(|e| e.to_string())?;
    let (width, height) = (img.width(), img.height());
    let dynamic = DynamicImage::ImageRgba8(img);

    let ext = format.as_deref().unwrap_or("png");
    let dir = ensure_screenshots_dir();
    let filename = format!(
        "SimplShot_{}.{}",
        chrono::Local::now().format("%Y%m%d_%H%M%S"),
        ext
    );
    let path = dir.join(&filename);
    let fmt = match ext {
        "jpg" | "jpeg" => ImageFormat::Jpeg,
        "webp" => ImageFormat::WebP,
        _ => ImageFormat::Png,
    };
    dynamic
        .save_with_format(&path, fmt)
        .map_err(|e| e.to_string())?;

    let data_url = image_to_data_url(&dynamic);

    Ok(CaptureResult {
        path: path.to_string_lossy().to_string(),
        width,
        height,
        data_url: Some(data_url),
    })
}

#[tauri::command]
pub async fn save_screenshot(
    data_url: String,
    filename: Option<String>,
    format: Option<String>,
) -> Result<String, String> {
    let data = data_url
        .strip_prefix("data:image/png;base64,")
        .or_else(|| data_url.strip_prefix("data:image/jpeg;base64,"))
        .or_else(|| data_url.strip_prefix("data:image/webp;base64,"))
        .ok_or("Invalid data URL")?;
    let bytes = general_purpose::STANDARD.decode(data).map_err(|e| e.to_string())?;
    let img = image::load_from_memory(&bytes).map_err(|e| e.to_string())?;

    let ext = format.as_deref().unwrap_or("png");
    let dir = ensure_screenshots_dir();
    let fname = filename.unwrap_or_else(|| {
        format!(
            "SimplShot_{}.{}",
            chrono::Local::now().format("%Y%m%d_%H%M%S"),
            ext
        )
    });
    let path = dir.join(&fname);
    let fmt = match ext {
        "jpg" | "jpeg" => ImageFormat::Jpeg,
        "webp" => ImageFormat::WebP,
        _ => ImageFormat::Png,
    };
    img.save_with_format(&path, fmt).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn open_editor<R: Runtime>(
    app: AppHandle<R>,
    image_path: Option<String>,
    data_url: Option<String>,
) -> Result<(), String> {
    use tauri::WebviewWindowBuilder;
    let win = app.get_webview_window("editor");
    if let Some(w) = win {
        w.show().ok();
        w.set_focus().ok();
        if let Some(path) = image_path {
            w.emit("load-image", path).ok();
        } else if let Some(url) = data_url {
            w.emit("load-image-data", url).ok();
        }
        return Ok(());
    }

    let url = if let Some(path) = image_path.as_ref() {
        format!("#/editor?image={}", urlencoding::encode(path))
    } else {
        "#/editor".to_string()
    };

    let w = WebviewWindowBuilder::new(&app, "editor", tauri::WebviewUrl::App(url.into()))
        .title("SimplShot Editor")
        .inner_size(1200.0, 800.0)
        .resizable(true)
        .build()
        .map_err(|e| e.to_string())?;

    if let Some(du) = data_url {
        w.emit("load-image-data", du).ok();
    }

    Ok(())
}

#[tauri::command]
pub async fn show_settings<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        win.show().map_err(|e| e.to_string())?;
        win.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn build_tray_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let capture_window = MenuItem::with_id(app, "capture-window", "Capture Window", true, None::<&str>)?;
    let capture_screen = MenuItem::with_id(app, "capture-screen", "Capture Screen", true, None::<&str>)?;
    let open_editor = MenuItem::with_id(app, "open-editor", "Open Editor", true, None::<&str>)?;
    let separator1 = PredefinedMenuItem::separator(app)?;
    let settings = MenuItem::with_id(app, "settings", "Settings...", true, None::<&str>)?;
    let separator2 = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit SimplShot", true, None::<&str>)?;

    Menu::with_items(app, &[
        &capture_window,
        &capture_screen,
        &open_editor,
        &separator1,
        &settings,
        &separator2,
        &quit,
    ])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let menu = build_tray_menu(&handle).expect("Failed to build tray menu");
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("SimplShot")
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "capture-window" => {
                            let _ = app.emit("tray-capture-window", ());
                        }
                        "capture-screen" => {
                            let _ = app.emit("tray-capture-screen", ());
                        }
                        "open-editor" => {
                            let _ = app.emit("tray-open-editor", ());
                        }
                        "settings" => {
                            if let Some(win) = app.get_webview_window("main") {
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_windows,
            capture_window,
            capture_screen,
            save_screenshot,
            open_editor,
            show_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
