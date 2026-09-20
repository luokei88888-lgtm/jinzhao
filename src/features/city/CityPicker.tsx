import { useState } from "react";
import type { AppConfig } from "../../lib/api";

// v1 只提供两个实际会用到的城市。自定义城市搜索需要引入地理编码服务，
// 超出当前范围，留到 v2。
const PRESETS = [
  { name: "北京", lat: 39.9042, lon: 116.4074 },
  { name: "唐山", lat: 39.6304, lon: 118.1802 },
];

export function CityPicker({
  config,
  onPick,
}: {
  config: AppConfig | null;
  onPick: (name: string, lat: number, lon: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="city-picker">
      <button type="button" className="city-button" onClick={() => setOpen(!open)}>
        {config?.cityName ?? "北京"}
        {config && !config.cityLocked ? <span className="hint">未定位</span> : null}
      </button>
      {open ? (
        <div className="city-menu">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className="city-item"
              onClick={() => {
                onPick(preset.name, preset.lat, preset.lon);
                setOpen(false);
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
