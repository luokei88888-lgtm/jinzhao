use crate::config::{DEFAULT_CITY_NAME, DEFAULT_LAT, DEFAULT_LON};
use crate::error::AppError;
use serde::Deserialize;

const GEO_API: &str = "https://ipinfo.io/json";

/// 定位结果只描述城市，不含主题等其余配置，
/// 由调用方合并进现有配置，避免定位把用户设置冲掉。
pub struct LocatedCity {
    pub city_name: String,
    pub lat: f64,
    pub lon: f64,
}

#[derive(Deserialize)]
struct IpInfo {
    city: Option<String>,
    loc: Option<String>,
}

/// 解析 ipinfo.io 的响应，取城市名与经纬度。
/// 字段缺失或格式不对都返回 None，由调用方回落到默认城市。
pub fn parse_ipinfo(json: &str) -> Option<(String, f64, f64)> {
    let info: IpInfo = serde_json::from_str(json).ok()?;
    let city = info.city?;
    let loc = info.loc?;
    let mut parts = loc.split(',');
    let lat = parts.next()?.trim().parse::<f64>().ok()?;
    let lon = parts.next()?.trim().parse::<f64>().ok()?;
    Some((city, lat, lon))
}

pub async fn locate() -> Result<LocatedCity, AppError> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .build()
        .map_err(|e| AppError::new("geo_client_failed", &e.to_string()))?;

    let text = client
        .get(GEO_API)
        .header("User-Agent", "jinzhao/0.1")
        .send()
        .await
        .map_err(|e| AppError::new("geo_request_failed", &e.to_string()))?
        .text()
        .await
        .map_err(|e| AppError::new("geo_read_failed", &e.to_string()))?;

    match parse_ipinfo(&text) {
        Some((city, lat, lon)) => Ok(LocatedCity {
            city_name: city,
            lat,
            lon,
        }),
        None => Ok(LocatedCity {
            city_name: DEFAULT_CITY_NAME.to_string(),
            lat: DEFAULT_LAT,
            lon: DEFAULT_LON,
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_city_and_loc() {
        let json = r#"{"city":"Beijing","region":"Beijing","country":"CN","loc":"39.9075,116.3972"}"#;
        let got = parse_ipinfo(json).expect("should parse");
        assert_eq!(got.0, "Beijing");
        assert!((got.1 - 39.9075).abs() < 0.0001);
        assert!((got.2 - 116.3972).abs() < 0.0001);
    }

    #[test]
    fn missing_loc_returns_none() {
        let json = r#"{"city":"Beijing"}"#;
        assert!(parse_ipinfo(json).is_none());
    }

    #[test]
    fn malformed_loc_returns_none() {
        let json = r#"{"city":"Beijing","loc":"not-a-coord"}"#;
        assert!(parse_ipinfo(json).is_none());
    }
}
