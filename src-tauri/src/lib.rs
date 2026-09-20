// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod cache;
pub mod commands;
pub mod config;
pub mod error;

use tauri::{Manager, Theme};

use crate::commands::weather::{self, Forecast};
use crate::error::AppError;

fn data_dir(app: &tauri::AppHandle) -> Result<std::path::PathBuf, AppError> {
    app.path()
        .app_data_dir()
        .map_err(|e| AppError::new("data_dir_failed", &e.to_string()))
}

fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

/// 把主题模式落到原生窗口上：显式指定深浅时强制窗口主题，
/// 跟随系统时传 None 交还给系统，标题栏才会跟着变。
pub fn apply_window_theme(app: &tauri::AppHandle, mode: &str) {
    let theme = match mode {
        "light" => Some(Theme::Light),
        "dark" => Some(Theme::Dark),
        _ => None,
    };
    app.set_theme(theme);
}

#[tauri::command]
fn set_theme_mode(app: tauri::AppHandle, mode: String) -> Result<config::AppConfig, AppError> {
    if !config::is_theme_mode(&mode) {
        return Err(AppError::new("theme_mode_invalid", "未知的主题模式"));
    }
    let dir = data_dir(&app)?;
    let mut cfg = config::read(&dir);
    cfg.theme = mode;
    apply_window_theme(&app, &cfg.theme);
    // 写盘失败不打断界面的切换，主题已经生效
    let _ = config::write(&dir, &cfg);
    Ok(cfg)
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ForecastResponse {
    pub forecast: Forecast,
    pub fetched_at: i64,
    pub stale: bool,
}

#[tauri::command]
fn get_config(app: tauri::AppHandle) -> Result<config::AppConfig, AppError> {
    let dir = data_dir(&app)?;
    Ok(config::read(&dir))
}

#[tauri::command]
fn set_city(
    app: tauri::AppHandle,
    name: String,
    lat: f64,
    lon: f64,
) -> Result<config::AppConfig, AppError> {
    let dir = data_dir(&app)?;
    let mut cfg = config::read(&dir);
    cfg.city_name = name;
    cfg.lat = lat;
    cfg.lon = lon;
    cfg.city_locked = true;
    config::write(&dir, &cfg)?;
    Ok(cfg)
}

#[tauri::command]
async fn get_forecast(
    app: tauri::AppHandle,
    lat: f64,
    lon: f64,
) -> Result<ForecastResponse, AppError> {
    let dir = data_dir(&app)?;
    let now = now_secs();

    if let Some(cached) = cache::read(&dir, lat, lon) {
        if cache::is_fresh(cached.fetched_at, now, cache::CACHE_TTL_SECS) {
            return Ok(ForecastResponse {
                forecast: cached.forecast,
                fetched_at: cached.fetched_at,
                stale: false,
            });
        }
    }

    match weather::fetch(lat, lon).await {
        Ok(forecast) => {
            let value = cache::CachedForecast {
                fetched_at: now,
                lat,
                lon,
                forecast: forecast.clone(),
            };
            let _ = cache::write(&dir, &value);
            Ok(ForecastResponse {
                forecast,
                fetched_at: now,
                stale: false,
            })
        }
        Err(e) => match cache::read(&dir, lat, lon) {
            Some(cached) => Ok(ForecastResponse {
                forecast: cached.forecast,
                fetched_at: cached.fetched_at,
                stale: true,
            }),
            None => Err(e),
        },
    }
}

#[tauri::command]
async fn locate_by_ip(app: tauri::AppHandle) -> Result<config::AppConfig, AppError> {
    let dir = data_dir(&app)?;
    let current = config::read(&dir);
    if current.city_locked {
        return Ok(current);
    }
    let located = commands::geo::locate().await?;
    let mut next = current;
    next.city_name = located.city_name;
    next.lat = located.lat;
    next.lon = located.lon;
    let _ = config::write(&dir, &next);
    Ok(next)
}

#[tauri::command]
async fn get_holidays(
    app: tauri::AppHandle,
    year: i32,
) -> Result<Vec<commands::holiday::HolidayDay>, AppError> {
    let dir = data_dir(&app)?;
    Ok(commands::holiday::load(&dir, year).await)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();
            if let Ok(dir) = handle.path().app_data_dir() {
                let cfg = config::read(&dir);
                apply_window_theme(&handle, &cfg.theme);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_config,
            set_city,
            get_forecast,
            locate_by_ip,
            get_holidays,
            set_theme_mode
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
