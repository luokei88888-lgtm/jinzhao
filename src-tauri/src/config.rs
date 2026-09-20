use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

pub const DEFAULT_CITY_NAME: &str = "北京";
pub const DEFAULT_LAT: f64 = 39.9042;
pub const DEFAULT_LON: f64 = 116.4074;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub city_name: String,
    pub lat: f64,
    pub lon: f64,
    pub city_locked: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            city_name: DEFAULT_CITY_NAME.to_string(),
            lat: DEFAULT_LAT,
            lon: DEFAULT_LON,
            city_locked: false,
        }
    }
}

fn config_path(dir: &Path) -> PathBuf {
    dir.join("config.json")
}

/// 配置缺失或损坏时一律回落到默认值，不让启动卡住。
pub fn read(dir: &Path) -> AppConfig {
    let raw = match std::fs::read_to_string(config_path(dir)) {
        Ok(v) => v,
        Err(_) => return AppConfig::default(),
    };
    serde_json::from_str(&raw).unwrap_or_default()
}

pub fn write(dir: &Path, value: &AppConfig) -> Result<(), AppError> {
    std::fs::create_dir_all(dir)
        .map_err(|e| AppError::new("config_dir_failed", &e.to_string()))?;
    let text = serde_json::to_string_pretty(value)
        .map_err(|e| AppError::new("config_encode_failed", &e.to_string()))?;
    std::fs::write(config_path(dir), text)
        .map_err(|e| AppError::new("config_write_failed", &e.to_string()))
}
