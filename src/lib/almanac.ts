import { Solar } from "lunar-typescript";

// 探针实测：sect 取 1 与取 2，在 8 个日期（含秋分、中秋、国庆、春节与闰年 2 月 29 日）
// 上算出的宜忌完全一致，所以固定为 1，只为消除不确定性。
const SECT = 1;

export type Almanac = {
  lunarText: string;
  ganzhiDay: string;
  festivals: string[];
  jieQi: string | null;
  yi: string[];
  ji: string[];
};

export function almanacOf(iso: string): Almanac {
  const [y, m, d] = iso.split("-").map(Number);
  const solar = Solar.fromYmd(y, m, d);
  const lunar = solar.getLunar();

  // 探针实测：两处 getFestivals() 都返回 string[]，不是对象数组。
  const festivals: string[] = [...solar.getFestivals(), ...lunar.getFestivals()];
  const jieQi = lunar.getJieQi();

  return {
    lunarText:
      lunar.getYearInChinese() + "年" + lunar.getMonthInChinese() + "月" + lunar.getDayInChinese(),
    ganzhiDay: lunar.getDayInGanZhi(),
    festivals,
    jieQi: jieQi ? jieQi : null,
    yi: lunar.getDayYi(SECT),
    ji: lunar.getDayJi(SECT),
  };
}
