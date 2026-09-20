import { Solar } from "lunar-typescript";

const dates = [
  [2026, 9, 20],
  [2026, 9, 23],
  [2026, 9, 25],
  [2026, 10, 1],
  [2026, 2, 17],
  [2026, 1, 1],
  [2027, 1, 1],
  [2028, 2, 29],
];

let sectDiffers = 0;
for (const [y, m, d] of dates) {
  const s = Solar.fromYmd(y, m, d);
  const l = s.getLunar();
  const sf = s.getFestivals();
  const lf = l.getFestivals();
  const yi1 = JSON.stringify(l.getDayYi(1));
  const yi2 = JSON.stringify(l.getDayYi(2));
  const ji1 = JSON.stringify(l.getDayJi(1));
  const ji2 = JSON.stringify(l.getDayJi(2));
  if (yi1 !== yi2 || ji1 !== ji2) sectDiffers++;
  console.log(
    [
      y + "-" + m + "-" + d,
      l.toString(),
      l.getDayInGanZhi(),
      "节气:" + l.getJieQi(),
      "公历节日:" + JSON.stringify(sf.map((f) => String(f))),
      "农历节日:" + JSON.stringify(lf.map((f) => String(f))),
      "sect同:" + (yi1 === yi2 && ji1 === ji2),
    ].join(" | "),
  );
}
console.log("sect 有差异的日期数:", sectDiffers, "/", dates.length);

const sample = Solar.fromYmd(2026, 10, 1);
const sFest = sample.getFestivals();
if (sFest.length > 0) {
  console.log("公历节日元素:", typeof sFest[0], sFest[0]?.constructor?.name, "String():", String(sFest[0]));
  console.log("是否有 getName:", typeof sFest[0]?.getName);
}
const sampleLunar = Solar.fromYmd(2026, 9, 25).getLunar();
const lFest = sampleLunar.getFestivals();
if (lFest.length > 0) {
  console.log("农历节日元素:", typeof lFest[0], lFest[0]?.constructor?.name, "String():", String(lFest[0]));
  console.log("是否有 getName:", typeof lFest[0]?.getName);
}

const solar = Solar.fromYmd(2026, 9, 20);
const lunar = solar.getLunar();

console.log("农历:", lunar.toString());
console.log("年:", lunar.getYearInChinese(), "月:", lunar.getMonthInChinese(), "日:", lunar.getDayInChinese());
console.log("日干支:", lunar.getDayInGanZhi(), "/", lunar.getDayInGanZhiExact());
console.log("公历节日:", JSON.stringify(solar.getFestivals()));
console.log("农历节日:", JSON.stringify(lunar.getFestivals()));
console.log("节气:", JSON.stringify(lunar.getJieQi()));
console.log("宜 无参:", JSON.stringify(lunar.getDayYi()));
console.log("宜 sect1:", JSON.stringify(lunar.getDayYi(1)));
console.log("宜 sect2:", JSON.stringify(lunar.getDayYi(2)));
console.log("忌 无参:", JSON.stringify(lunar.getDayJi()));
console.log("忌 sect1:", JSON.stringify(lunar.getDayJi(1)));
console.log("忌 sect2:", JSON.stringify(lunar.getDayJi(2)));
console.log(
  "可用方法:",
  Object.getOwnPropertyNames(Object.getPrototypeOf(lunar))
    .filter((n) => /Yi|Ji|Festival|JieQi/.test(n))
    .join(", "),
);

const fest = solar.getFestivals();
if (fest.length > 0) {
  console.log("公历节日元素类型:", typeof fest[0], "构造名:", fest[0]?.constructor?.name);
  console.log("公历节日元素字符串:", String(fest[0]), "getName:", fest[0]?.getName?.());
}
