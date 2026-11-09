import React, { useMemo, useState } from "react";
import { Activity, ArrowUpRight, CalendarDays, HandHeart, Users } from "lucide-react";
import "./OurImpact.css";

const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(Number(value || 0));

const getDate = (item) => {
  const raw = item?.createdAt || item?.createdDate || item?.date || item?.paymentDate || item?.transactionDate || item?.contributionDate;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getCategory = (item) => item?.purpose || item?.category || item?.campaignName || item?.type || "General Contribution";

function BarChart({ data }) {
  const max = Math.max(1, ...data.map((x) => x.amount));
  return <div className="impact-bars" role="img" aria-label="Monthly recorded contributions bar chart">
    {data.map((item) => <div className="impact-bar-col" key={item.key}>
      <div className="impact-bar-value">{item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)}k` : item.amount}</div>
      <div className="impact-bar-track"><div className="impact-bar-fill" style={{ height: `${Math.max(item.amount ? 5 : 0, (item.amount / max) * 100)}%` }} /></div>
      <span>{item.label}</span>
    </div>)}
  </div>;
}

function DonutChart({ items, total }) {
  const palette = ["#8b7cff", "#36c9a4", "#f5b94c", "#4aa8e8", "#ef829d", "#9aa8ba"];
  let cursor = 0;
  const segments = items.map((item, index) => {
    const start = cursor;
    cursor += total ? (item.amount / total) * 100 : 0;
    return `${palette[index % palette.length]} ${start}% ${cursor}%`;
  });
  return <div className="impact-donut-wrap">
    <div className="impact-donut" style={{ background: segments.length ? `conic-gradient(${segments.join(",")})` : "#303746" }}>
      <div className="impact-donut-hole"><strong>{money(total)}</strong><span>Recorded</span></div>
    </div>
    <div className="impact-legend">{items.length ? items.map((item, index) => <div className="impact-legend-row" key={item.name}>
      <i style={{ background: palette[index % palette.length] }} /><span>{item.name}</span><b>{money(item.amount)}</b>
    </div>) : <p className="impact-empty">No contribution categories available yet.</p>}</div>
  </div>;
}

export default function OurImpact({ contributions = [], members = [], events = [] }) {
  const [range, setRange] = useState(6);
  const now = new Date();
  const analytics = useMemo(() => {
    const validContributions = Array.isArray(contributions) ? contributions : [];
    const total = validContributions.reduce((sum, item) => sum + Math.max(0, Number(item?.amount || 0)), 0);
    const monthly = Array.from({ length: range }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (range - index - 1), 1);
      return { key: `${date.getFullYear()}-${date.getMonth()}`, label: date.toLocaleDateString("en-IN", { month: "short" }), amount: 0 };
    });
    validContributions.forEach((item) => {
      const date = getDate(item);
      if (!date) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const bucket = monthly.find((month) => month.key === key);
      if (bucket) bucket.amount += Math.max(0, Number(item?.amount || 0));
    });
    const categoryMap = new Map();
    validContributions.forEach((item) => {
      const name = String(getCategory(item)).trim() || "General Contribution";
      categoryMap.set(name, (categoryMap.get(name) || 0) + Math.max(0, Number(item?.amount || 0)));
    });
    const categories = [...categoryMap].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 6);
    const datedCount = validContributions.filter(getDate).length;
    return { total, monthly, categories, datedCount };
  }, [contributions, range]);

  return <section className="our-impact-page">
    <header className="impact-heading">
      <div><span className="impact-eyebrow">OUR COMMUNITY · OUR PROGRESS</span><h1>Our Impact</h1>
        <p>See how our community is growing and how recorded contributions are adding up.</p></div>
      <div className="impact-range" aria-label="Chart date range">
        {[6, 12].map((value) => <button key={value} className={range === value ? "active" : ""} onClick={() => setRange(value)}>{value} Months</button>)}
      </div>
    </header>

    <div className="impact-stat-grid">
      <article className="impact-stat-card"><span className="impact-stat-icon purple"><HandHeart size={19}/></span><small>Total Recorded Contributions</small><strong>{money(analytics.total)}</strong><em>All records currently loaded</em></article>
      <article className="impact-stat-card"><span className="impact-stat-icon green"><Users size={19}/></span><small>Community Members</small><strong>{members.length.toLocaleString("en-IN")}</strong><em>Members available in the system</em></article>
      <article className="impact-stat-card"><span className="impact-stat-icon amber"><CalendarDays size={19}/></span><small>Community Events</small><strong>{events.length.toLocaleString("en-IN")}</strong><em>Events available in the system</em></article>
      <article className="impact-stat-card"><span className="impact-stat-icon blue"><Activity size={19}/></span><small>Contribution Records</small><strong>{contributions.length.toLocaleString("en-IN")}</strong><em>{analytics.datedCount} with a usable date</em></article>
    </div>

    <div className="impact-chart-grid">
      <article className="impact-panel impact-panel-wide"><div className="impact-panel-head"><div><h2>Monthly Contributions</h2><p>Recorded contribution amount by month</p></div><span className="impact-panel-tag">{range} MONTHS</span></div>
        {analytics.monthly.some((item) => item.amount > 0) ? <BarChart data={analytics.monthly}/> : <div className="impact-no-data">No dated contribution records found for this period.</div>}
      </article>
      <article className="impact-panel"><div className="impact-panel-head"><div><h2>Contribution Distribution</h2><p>Breakdown by purpose or category</p></div></div>
        <DonutChart items={analytics.categories} total={analytics.categories.reduce((sum, item) => sum + item.amount, 0)}/>
      </article>
    </div>
    <p className="impact-disclaimer">Figures are calculated from contribution, member and event records returned by the backend. Monthly trends require a valid contribution date. Check payment status in the contributions section before treating recorded amounts as received income.</p>
  </section>;
}
