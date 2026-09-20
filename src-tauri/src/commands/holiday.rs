use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

const TIMOR_API: &str = "https://timor.tech/api/holiday/year/";
const HOLIDAY_CN: &str = "https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/";

// 实测：timor.tech 走 Cloudflare，默认 curl UA 会拿到 Just a moment... 校验页而不是 JSON，
// 带上浏览器 UA 才返回数据。校验页解析失败时返回空数组，调用方自动回落到第二个数据源。
const BROWSER_UA: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HolidayDay {
    pub date: String,
    pub name: String,
    pub is_off_day: bool,
}

#[derive(Deserialize)]
struct TimorEntry {
    holiday: Option<bool>,
    name: Option<String>,
    date: Option<String>,
}

#[derive(Deserialize)]
struct TimorResponse {
    holiday: Option<BTreeMap<String, TimorEntry>>,
}

#[derive(Deserialize)]
struct CnDay {
    name: Option<String>,
    date: Option<String>,
    #[serde(rename = "isOffDay")]
    is_off_day: Option<bool>,
}

#[derive(Deserialize)]
struct CnResponse {
    days: Option<Vec<CnDay>>,
}

pub fn parse_timor(json: &str) -> Vec<HolidayDay> {
    let parsed: TimorResponse = match serde_json::from_str(json) {
        Ok(v) => v,
        Err(_) => return Vec::new(),
    };
    let map = match parsed.holiday {
        Some(v) => v,
        None => return Vec::new(),
    };
    let mut out = Vec::new();
    for entry in map.values() {
        if let (Some(date), Some(name), Some(off)) =
            (entry.date.clone(), entry.name.clone(), entry.holiday)
        {
            out.push(HolidayDay {
                date,
                name,
                is_off_day: off,
            });
        }
    }
    out.sort_by(|a, b| a.date.cmp(&b.date));
    out
}

pub fn parse_holiday_cn(json: &str) -> Vec<HolidayDay> {
    let parsed: CnResponse = match serde_json::from_str(json) {
        Ok(v) => v,
        Err(_) => return Vec::new(),
    };
    let mut out = Vec::new();
    for day in parsed.days.unwrap_or_default() {
        if let (Some(date), Some(off)) = (day.date.clone(), day.is_off_day) {
            out.push(HolidayDay {
                date,
                name: day.name.unwrap_or_default(),
                is_off_day: off,
            });
        }
    }
    out.sort_by(|a, b| a.date.cmp(&b.date));
    out
}

fn table_path(dir: &Path, year: i32) -> PathBuf {
    dir.join(format!("holidays-{}.json", year))
}

pub fn read_local(dir: &Path, year: i32) -> Option<Vec<HolidayDay>> {
    let raw = std::fs::read_to_string(table_path(dir, year)).ok()?;
    serde_json::from_str(&raw).ok()
}

pub fn write_local(dir: &Path, year: i32, days: &[HolidayDay]) -> Result<(), AppError> {
    std::fs::create_dir_all(dir)
        .map_err(|e| AppError::new("holiday_dir_failed", &e.to_string()))?;
    let text = serde_json::to_string_pretty(days)
        .map_err(|e| AppError::new("holiday_encode_failed", &e.to_string()))?;
    std::fs::write(table_path(dir, year), text)
        .map_err(|e| AppError::new("holiday_write_failed", &e.to_string()))
}

async fn get_text(url: &str) -> Result<String, AppError> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| AppError::new("holiday_client_failed", &e.to_string()))?;
    client
        .get(url)
        .header("User-Agent", BROWSER_UA)
        .send()
        .await
        .map_err(|e| AppError::new("holiday_request_failed", &e.to_string()))?
        .text()
        .await
        .map_err(|e| AppError::new("holiday_read_failed", &e.to_string()))
}

/// 先读本地表，没有就依次尝试两个数据源，任一成功即落盘。
/// 两个都失败或次年数据尚未发布时返回空数组，界面隐藏休班角标即可。
pub async fn load(dir: &Path, year: i32) -> Vec<HolidayDay> {
    if let Some(days) = read_local(dir, year) {
        return days;
    }

    if let Ok(text) = get_text(&format!("{}{}", TIMOR_API, year)).await {
        let days = parse_timor(&text);
        if !days.is_empty() {
            let _ = write_local(dir, year, &days);
            return days;
        }
    }

    if let Ok(text) = get_text(&format!("{}{}.json", HOLIDAY_CN, year)).await {
        let days = parse_holiday_cn(&text);
        if !days.is_empty() {
            let _ = write_local(dir, year, &days);
            return days;
        }
    }

    Vec::new()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn timor_sample_parses_and_marks_off_days() {
        let json = include_str!("../../../tests/fixtures/holiday-timor.json");
        let days = parse_timor(json);
        assert!(!days.is_empty());
        let new_year = days
            .iter()
            .find(|d| d.date == "2026-01-01")
            .expect("元旦 should exist");
        assert!(new_year.is_off_day);
        let makeup = days
            .iter()
            .find(|d| d.date == "2026-01-04")
            .expect("补班 should exist");
        assert!(!makeup.is_off_day);
    }

    #[test]
    fn holiday_cn_sample_parses() {
        let json = include_str!("../../../tests/fixtures/holiday-cn.json");
        let days = parse_holiday_cn(json);
        assert!(!days.is_empty());
        assert!(days.iter().all(|d| d.date.len() == 10));
    }

    #[test]
    fn timor_empty_year_returns_empty_vec() {
        let days = parse_timor(r#"{"code":0,"holiday":{}}"#);
        assert!(days.is_empty());
    }

    #[test]
    fn broken_json_returns_empty_vec_not_panic() {
        assert!(parse_timor("not json").is_empty());
        assert!(parse_holiday_cn("not json").is_empty());
    }

    #[test]
    fn cloudflare_challenge_html_returns_empty_vec() {
        let html = "<!DOCTYPE html><html lang=\"en-US\"><head><title>Just a moment...</title>";
        assert!(parse_timor(html).is_empty());
    }
}
