use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

pub const DEFAULT_CITY_NAME: &str = "北京";
pub const DEFAULT_LAT: f64 = 39.9042;
pub const DEFAULT_LON: f64 = 116.4074;

const THEME_MODES: [&str; 3] = ["light", "dark", "system"];

fn default_theme() -> String {
    "system".to_string()
}

pub fn is_theme_mode(value: &str) -> bool {
    THEME_MODES.contains(&value)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub city_name: String,
    pub lat: f64,
    pub lon: f64,
    pub city_locked: bool,
    #[serde(default = "default_theme")]
    pub theme: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            city_name: DEFAULT_CITY_NAME.to_string(),
            lat: DEFAULT_LAT,
            lon: DEFAULT_LON,
            city_locked: false,
            theme: default_theme(),
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
    // 缺 theme 字段的旧配置由 serde 默认值补上，手改成非法值的在这里回落，
    // 两种情况下城市等其余字段都保留。
    let mut cfg: AppConfig = serde_json::from_str(&raw).unwrap_or_default();
    if !is_theme_mode(&cfg.theme) {
        cfg.theme = default_theme();
    }
    cfg
}

pub fn write(dir: &Path, value: &AppConfig) -> Result<(), AppError> {
    std::fs::create_dir_all(dir)
        .map_err(|e| AppError::new("config_dir_failed", &e.to_string()))?;
    let text = serde_json::to_string_pretty(value)
        .map_err(|e| AppError::new("config_encode_failed", &e.to_string()))?;
    std::fs::write(config_path(dir), text)
        .map_err(|e| AppError::new("config_write_failed", &e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("jinzhao-config-{}", name));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).expect("temp dir");
        dir
    }

    #[test]
    fn theme_mode_validation() {
        assert!(is_theme_mode("light"));
        assert!(is_theme_mode("dark"));
        assert!(is_theme_mode("system"));
        assert!(!is_theme_mode("DARK"));
        assert!(!is_theme_mode(""));
        assert!(!is_theme_mode("auto"));
    }

    #[test]
    fn missing_theme_field_defaults_to_system_and_keeps_city() {
        let dir = temp_dir("missing-theme");
        std::fs::write(
            dir.join("config.json"),
            r#"{"cityName":"唐山","lat":39.63,"lon":118.18,"cityLocked":true}"#,
        )
        .expect("write");
        let cfg = read(&dir);
        assert_eq!(cfg.city_name, "唐山");
        assert!(cfg.city_locked);
        assert_eq!(cfg.theme, "system");
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn illegal_theme_value_falls_back_to_system() {
        let dir = temp_dir("illegal-theme");
        std::fs::write(dir.join("config.json"), r#"{"theme":"blue"}"#).expect("write");
        assert_eq!(read(&dir).theme, "system");
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn theme_roundtrip() {
        let dir = temp_dir("theme-roundtrip");
        let mut cfg = AppConfig::default();
        cfg.theme = "dark".to_string();
        write(&dir, &cfg).expect("write");
        assert_eq!(read(&dir).theme, "dark");
        let _ = std::fs::remove_dir_all(&dir);
    }
}
