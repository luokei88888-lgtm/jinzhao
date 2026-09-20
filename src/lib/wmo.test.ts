import { describe, expect, it } from "vitest";
import { describeWeather } from "./wmo";

describe("describeWeather", () => {
  it("0 是晴", () => {
    expect(describeWeather(0)).toEqual({ text: "晴", icon: "sun" });
  });

  it("2 是多云，3 是阴", () => {
    expect(describeWeather(2).text).toBe("多云");
    expect(describeWeather(3).text).toBe("阴");
  });

  it("45 是雾", () => {
    expect(describeWeather(45).text).toBe("雾");
  });

  it("61 63 65 分别是小中大 雨", () => {
    expect(describeWeather(61).text).toBe("小雨");
    expect(describeWeather(63).text).toBe("中雨");
    expect(describeWeather(65).text).toBe("大雨");
  });

  it("71 73 75 分别是小中大 雪", () => {
    expect(describeWeather(71).text).toBe("小雪");
    expect(describeWeather(73).text).toBe("中雪");
    expect(describeWeather(75).text).toBe("大雪");
  });

  it("95 是雷阵雨", () => {
    expect(describeWeather(95).text).toBe("雷阵雨");
  });

  it("未知代码不抛异常，返回兜底文案", () => {
    expect(describeWeather(999)).toEqual({ text: "未知天气", icon: "help" });
    expect(describeWeather(-1)).toEqual({ text: "未知天气", icon: "help" });
  });
});
