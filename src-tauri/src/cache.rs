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

    fn sample_forecast() -> Forecast {
        Forecast {
            current: crate::commands::weather::CurrentWeather {
                temp: 25.0,
                feels: 26.0,
                humidity: 59.0,
                wind: 10.0,
                precip: 0.0,
                code: 1,
            },
            days: vec![],
        }
    }

    #[test]
    fn write_then_read_roundtrip() {
        let dir = std::env::temp_dir().join("jinzhao-cache-roundtrip");
        let _ = std::fs::remove_dir_all(&dir);
        let value = CachedForecast {
            fetched_at: 1000,
            lat: 39.9,
            lon: 116.4,
            forecast: sample_forecast(),
        };
        write(&dir, &value).expect("write should succeed");
        let got = read(&dir, 39.9, 116.4).expect("read should succeed");
        assert_eq!(got.fetched_at, 1000);
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn deleted_cache_reads_as_none() {
        let dir = std::env::temp_dir().join("jinzhao-cache-missing");
        let _ = std::fs::remove_dir_all(&dir);
        assert!(read(&dir, 39.9, 116.4).is_none());
    }

    #[test]
    fn malformed_cache_reads_as_none() {
        let dir = std::env::temp_dir().join("jinzhao-cache-broken");
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).expect("temp dir");
        std::fs::write(dir.join("weather-cache.json"), "not json at all").expect("write broken file");
        assert!(read(&dir, 39.9, 116.4).is_none());
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn cache_for_other_city_is_not_reused() {
        let dir = std::env::temp_dir().join("jinzhao-cache-othercity");
        let _ = std::fs::remove_dir_all(&dir);
        let value = CachedForecast {
            fetched_at: 1000,
            lat: 39.9,
            lon: 116.4,
            forecast: sample_forecast(),
        };
        write(&dir, &value).expect("write should succeed");
        assert!(read(&dir, 39.63, 118.18).is_none());
        let _ = std::fs::remove_dir_all(&dir);
    }
}
