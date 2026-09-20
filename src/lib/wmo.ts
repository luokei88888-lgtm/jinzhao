export type WeatherText = { text: string; icon: string };

const TABLE: Record<number, WeatherText> = {
  0: { text: "晴", icon: "sun" },
  1: { text: "少云", icon: "sun-cloud" },
  2: { text: "多云", icon: "cloud-sun" },
  3: { text: "阴", icon: "cloud" },
  45: { text: "雾", icon: "fog" },
  48: { text: "冻雾", icon: "fog" },
  51: { text: "毛毛雨", icon: "drizzle" },
  53: { text: "毛毛雨", icon: "drizzle" },
  55: { text: "毛毛雨", icon: "drizzle" },
  56: { text: "冻毛毛雨", icon: "drizzle" },
  57: { text: "冻毛毛雨", icon: "drizzle" },
  61: { text: "小雨", icon: "rain" },
  63: { text: "中雨", icon: "rain" },
  65: { text: "大雨", icon: "rain-heavy" },
  66: { text: "冻雨", icon: "rain" },
  67: { text: "冻雨", icon: "rain" },
  71: { text: "小雪", icon: "snow" },
  73: { text: "中雪", icon: "snow" },
  75: { text: "大雪", icon: "snow-heavy" },
  77: { text: "雪粒", icon: "snow" },
  80: { text: "阵雨", icon: "shower" },
  81: { text: "阵雨", icon: "shower" },
  82: { text: "强阵雨", icon: "shower" },
  85: { text: "阵雪", icon: "snow" },
  86: { text: "阵雪", icon: "snow" },
  95: { text: "雷阵雨", icon: "thunder" },
  96: { text: "雷阵雨伴冰雹", icon: "thunder" },
  99: { text: "雷阵雨伴冰雹", icon: "thunder" },
};

const FALLBACK: WeatherText = { text: "未知天气", icon: "help" };

export function describeWeather(code: number): WeatherText {
  return TABLE[code] ?? FALLBACK;
}
