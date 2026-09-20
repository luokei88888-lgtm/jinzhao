import { invoke } from "@tauri-apps/api/core";

export type DayWeather = {
  date: string;
  code: number;
  tempMax: number;
  tempMin: number;
  feelsMax: number;
  feelsMin: number;
  precipProb: number;
  uvMax: number;
  sunrise: string;
  sunset: string;
};

export type CurrentWeather = {
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  precip: number;
  code: number;
};

export type Forecast = { current: CurrentWeather; days: DayWeather[] };

export type ForecastResponse = {
  forecast: Forecast;
  fetchedAt: number;
  stale: boolean;
};

export type AppConfig = {
  cityName: string;
  lat: number;
  lon: number;
  cityLocked: boolean;
};

export type HolidayDay = { date: string; name: string; isOffDay: boolean };

export const api = {
  getConfig: () => invoke<AppConfig>("get_config"),
  setCity: (name: string, lat: number, lon: number) =>
    invoke<AppConfig>("set_city", { name, lat, lon }),
  locateByIp: () => invoke<AppConfig>("locate_by_ip"),
  getForecast: (lat: number, lon: number) =>
    invoke<ForecastResponse>("get_forecast", { lat, lon }),
  getHolidays: (year: number) => invoke<HolidayDay[]>("get_holidays", { year }),
};
