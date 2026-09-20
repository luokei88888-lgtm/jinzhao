use serde::{Deserialize, Serialize};

const API: &str = "https://api.open-meteo.com/v1/forecast";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DayWeather {
    pub date: String,
    pub code: i64,
    pub temp_max: f64,
    pub temp_min: f64,
    pub feels_max: f64,
    pub feels_min: f64,
    pub precip_prob: f64,
    pub uv_max: f64,
    pub sunrise: String,
    pub sunset: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CurrentWeather {
    pub temp: f64,
    pub feels: f64,
    pub humidity: f64,
    pub wind: f64,
    pub precip: f64,
    pub code: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Forecast {
    pub current: CurrentWeather,
    pub days: Vec<DayWeather>,
}

#[derive(Deserialize)]
struct RawResponse {
    current: Option<RawCurrent>,
    daily: Option<RawDaily>,
}

#[derive(Deserialize)]
struct RawCurrent {
    temperature_2m: Option<f64>,
    relative_humidity_2m: Option<f64>,
    apparent_temperature: Option<f64>,
    precipitation: Option<f64>,
    weather_code: Option<i64>,
    wind_speed_10m: Option<f64>,
}

#[derive(Deserialize)]
struct RawDaily {
    time: Option<Vec<String>>,
    weather_code: Option<Vec<i64>>,
    temperature_2m_max: Option<Vec<f64>>,
    temperature_2m_min: Option<Vec<f64>>,
    apparent_temperature_max: Option<Vec<f64>>,
    apparent_temperature_min: Option<Vec<f64>>,
    precipitation_probability_max: Option<Vec<f64>>,
    uv_index_max: Option<Vec<f64>>,
    sunrise: Option<Vec<String>>,
    sunset: Option<Vec<String>>,
}

fn at(values: &Option<Vec<f64>>, index: usize) -> f64 {
    values.as_ref().and_then(|v| v.get(index)).copied().unwrap_or(0.0)
}

fn at_i(values: &Option<Vec<i64>>, index: usize) -> i64 {
    values.as_ref().and_then(|v| v.get(index)).copied().unwrap_or(-1)
}

fn at_s(values: &Option<Vec<String>>, index: usize) -> String {
    values.as_ref().and_then(|v| v.get(index)).cloned().unwrap_or_default()
}

pub fn parse_forecast(json: &str) -> Result<Forecast, crate::error::AppError> {
    let raw: RawResponse = serde_json::from_str(json)
        .map_err(|e| crate::error::AppError::new("weather_parse_failed", &e.to_string()))?;

    let current = raw.current.unwrap_or(RawCurrent {
        temperature_2m: None,
        relative_humidity_2m: None,
        apparent_temperature: None,
        precipitation: None,
        weather_code: None,
        wind_speed_10m: None,
    });

    let daily = raw.daily.unwrap_or(RawDaily {
        time: None,
        weather_code: None,
        temperature_2m_max: None,
        temperature_2m_min: None,
        apparent_temperature_max: None,
        apparent_temperature_min: None,
        precipitation_probability_max: None,
        uv_index_max: None,
        sunrise: None,
        sunset: None,
    });

    let dates = daily.time.clone().unwrap_or_default();
    let mut days = Vec::with_capacity(dates.len());
    for (i, date) in dates.iter().enumerate() {
        days.push(DayWeather {
            date: date.clone(),
            code: at_i(&daily.weather_code, i),
            temp_max: at(&daily.temperature_2m_max, i),
            temp_min: at(&daily.temperature_2m_min, i),
            feels_max: at(&daily.apparent_temperature_max, i),
            feels_min: at(&daily.apparent_temperature_min, i),
            precip_prob: at(&daily.precipitation_probability_max, i),
            uv_max: at(&daily.uv_index_max, i),
            sunrise: at_s(&daily.sunrise, i),
            sunset: at_s(&daily.sunset, i),
        });
    }

    Ok(Forecast {
        current: CurrentWeather {
            temp: current.temperature_2m.unwrap_or(0.0),
            feels: current.apparent_temperature.unwrap_or(0.0),
            humidity: current.relative_humidity_2m.unwrap_or(0.0),
            wind: current.wind_speed_10m.unwrap_or(0.0),
            precip: current.precipitation.unwrap_or(0.0),
            code: current.weather_code.unwrap_or(-1),
        },
        days,
    })
}

pub fn build_url(lat: f64, lon: f64) -> String {
    format!(
        "{}?latitude={}&longitude={}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,uv_index_max,sunrise,sunset&timezone=Asia%2FShanghai&forecast_days=16",
        API, lat, lon
    )
}

pub async fn fetch(lat: f64, lon: f64) -> Result<Forecast, crate::error::AppError> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(12))
        .build()
        .map_err(|e| crate::error::AppError::new("weather_client_failed", &e.to_string()))?;

    let text = client
        .get(build_url(lat, lon))
        .header("User-Agent", "jinzhao/0.1")
        .send()
        .await
        .map_err(|e| crate::error::AppError::new("weather_request_failed", &e.to_string()))?
        .text()
        .await
        .map_err(|e| crate::error::AppError::new("weather_read_failed", &e.to_string()))?;

    parse_forecast(&text)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture() -> String {
        include_str!("../../../tests/fixtures/open-meteo-sample.json").to_string()
    }

    #[test]
    fn parses_sixteen_days() {
        let f = parse_forecast(&fixture()).expect("fixture should parse");
        assert_eq!(f.days.len(), 16);
        assert_eq!(f.days[0].date.len(), 10);
    }

    #[test]
    fn current_block_is_present() {
        let f = parse_forecast(&fixture()).expect("fixture should parse");
        assert!(f.current.temp > -80.0 && f.current.temp < 60.0);
    }

    #[test]
    fn missing_daily_field_falls_back_to_default() {
        let broken = "{\"current\":{\"temperature_2m\":20.0},\"daily\":{\"time\":[\"2026-09-20\"],\"weather_code\":[1]}}";
        let f = parse_forecast(broken).expect("should still parse");
        assert_eq!(f.days.len(), 1);
        assert_eq!(f.days[0].temp_max, 0.0);
    }

    #[test]
    fn empty_daily_array_is_allowed() {
        let empty = "{\"current\":{\"temperature_2m\":20.0},\"daily\":{\"time\":[]}}";
        let f = parse_forecast(empty).expect("should still parse");
        assert!(f.days.is_empty());
    }
}
