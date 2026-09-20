import { useEffect, useMemo, useState } from "react";
import { almanacOf } from "../../lib/almanac";
import { api, type AppConfig, type Forecast, type HolidayDay } from "../../lib/api";
import { addDays, formatCn, todayIso, weekdayCn } from "../../lib/date";
import { CityPicker } from "../city/CityPicker";
import { AlmanacCard } from "./AlmanacCard";
import { UpcomingStrip } from "./UpcomingStrip";
import { WeatherCard } from "./WeatherCard";

const FALLBACK_CONFIG: AppConfig = {
  cityName: "北京",
  lat: 39.9042,
  lon: 116.4074,
  cityLocked: false,
};

export function TodayPage() {
  const today = useMemo(() => todayIso(), []);
  const [date, setDate] = useState(today);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [meta, setMeta] = useState<{ fetchedAt: number; stale: boolean } | null>(null);
  const [holidays, setHolidays] = useState<HolidayDay[]>([]);
  const [weatherError, setWeatherError] = useState("");

  useEffect(() => {
    void (async () => {
      let cfg: AppConfig;
      try {
        cfg = await api.getConfig();
      } catch {
        cfg = FALLBACK_CONFIG;
      }

      if (!cfg.cityLocked) {
        try {
          cfg = await api.locateByIp();
        } catch {
          /* 定位失败就沿用已有城市 */
        }
      }
      setConfig(cfg);

      try {
        const res = await api.getForecast(cfg.lat, cfg.lon);
        setForecast(res.forecast);
        setMeta({ fetchedAt: res.fetchedAt, stale: res.stale });
        setWeatherError("");
      } catch {
        setWeatherError("暂时拿不到天气，联网后会自动重试");
      }

      try {
        setHolidays(await api.getHolidays(Number(today.slice(0, 4))));
      } catch {
        setHolidays([]);
      }
    })();
  }, [today]);

  const almanac = useMemo(() => almanacOf(date), [date]);
  const day = forecast?.days.find((d) => d.date === date);
  const holiday = holidays.find((h) => h.date === date);

  async function pickCity(name: string, lat: number, lon: number) {
    try {
      const next = await api.setCity(name, lat, lon);
      setConfig(next);
      setWeatherError("");
      try {
        const res = await api.getForecast(next.lat, next.lon);
        setForecast(res.forecast);
        setMeta({ fetchedAt: res.fetchedAt, stale: res.stale });
      } catch {
        setWeatherError("暂时拿不到天气，联网后会自动重试");
      }
    } catch {
      setWeatherError("切换城市失败，请重试");
    }
  }

  return (
    <div className="today">
      <div className="date-bar">
        <button type="button" className="arrow" onClick={() => setDate(addDays(date, -1))} aria-label="前一天">
          ‹
        </button>
        <span className="date-text">
          {formatCn(date)} {weekdayCn(date)}
        </span>
        <button type="button" className="arrow" onClick={() => setDate(addDays(date, 1))} aria-label="后一天">
          ›
        </button>
        {date === today ? null : (
          <button type="button" className="today-btn" onClick={() => setDate(today)}>
            回到今天
          </button>
        )}
      </div>
      <CityPicker config={config} onPick={(name, lat, lon) => void pickCity(name, lat, lon)} />
      <AlmanacCard
        almanac={almanac}
        holiday={
          holiday ? (holiday.isOffDay ? "休 · " + holiday.name : "班 · " + holiday.name) : undefined
        }
      />
      <WeatherCard
        cityName={config?.cityName ?? "北京"}
        current={date === today ? forecast?.current : undefined}
        day={day}
        fetchedAt={date === today ? meta?.fetchedAt : undefined}
        stale={date === today ? meta?.stale : undefined}
        error={weatherError}
      />
      <UpcomingStrip today={today} days={forecast?.days ?? []} onPick={setDate} />
    </div>
  );
}
