import type { Almanac } from "../../lib/almanac";

const YI_LIMIT = 8;

function list(items: string[], limit: number): string {
  if (items.length <= limit) return items.join(" · ");
  return items.slice(0, limit).join(" · ") + " 等 " + items.length + " 项";
}

export function AlmanacCard({ almanac, holiday }: { almanac: Almanac; holiday?: string }) {
  return (
    <section className="card almanac">
      <div className="lunar-line">{almanac.lunarText}</div>
      {almanac.ganzhiDay ? <div className="sub">{almanac.ganzhiDay}日</div> : null}
      {almanac.festivals.length > 0 ? (
        <div className="festival">{almanac.festivals.join(" · ")}</div>
      ) : null}
      {almanac.jieQi ? <div className="festival">节气 {almanac.jieQi}</div> : null}
      {holiday ? <div className="holiday">{holiday}</div> : null}
      <div className="tag-row yi">
        <span className="tag-label">宜</span>
        <span>{list(almanac.yi, YI_LIMIT)}</span>
      </div>
      <div className="tag-row ji">
        <span className="tag-label">忌</span>
        <span>{list(almanac.ji, YI_LIMIT)}</span>
      </div>
    </section>
  );
}
