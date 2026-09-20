import { describe, expect, it } from "vitest";
import { almanacOf } from "./almanac";

describe("almanacOf", () => {
  it("2026-09-20 的农历与干支与百度日历一致", () => {
    const a = almanacOf("2026-09-20");
    expect(a.lunarText).toContain("八月初十");
    expect(a.ganzhiDay).toBe("丁酉");
  });

  it("宜忌都返回非空数组", () => {
    const a = almanacOf("2026-09-20");
    expect(a.yi.length).toBeGreaterThan(0);
    expect(a.ji.length).toBeGreaterThan(0);
  });

  it("固定 sect 取值后结果稳定，同一天两次调用一致", () => {
    expect(almanacOf("2026-09-20").yi).toEqual(almanacOf("2026-09-20").yi);
  });

  it("节日会同时收集公历与农历来源", () => {
    expect(almanacOf("2026-10-01").festivals).toContain("国庆节");
    expect(almanacOf("2026-09-25").festivals).toContain("中秋节");
  });

  it("节气有值时为字符串，无节气时为 null", () => {
    expect(almanacOf("2026-09-23").jieQi).toBe("秋分");
    expect(almanacOf("2026-09-20").jieQi).toBeNull();
  });

  it("跨年日期也能算", () => {
    expect(almanacOf("2027-01-01").yi.length).toBeGreaterThan(0);
  });
});
