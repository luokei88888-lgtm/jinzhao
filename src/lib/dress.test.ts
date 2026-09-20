import { describe, expect, it } from "vitest";
import { advise, THRESHOLDS } from "./dress";

describe("advise", () => {
  it("体感 28 度按短袖短装处理，边界取等号", () => {
    const r = advise({ feelsMax: 28, feelsMin: 28, precipProb: 0, uvMax: 0, windMax: 0 });
    expect(r.dayLabel).toBe("短袖短装");
    expect(r.nightLabel).toBe("短袖短装");
    expect(r.sentence).toBe("短袖短装就可以");
    expect(r.tips).toEqual([]);
  });

  it("体感 27.9 度掉到短袖档", () => {
    const r = advise({ feelsMax: 27.9, feelsMin: 27.9, precipProb: 0, uvMax: 0, windMax: 0 });
    expect(r.dayLabel).toBe("短袖");
  });

  it("体感 16 度按薄外套处理，15.9 度掉到夹克档", () => {
    expect(advise({ feelsMax: 16, feelsMin: 16, precipProb: 0, uvMax: 0, windMax: 0 }).dayLabel).toBe("薄外套");
    expect(advise({ feelsMax: 15.9, feelsMin: 15.9, precipProb: 0, uvMax: 0, windMax: 0 }).dayLabel).toBe("夹克或风衣");
  });

  it("白天与早晚档不同时输出组合句", () => {
    const r = advise({ feelsMax: 26, feelsMin: 14, precipProb: 0, uvMax: 0, windMax: 0 });
    expect(r.sentence).toBe("白天短袖，早晚夹克或风衣");
  });

  it("降水概率达到 50 提醒带伞，49 不提醒", () => {
    expect(advise({ feelsMax: 20, feelsMin: 20, precipProb: 50, uvMax: 0, windMax: 0 }).tips).toContain("记得带伞");
    expect(advise({ feelsMax: 20, feelsMin: 20, precipProb: 49, uvMax: 0, windMax: 0 }).tips).not.toContain("记得带伞");
  });

  it("紫外线达到 6 提醒防晒，5.9 不提醒", () => {
    expect(advise({ feelsMax: 20, feelsMin: 20, precipProb: 0, uvMax: 6, windMax: 0 }).tips).toContain("注意防晒");
    expect(advise({ feelsMax: 20, feelsMin: 20, precipProb: 0, uvMax: 5.9, windMax: 0 }).tips).not.toContain("注意防晒");
  });

  it("体感温差达到 10 度提醒早晚加衣", () => {
    expect(advise({ feelsMax: 24, feelsMin: 14, precipProb: 0, uvMax: 0, windMax: 0 }).tips).toContain("昼夜温差大，早晚注意加衣");
    expect(advise({ feelsMax: 24, feelsMin: 14.1, precipProb: 0, uvMax: 0, windMax: 0 }).tips).not.toContain("昼夜温差大，早晚注意加衣");
  });

  it("风速达到 30 提醒防风", () => {
    expect(advise({ feelsMax: 20, feelsMin: 20, precipProb: 0, uvMax: 0, windMax: 30 }).tips).toContain("风大，注意防风");
    expect(advise({ feelsMax: 20, feelsMin: 20, precipProb: 0, uvMax: 0, windMax: 29.9 }).tips).not.toContain("风大，注意防风");
  });

  it("阈值常量与文档一致", () => {
    expect(THRESHOLDS).toEqual({ rain: 50, uv: 6, spread: 10, wind: 30 });
  });
});
