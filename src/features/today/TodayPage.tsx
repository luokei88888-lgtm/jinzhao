import { useEffect, useMemo, useState } from "react";
import { almanacOf } from "../../lib/almanac";
import { api, type AppConfig, type Forecast, type HolidayDay } from "../../lib/api";
import { addDays, formatCn, todayIso, weekdayCn } from "../../lib/date";
import { applyThemeTo, nextMode, parseThemeMode, type ThemeMode } from "../../lib/theme";
import { CityPicker } from "../city/CityPicker";
import { ThemeToggle } from "../theme/ThemeToggle";
import { AlmanacCard } from "./AlmanacCard";
import { UpcomingStrip } from "./UpcomingStrip";
import { WeatherCard } from "./WeatherCard";

const FALLBACK_CONFIG: AppConfig = {
  cityName: "北京",
  lat: 39.9042,
  lon: 116.4074,
  cityLocked: false,
  theme: "system",
};

export function TodayPage() {
  const today = useMemo(() => todayIso(), []);
  const [date, setDate] = useState(today);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [meta, setMeta] = useState<{ fetchedAt: number; stale: boolean } | null>(null);
  const [holidays, setHolidays] = useState<HolidayDay[]>([]);
  const [weatherError, setWeatherError] = useState("");
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const media =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;
    const sync = () => applyThemeTo(document.documentElement, themeMode, media?.matches ?? false);
    sync();
    if (themeMode !== "system" || !media) return;
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [themeMode]);

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
      setThemeMode(parseThemeMode(cfg.theme));

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

  async function toggleTheme() {
    const next = nextMode(themeMode);
    // 先切界面再落盘：写盘失败也不该让界面停在旧主题
    setThemeMode(next);
    try {
      await api.setThemeMode(next);
    } catch {
      /* 忽略写盘失败 */
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
        <div className="bar-actions">
          {date === today ? null : (
            <button type="button" className="today-btn" onClick={() => setDate(today)}>
              回到今天
            </button>
          )}
          <ThemeToggle mode={themeMode} onToggle={() => void toggleTheme()} />
        </div>
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
