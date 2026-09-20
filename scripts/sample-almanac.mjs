import { Solar } from "lunar-typescript";

const dates = [
  "2026-01-01", "2026-01-20", "2026-02-17", "2026-03-05", "2026-03-20",
  "2026-04-05", "2026-04-20", "2026-05-01", "2026-05-21", "2026-06-05",
  "2026-06-21", "2026-07-07", "2026-07-23", "2026-08-07", "2026-08-23",
  "2026-09-07", "2026-09-20", "2026-09-23", "2026-09-25", "2026-10-01",
];

for (const iso of dates) {
  const [y, m, d] = iso.split("-").map(Number);
  const solar = Solar.fromYmd(y, m, d);
  const lunar = solar.getLunar();
  const festivals = [...solar.getFestivals(), ...lunar.getFestivals()];
  console.log(
    [
      iso,
      lunar.toString(),
      "宜:" + lunar.getDayYi(1).join("、"),
      "忌:" + lunar.getDayJi(1).join("、"),
      festivals.length ? "节日:" + festivals.join("、") : "",
      lunar.getJieQi() ? "节气:" + lunar.getJieQi() : "",
    ]
      .filter(Boolean)
      .join(" | "),
  );
}
