use crate::commands::weather::Forecast;
use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

pub const CACHE_TTL_SECS: i64 = 1800;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedForecast {
    pub fetched_at: i64,
    pub lat: f64,
    pub lon: f64,
    pub forecast: Forecast,
}

pub fn is_fresh(fetched_at: i64, now: i64, ttl_secs: i64) -> bool {
    if fetched_at > now {
        return false;
    }
    now - fetched_at < ttl_secs
}

fn cache_path(dir: &Path) -> PathBuf {
    dir.join("weather-cache.json")
}

/// 读取缓存。文件缺失或内容损坏时返回 None，调用方会重新请求，
/// 所以损坏的缓存不需要额外的错误分支。
pub fn read(dir: &Path, lat: f64, lon: f64) -> Option<CachedForecast> {
    let raw = std::fs::read_to_string(cache_path(dir)).ok()?;
    let cached: CachedForecast = serde_json::from_str(&raw).ok()?;
    if (cached.lat - lat).abs() > 0.05 || (cached.lon - lon).abs() > 0.05 {
        return None;
    }
    Some(cached)
}

pub fn write(dir: &Path, value: &CachedForecast) -> Result<(), AppError> {
    std::fs::create_dir_all(dir)
        .map_err(|e| AppError::new("cache_dir_failed", &e.to_string()))?;
    let text = serde_json::to_string(value)
        .map_err(|e| AppError::new("cache_encode_failed", &e.to_string()))?;
    std::fs::write(cache_path(dir), text)
        .map_err(|e| AppError::new("cache_write_failed", &e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fresh_within_ttl() {
        assert!(is_fresh(1000, 1000 + 1799, CACHE_TTL_SECS));
    }

    #[test]
    fn stale_exactly_at_ttl() {
        assert!(!is_fresh(1000, 1000 + 1800, CACHE_TTL_SECS));
    }

    #[test]
    fn future_timestamp_is_not_fresh() {
        assert!(!is_fresh(2000, 1000, CACHE_TTL_SECS));
    }
}
