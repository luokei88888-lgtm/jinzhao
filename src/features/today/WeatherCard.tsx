import type { CurrentWeather, DayWeather } from "../../lib/api";
import { advise } from "../../lib/dress";
import { describeWeather } from "../../lib/wmo";

function clockOf(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WeatherCard({
  cityName,
  current,
  day,
  fetchedAt,
  stale,
  error,
}: {
  cityName: string;
  current?: CurrentWeather;
  day?: DayWeather;
  fetchedAt?: number;
  stale?: boolean;
  error?: string;
}) {
  if (!day) {
    return (
      <section className="card weather">
        <div className="sub">{cityName}</div>
        <p className="placeholder-text">{error || "这一天还没有预报"}</p>
      </section>
    );
  }

  const weather = describeWeather(day.code);
  const advice = advise({
    feelsMax: day.feelsMax,
    feelsMin: day.feelsMin,
    precipProb: day.precipProb,
    uvMax: day.uvMax,
    windMax: current?.wind ?? 0,
  });

  return (
    <section className="card weather">
      <div className="sub">{cityName}</div>
      <div className="temp-row">
        <span className="temp">{Math.round(current?.temp ?? day.tempMax)}°</span>
        <span className="cond">
          {weather.text}
          <br />
          {Math.round(day.tempMin)}~{Math.round(day.tempMax)}° · 体感 {Math.round(day.feelsMin)}~
          {Math.round(day.feelsMax)}°
        </span>
      </div>
      <div className="metrics">
        湿度 {Math.round(current?.humidity ?? 0)}% · 风 {Math.round(current?.wind ?? 0)} 公里/时 ·
        紫外线 {Math.round(day.uvMax)}
      </div>
      <div className="advice">{advice.sentence}</div>
      {advice.tips.length > 0 ? <div className="tips">{advice.tips.join(" · ")}</div> : null}
      {fetchedAt ? (
        <div className="stamp">
          更新于 {clockOf(fetchedAt)}
          {stale ? "（离线数据）" : ""}
        </div>
      ) : null}
    </section>
  );
}
