import { describe, expect, it } from "vitest";
import { describeWeather } from "./wmo";

describe("describeWeather", () => {
  it("0 是晴", () => {
    expect(describeWeather(0)).toBe("晴");
  });

  it("2 是多云，3 是阴", () => {
    expect(describeWeather(2)).toBe("多云");
    expect(describeWeather(3)).toBe("阴");
  });

  it("45 是雾", () => {
    expect(describeWeather(45)).toBe("雾");
  });

  it("61 63 65 分别是小中大 雨", () => {
    expect(describeWeather(61)).toBe("小雨");
    expect(describeWeather(63)).toBe("中雨");
    expect(describeWeather(65)).toBe("大雨");
  });

  it("71 73 75 分别是小中大 雪", () => {
    expect(describeWeather(71)).toBe("小雪");
    expect(describeWeather(73)).toBe("中雪");
    expect(describeWeather(75)).toBe("大雪");
  });

  it("95 是雷阵雨", () => {
    expect(describeWeather(95)).toBe("雷阵雨");
  });

  it("未知代码不抛异常，返回兜底文案", () => {
    expect(describeWeather(999)).toBe("未知天气");
    expect(describeWeather(-1)).toBe("未知天气");
  });
});
