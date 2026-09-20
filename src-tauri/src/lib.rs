// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod cache;
pub mod commands;
pub mod config;
pub mod error;

use tauri::Manager;

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
    let _ = config::write(&dir, &located);
    Ok(located)
}

#[tauri::command]
async fn get_holidays(
    app: tauri::AppHandle,
    year: i32,
) -> Result<Vec<commands::holiday::HolidayDay>, AppError> {
    let dir = data_dir(&app)?;
    Ok(commands::holiday::load(&dir, year).await)
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_config,
            set_city,
            get_forecast,
            locate_by_ip,
            get_holidays
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
