import type { DayWeather } from "../../lib/api";
import { addDays, weekdayCn } from "../../lib/date";
import { describeWeather } from "../../lib/wmo";

export function UpcomingStrip({
  today,
  days,
  onPick,
}: {
  today: string;
  days: DayWeather[];
  onPick: (iso: string) => void;
}) {
  const items = [1, 2, 3].map((offset) => {
    const iso = addDays(today, offset);
    const day = days.find((d) => d.date === iso);
    return { iso, day };
  });

  return (
    <div className="strip">
      {items.map(({ iso, day }) => (
        <button key={iso} type="button" className="strip-item" onClick={() => onPick(iso)}>
          <span className="strip-date">
            {weekdayCn(iso)} {Number(iso.slice(8, 10))}
          </span>
          <span className="strip-cond">{day ? describeWeather(day.code) : "—"}</span>
          <span className="strip-temp">
            {day ? Math.round(day.tempMin) + "~" + Math.round(day.tempMax) + "°" : "暂无预报"}
          </span>
        </button>
      ))}
    </div>
  );
}
