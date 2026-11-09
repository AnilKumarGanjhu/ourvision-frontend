import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Download,
  Edit,
  FileText,
  Handshake,
  Image as ImageIcon,
  Plus,
  Star,
  Trash2,
  Upload,
  Users,
  Wallet,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "../page/ToastContext";
import {
  addExpense,
  assignVolunteer,
  createProgram,
  deleteExpense,
  deleteMedia,
  deleteProgram,
  deleteFeedback,
  fileUrl,
  getFeedback,
  listPrograms,
  submitFeedback,
  registerForProgram,
  removeVolunteer,
  updateProgram,
  updateProgramStatus,
  uploadBanner,
  uploadMedia,
} from "../programApi";
import "./ProgramsDashboard.css";

const CATEGORIES = [
  { key: "EDUCATION", label: "Education Programs", text: "Scholarships, learning and education support." },
  { key: "HEALTHCARE", label: "Healthcare Programs", text: "Medical camps and health awareness." },
  { key: "ENVIRONMENT", label: "Environment Programs", text: "Tree plantation and cleanliness drives." },
  { key: "SOCIAL_WELFARE", label: "Social Welfare", text: "Food distribution and community support." },
];

const STATUSES = [
  { key: "PLANNING", label: "Planning" },
  { key: "ACTIVE", label: "Active" },
  { key: "ON_HOLD", label: "On hold" },
  { key: "COMPLETED", label: "Completed" },
];

const categoryLabel = (k) => CATEGORIES.find((c) => c.key === k)?.label || k;
const statusLabel = (k) => STATUSES.find((s) => s.key === k)?.label || k;

const money = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    Number(n || 0),
  );

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const pad = (n) => String(n).padStart(2, "0");
const monthKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}`;
};
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/* Simple horizontal bars, no chart library needed. */
function BarList({ rows, format = (v) => v, empty = "No data yet" }) {
  if (!rows.length) return <p className="pg-muted">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="pg-bars">
      {rows.map((r) => (
        <div className="pg-bar-row" key={r.label}>
          <span className="pg-bar-label" title={r.label}>{r.label}</span>
          <div className="pg-bar-track">
            <div className="pg-bar-fill" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <span className="pg-bar-value">{format(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

const toFormState = (p) => ({
  title: p?.title || "",
  category: p?.category || "EDUCATION",
  description: p?.description || "",
  status: p?.status || "PLANNING",
  startDate: p?.startDate || "",
  endDate: p?.endDate || "",
  budget: p?.budget ?? "",
  progress: p?.progress ?? 0,
  coordinatorId: p?.coordinatorId ?? "",
});

const toPayload = (f) => ({
  title: f.title.trim(),
  category: f.category,
  description: f.description,
  status: f.status,
  startDate: f.startDate || null,
  endDate: f.endDate || null,
  budget: f.budget === "" ? 0 : Number(f.budget),
  progress: Number(f.progress) || 0,
  coordinatorId: f.coordinatorId ? Number(f.coordinatorId) : null,
});

export default function ProgramsDashboard({ isAdmin, user, members = [] }) {
  const { showToast } = useToast();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editing, setEditing] = useState(null); // null = closed, {} = create, program = edit
  const [openId, setOpenId] = useState(null);

  const reload = async () => {
    try {
      setPrograms((await listPrograms()) || []);
    } catch (err) {
      showToast(err.message || "Could not load programmes.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const replaceProgram = (updated) =>
    setPrograms((list) => {
      if (!updated) return list;
      const exists = list.some((p) => p.id === updated.id);
      return exists ? list.map((p) => (p.id === updated.id ? updated : p)) : [updated, ...list];
    });

  const removeProgram = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? This also removes its volunteers, expenses and files.`)) return;
    try {
      await deleteProgram(p.id);
      setPrograms((list) => list.filter((x) => x.id !== p.id));
      setOpenId(null);
      showToast("Programme deleted.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const stats = useMemo(
    () => ({
      total: programs.length,
      active: programs.filter((p) => p.status === "ACTIVE").length,
      completed: programs.filter((p) => p.status === "COMPLETED").length,
      participants: programs.reduce((sum, p) => sum + (p.participantCount || 0), 0),
    }),
    [programs],
  );

  const months = useMemo(() => {
    const now = new Date();
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push({ key: monthKey(d), label: d.toLocaleDateString("en-IN", { month: "short" }) });
    }
    return arr;
  }, []);

  const analytics = useMemo(() => {
    const createdByMonth = months.map((m) => ({
      label: m.label,
      value: programs.filter((p) => p.createdAt && monthKey(p.createdAt) === m.key).length,
    }));
    const completedByMonth = months.map((m) => ({
      label: m.label,
      value: programs.filter((p) => p.status === "COMPLETED" && p.endDate && monthKey(p.endDate) === m.key).length,
    }));
    const byCategory = CATEGORIES.map((c) => ({
      label: c.label,
      value: programs.filter((p) => p.category === c.key).length,
    }));
    const byParticipants = [...programs]
      .sort((a, b) => (b.participantCount || 0) - (a.participantCount || 0))
      .slice(0, 6)
      .map((p) => ({ label: p.title, value: p.participantCount || 0 }));
    const completion = [...programs]
      .sort((a, b) => (b.progress || 0) - (a.progress || 0))
      .slice(0, 6)
      .map((p) => ({ label: p.title, value: p.progress || 0 }));
    const budgetRows = programs
      .filter((p) => Number(p.budget) > 0 || Number(p.actualExpense) > 0)
      .slice(0, 6);
    // Cumulative unique members who had joined by the end of each month
    const participantGrowth = months.map((m) => {
      const [yy, mm] = m.key.split("-").map(Number);
      const monthEnd = new Date(yy, mm, 0, 23, 59, 59);
      const ids = new Set();
      programs.forEach((p) =>
        p.participants.forEach((x) => {
          if (x.joinedAt && new Date(x.joinedAt) <= monthEnd) ids.add(x.userId);
        }),
      );
      return { label: m.label, value: ids.size };
    });
    return { createdByMonth, completedByMonth, byCategory, byParticipants, completion, budgetRows, participantGrowth };
  }, [programs, months]);

  const [calMonth, setCalMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const calCells = useMemo(() => {
    const y = calMonth.getFullYear();
    const m = calMonth.getMonth();
    const cells = [];
    for (let i = 0; i < new Date(y, m, 1).getDay(); i++) cells.push(null);
    const days = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const key = `${y}-${pad(m + 1)}-${pad(d)}`;
      cells.push({
        day: d,
        key,
        items: programs.filter((p) => p.startDate && p.endDate && p.startDate <= key && key <= p.endDate),
      });
    }
    return cells;
  }, [calMonth, programs]);

  const upcoming = useMemo(() => {
    const today = todayStr();
    return programs
      .filter((p) => p.status !== "COMPLETED" && p.endDate && p.endDate >= today)
      .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""))
      .slice(0, 5);
  }, [programs]);

  const visible = programs.filter(
    (p) =>
      (categoryFilter === "ALL" || p.category === categoryFilter) &&
      (statusFilter === "ALL" || p.status === statusFilter),
  );

  const openProgram = programs.find((p) => p.id === openId) || null;

  const reportHeader = ["Title", "Category", "Status", "Start", "End", "Budget", "Spent", "Progress %", "Coordinator", "Participants"];
  const reportRows = programs.map((p) => [
    p.title,
    categoryLabel(p.category),
    statusLabel(p.status),
    p.startDate || "",
    p.endDate || "",
    p.budget ?? 0,
    p.actualExpense ?? 0,
    p.progress ?? 0,
    p.coordinatorName || "",
    p.participantCount ?? 0,
  ]);

  const saveBlob = (content, type, filename) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const escapeHtml = (v) =>
    String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const downloadCsv = () => {
    const csv = [reportHeader, ...reportRows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    saveBlob("\ufeff" + csv, "text/csv;charset=utf-8", "our-vision-programs.csv");
  };

  // Real .xlsx workbook with three sheets
  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([reportHeader, ...reportRows]), "Programmes");

    const people = [
      ["Programme", "Member", "Email", "Role", "Joined"],
      ...programs.flatMap((p) =>
        p.participants.map((x) => [
          p.title,
          x.name,
          x.email,
          x.role,
          x.joinedAt ? new Date(x.joinedAt).toLocaleDateString("en-IN") : "",
        ]),
      ),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(people), "Participants");

    const spend = [
      ["Programme", "Expense", "Amount (INR)", "Date"],
      ...programs.flatMap((p) => p.expenses.map((e) => [p.title, e.title, Number(e.amount), e.expenseDate || ""])),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(spend), "Expenses");

    XLSX.writeFile(wb, "our-vision-programs.xlsx");
  };

  // Opens a printable report; the browser's "Save as PDF" creates the file.
  const downloadPdf = () => {
    const w = window.open("", "_blank");
    if (!w) {
      showToast("Allow pop-ups to create the PDF report.", "error");
      return;
    }
    const head = reportHeader.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
    const body = reportRows
      .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`)
      .join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Our Vision – Programme report</title>
<style>
body{font-family:Arial,sans-serif;padding:24px;color:#111}
h1{font-size:20px;margin:0 0 4px} p{color:#555;font-size:12px;margin:0 0 16px}
table{border-collapse:collapse;width:100%;font-size:11px}
th,td{border:1px solid #bbb;padding:6px;text-align:left}
th{background:#eee}
</style></head><body>
<h1>Our Vision – Programme report</h1>
<p>Generated ${escapeHtml(new Date().toLocaleDateString("en-IN"))} · ${reportRows.length} programmes</p>
<table><tr>${head}</tr>${body}</table>
<script>window.onload=function(){window.print();};</script>
</body></html>`);
    w.document.close();
  };

  return (
    <div className="pg-root">
      <div className="page-heading">
        <div>
          <div className="eyebrow">OUR VISION WORKSPACE</div>
          <h1>Our Programs</h1>
          <p>Plan initiatives, track progress and keep your community involved.</p>
        </div>
        <div className="pg-head-actions">
          <button className="pg-btn" onClick={downloadCsv} disabled={!programs.length}>
            <Download size={16} /> CSV
          </button>
          <button className="pg-btn" onClick={downloadExcel} disabled={!programs.length}>
            <Download size={16} /> Excel
          </button>
          <button className="pg-btn" onClick={downloadPdf} disabled={!programs.length}>
            <Download size={16} /> PDF
          </button>
          {isAdmin && (
            <button className="pg-btn pg-btn-primary" onClick={() => setEditing({})}>
              <Plus size={16} /> New programme
            </button>
          )}
        </div>
      </div>

      {/* 1. Overview cards */}
      <section className="pg-stats">
        <StatCard value={stats.total} label="Total Programs" sub="All programmes" />
        <StatCard value={stats.active} label="Active Programs" sub="Currently running" />
        <StatCard value={stats.completed} label="Completed" sub="Successfully finished" />
        <StatCard value={stats.participants} label="Participants" sub="Total participation" />
      </section>

      {/* 2. Categories */}
      <section className="pg-categories">
        {CATEGORIES.map((c) => {
          const count = programs.filter((p) => p.category === c.key).length;
          const active = categoryFilter === c.key;
          return (
            <button
              key={c.key}
              className={`pg-category ${active ? "is-active" : ""}`}
              onClick={() => setCategoryFilter(active ? "ALL" : c.key)}
            >
              <span className="pg-category-count">{count}</span>
              <strong>{c.label}</strong>
              <span className="pg-muted">{c.text}</span>
            </button>
          );
        })}
      </section>

      {/* 4. Programme list */}
      <section className="pg-section">
        <div className="pg-section-head">
          <h2>Programmes</h2>
          <div className="pg-filters">
            {["ALL", ...STATUSES.map((s) => s.key)].map((s) => (
              <button
                key={s}
                className={`pg-chip ${statusFilter === s ? "is-active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === "ALL" ? "All" : statusLabel(s)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="pg-muted">Loading programmes…</p>
        ) : !visible.length ? (
          <div className="pg-empty panel">
            <Handshake size={28} />
            <p>{programs.length ? "No programmes match these filters." : "No programmes yet."}</p>
          </div>
        ) : (
          <div className="pg-grid">
            {visible.map((p) => (
              <ProgramCard
                key={p.id}
                program={p}
                isAdmin={isAdmin}
                onOpen={() => setOpenId(p.id)}
                onEdit={() => setEditing(p)}
                onDelete={() => removeProgram(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. Analytics */}
      <section className="pg-section">
        <h2>Analytics</h2>
        <div className="pg-analytics">
          <div className="pg-panel panel">
            <h3>Programmes created (last 6 months)</h3>
            <BarList rows={analytics.createdByMonth} />
          </div>
          <div className="pg-panel panel">
            <h3>Programmes completed (last 6 months)</h3>
            <BarList rows={analytics.completedByMonth} />
          </div>
          <div className="pg-panel panel">
            <h3>Category-wise programmes</h3>
            <BarList rows={analytics.byCategory} />
          </div>
          <div className="pg-panel panel">
            <h3>Participants per programme</h3>
            <BarList rows={analytics.byParticipants} />
          </div>
          <div className="pg-panel panel">
            <h3>Participant growth (cumulative members, last 6 months)</h3>
            <BarList rows={analytics.participantGrowth} empty="No participants yet" />
          </div>
          <div className="pg-panel panel">
            <h3>Completion percentage</h3>
            <BarList rows={analytics.completion} format={(v) => `${v}%`} />
          </div>
          <div className="pg-panel panel">
            <h3>Budget vs actual spend</h3>
            {analytics.budgetRows.length ? (
              analytics.budgetRows.map((p) => {
                const budget = Number(p.budget) || 0;
                const spent = Number(p.actualExpense) || 0;
                const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : spent > 0 ? 100 : 0;
                return (
                  <div className="pg-budget-row" key={p.id}>
                    <div className="pg-budget-head">
                      <span>{p.title}</span>
                      <span className="pg-muted">{money(spent)} / {money(budget)}</span>
                    </div>
                    <div className="pg-bar-track">
                      <div className={`pg-bar-fill ${spent > budget ? "is-over" : ""}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="pg-muted">Add a budget or expenses to see this.</p>
            )}
          </div>
        </div>
      </section>

      {/* Calendar */}
      <section className="pg-section">
        <div className="pg-section-head">
          <h2><CalendarDays size={18} /> Programme calendar</h2>
          <div className="pg-filters">
            <button className="pg-chip" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}>‹ Prev</button>
            <strong>{calMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</strong>
            <button className="pg-chip" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}>Next ›</button>
          </div>
        </div>
        <div className="pg-cal panel">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="pg-cal-head">{d}</div>
          ))}
          {calCells.map((c, i) =>
            c ? (
              <div key={c.key} className={`pg-cal-cell ${c.key === todayStr() ? "is-today" : ""}`}>
                <span className="pg-cal-day">{c.day}</span>
                {c.items.slice(0, 2).map((p) => (
                  <button key={p.id} className={`pg-cal-event pg-status-${p.status.toLowerCase()}`} onClick={() => setOpenId(p.id)}>
                    {p.title}
                  </button>
                ))}
                {c.items.length > 2 && <span className="pg-muted">+{c.items.length - 2} more</span>}
              </div>
            ) : (
              <div key={`e${i}`} className="pg-cal-cell is-empty" />
            ),
          )}
        </div>
      </section>

      {/* Additional: schedule */}
      <section className="pg-section">
        <h2>
          <CalendarDays size={18} /> Upcoming schedule
        </h2>
        <div className="pg-panel panel">
          {upcoming.length ? (
            <ul className="pg-schedule">
              {upcoming.map((p) => (
                <li key={p.id} onClick={() => setOpenId(p.id)}>
                  <strong>{p.title}</strong>
                  <span className="pg-muted">
                    {fmtDate(p.startDate)} – {fmtDate(p.endDate)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pg-muted">No upcoming programmes scheduled.</p>
          )}
        </div>
      </section>

      {editing !== null && (
        <ProgramFormModal
          program={editing.id ? editing : null}
          members={members}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            replaceProgram(saved);
            setEditing(null);
            showToast("Programme saved.", "success");
          }}
        />
      )}

      {openProgram && (
        <ProgramDetail
          program={openProgram}
          isAdmin={isAdmin}
          user={user}
          members={members}
          onClose={() => setOpenId(null)}
          onChanged={replaceProgram}
          onEdit={() => setEditing(openProgram)}
          onDelete={() => removeProgram(openProgram)}
        />
      )}
    </div>
  );
}

function StatCard({ value, label, sub }) {
  return (
    <div className="pg-stat panel">
      <strong>{value}</strong>
      <span className="pg-stat-label">{label}</span>
      <span className="pg-muted">{sub}</span>
    </div>
  );
}

function ProgramCard({ program: p, isAdmin, onOpen, onEdit, onDelete }) {
  return (
    <article className="pg-card panel" onClick={onOpen}>
      <div className="pg-card-banner">
        {p.bannerUrl ? <img src={fileUrl(p.bannerUrl)} alt="" /> : <Handshake size={26} />}
        <span className={`pg-status pg-status-${p.status.toLowerCase()}`}>{statusLabel(p.status)}</span>
      </div>
      <div className="pg-card-body">
        <div className="pg-card-title-row">
          <h3>{p.title}</h3>
          {isAdmin && (
            <div className="pg-card-actions" onClick={(e) => e.stopPropagation()}>
              <button className="pg-icon-btn" title="Edit" onClick={onEdit}><Edit size={15} /></button>
              <button className="pg-icon-btn pg-danger" title="Delete" onClick={onDelete}><Trash2 size={15} /></button>
            </div>
          )}
        </div>
        <p className="pg-muted">
          {categoryLabel(p.category)} · {fmtDate(p.startDate)} – {fmtDate(p.endDate)}
        </p>
        <div className="pg-progress-label">
          <span>Program progress</span>
          <strong>{p.progress}%</strong>
        </div>
        <div className="pg-bar-track">
          <div className="pg-bar-fill" style={{ width: `${p.progress}%` }} />
        </div>
        <div className="pg-card-foot">
          <span className="pg-muted">Coordinator: {p.coordinatorName || "Not assigned"}</span>
          <span className="pg-muted"><Users size={13} /> {p.participantCount}</span>
        </div>
      </div>
    </article>
  );
}

function ProgramFormModal({ program, members, onClose, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(() => toFormState(program));
  const [bannerFile, setBannerFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast("Title is required.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = toPayload(form);
      let saved = program ? await updateProgram(program.id, payload) : await createProgram(payload);
      if (bannerFile) saved = await uploadBanner(saved.id, bannerFile);
      onSaved(saved);
    } catch (err) {
      showToast(err.message || "Could not save programme.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pg-overlay" onClick={onClose}>
      <form className="pg-modal panel" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="pg-modal-head">
          <h2>{program ? "Edit programme" : "New programme"}</h2>
          <button type="button" className="pg-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="pg-form-grid">
          <label className="pg-span-2">Title
            <input value={form.title} onChange={set("title")} maxLength={200} required />
          </label>
          <label>Category
            <select value={form.category} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </label>
          <label>Status
            <select value={form.status} onChange={set("status")}>
              {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>
          <label>Start date
            <input type="date" value={form.startDate} onChange={set("startDate")} />
          </label>
          <label>End date
            <input type="date" value={form.endDate} onChange={set("endDate")} />
          </label>
          <label>Budget (₹)
            <input type="number" min="0" step="1" value={form.budget} onChange={set("budget")} />
          </label>
          <label>Progress (%)
            <input type="number" min="0" max="100" value={form.progress} onChange={set("progress")} />
          </label>
          <label className="pg-span-2">Coordinator
            <select value={form.coordinatorId} onChange={set("coordinatorId")}>
              <option value="">Not assigned</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
            </select>
          </label>
          <label className="pg-span-2">Description
            <textarea rows={3} value={form.description} onChange={set("description")} />
          </label>
          <label className="pg-span-2">Banner image
            <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        <div className="pg-modal-foot">
          <button type="button" className="pg-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="pg-btn pg-btn-primary" disabled={saving}>
            {saving ? "Saving…" : program ? "Save changes" : "Create programme"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ProgramDetail({ program: p, isAdmin, user, members, onClose, onChanged, onEdit, onDelete }) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [assignUser, setAssignUser] = useState("");
  const [assignRole, setAssignRole] = useState("VOLUNTEER");
  const [expense, setExpense] = useState({ title: "", amount: "", expenseDate: "" });
  const [mediaType, setMediaType] = useState("PHOTO");
  const [mediaFile, setMediaFile] = useState(null);
  const [progressDraft, setProgressDraft] = useState(p.progress);
  const [feedback, setFeedback] = useState({ average: 0, count: 0, items: [] });
  const [review, setReview] = useState({ rating: 5, comment: "" });
  useEffect(() => {
    getFeedback(p.id).then(setFeedback).catch(() => {});
  }, [p.id]);

  useEffect(() => setProgressDraft(p.progress), [p.progress]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      const updated = await fn();
      if (updated) onChanged(updated);
      if (okMsg) showToast(okMsg, "success");
    } catch (err) {
      showToast(err.message || "Something went wrong.", "error");
    } finally {
      setBusy(false);
    }
  };

  const assignedIds = new Set(p.participants.map((x) => x.userId));
  const isJoined = user?.userId != null && assignedIds.has(user.userId);
  const canReview = isJoined && (p.status === "ACTIVE" || p.status === "COMPLETED");

  const reloadFeedback = async () => setFeedback(await getFeedback(p.id));

  const submitReview = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await submitFeedback(p.id, { rating: review.rating, comment: review.comment.trim() || null });
      setFeedback(updated);
      setReview({ rating: 5, comment: "" });
      showToast("Thanks for your feedback!", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const removeReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await deleteFeedback(id);
      await reloadFeedback();
    } catch (err) {
      showToast(err.message, "error");
    }
  };
  const spent = Number(p.actualExpense) || 0;
  const budget = Number(p.budget) || 0;
  const spendPct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

  return (
    <div className="pg-overlay" onClick={onClose}>
      <div className="pg-modal pg-detail panel" onClick={(e) => e.stopPropagation()}>
        <div className="pg-modal-head">
          <h2>{p.title}</h2>
          <button className="pg-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {p.bannerUrl && <img className="pg-detail-banner" src={fileUrl(p.bannerUrl)} alt="" />}

        <div className="pg-detail-meta">
          <span className={`pg-status pg-status-${p.status.toLowerCase()}`}>{statusLabel(p.status)}</span>
          <span className="pg-muted">{categoryLabel(p.category)}</span>
          <span className="pg-muted">{fmtDate(p.startDate)} – {fmtDate(p.endDate)}</span>
          <span className="pg-muted">Coordinator: {p.coordinatorName || "Not assigned"}</span>
        </div>
        {p.description && <p className="pg-detail-desc">{p.description}</p>}

        {!isAdmin && p.status !== "COMPLETED" && (
          <div className="pg-join">
            {isJoined ? (
              <span className="pg-muted">✓ You are registered for this programme.</span>
            ) : (
              <button
                className="pg-btn pg-btn-primary"
                disabled={busy}
                onClick={() => run(() => registerForProgram(p.id), "You have joined the programme.")}
              >
                Join this programme
              </button>
            )}
          </div>
        )}

        {isAdmin && (
          <div className="pg-admin-row">
            <label>Status
              <select
                value={p.status}
                disabled={busy}
                onChange={(e) => run(() => updateProgramStatus(p.id, e.target.value), "Status updated.")}
              >
                {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </label>
            <label className="pg-progress-edit">Progress: {progressDraft}%
              <input
                type="range"
                min="0"
                max="100"
                value={progressDraft}
                onChange={(e) => setProgressDraft(Number(e.target.value))}
                onMouseUp={() => progressDraft !== p.progress && run(() => updateProgram(p.id, { ...toPayload(toFormState(p)), progress: progressDraft }), "Progress saved.")}
                onTouchEnd={() => progressDraft !== p.progress && run(() => updateProgram(p.id, { ...toPayload(toFormState(p)), progress: progressDraft }), "Progress saved.")}
              />
            </label>
            <div className="pg-admin-buttons">
              <button className="pg-btn" onClick={onEdit}><Edit size={15} /> Edit</button>
              <button className="pg-btn pg-danger-btn" onClick={onDelete}><Trash2 size={15} /> Delete</button>
            </div>
          </div>
        )}

        {/* Volunteers */}
        <section className="pg-detail-section">
          <h3><Users size={16} /> Volunteers & members ({p.participantCount})</h3>
          {p.participants.length ? (
            <ul className="pg-list">
              {p.participants.map((x) => (
                <li key={x.userId}>
                  <span>{x.name} <span className="pg-muted">· {x.role.toLowerCase()}</span></span>
                  {isAdmin && (
                    <button
                      className="pg-icon-btn pg-danger"
                      disabled={busy}
                      onClick={() => run(() => removeVolunteer(p.id, x.userId), "Removed from programme.")}
                    >
                      <X size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="pg-muted">No one assigned yet.</p>
          )}
          {isAdmin && (
            <div className="pg-inline-form">
              <select value={assignUser} onChange={(e) => setAssignUser(e.target.value)}>
                <option value="">Select member</option>
                {members.filter((m) => !assignedIds.has(m.id)).map((m) => (
                  <option key={m.id} value={m.id}>{m.fullName}</option>
                ))}
              </select>
              <select value={assignRole} onChange={(e) => setAssignRole(e.target.value)}>
                <option value="VOLUNTEER">Volunteer</option>
                <option value="PARTICIPANT">Participant</option>
              </select>
              <button
                className="pg-btn"
                disabled={!assignUser || busy}
                onClick={() =>
                  run(async () => {
                    const updated = await assignVolunteer(p.id, Number(assignUser), assignRole);
                    setAssignUser("");
                    return updated;
                  }, "Member assigned.")
                }
              >
                Assign
              </button>
            </div>
          )}
        </section>

        {/* Budget & expenses */}
        <section className="pg-detail-section">
          <h3><Wallet size={16} /> Budget & expenses</h3>
          <p className="pg-muted">Spent {money(spent)} of {money(budget)} budget</p>
          <div className="pg-bar-track">
            <div className={`pg-bar-fill ${spent > budget && budget > 0 ? "is-over" : ""}`} style={{ width: `${spendPct}%` }} />
          </div>
          {p.expenses.length > 0 && (
            <ul className="pg-list">
              {p.expenses.map((e) => (
                <li key={e.id}>
                  <span>{e.title} <span className="pg-muted">· {fmtDate(e.expenseDate)}</span></span>
                  <span className="pg-row-end">
                    {money(e.amount)}
                    {isAdmin && (
                      <button
                        className="pg-icon-btn pg-danger"
                        disabled={busy}
                        onClick={() => run(() => deleteExpense(p.id, e.id), "Expense removed.")}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {isAdmin && (
            <form
              className="pg-inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  const updated = await addExpense(p.id, {
                    title: expense.title.trim(),
                    amount: Number(expense.amount),
                    expenseDate: expense.expenseDate || null,
                  });
                  setExpense({ title: "", amount: "", expenseDate: "" });
                  return updated;
                }, "Expense added.");
              }}
            >
              <input placeholder="Expense" value={expense.title} onChange={(e) => setExpense({ ...expense, title: e.target.value })} required />
              <input type="number" min="0" placeholder="Amount ₹" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} required />
              <input type="date" value={expense.expenseDate} onChange={(e) => setExpense({ ...expense, expenseDate: e.target.value })} />
              <button className="pg-btn" disabled={busy}><Plus size={14} /> Add</button>
            </form>
          )}
        </section>

        {/* Feedback & reviews */}
        <section className="pg-detail-section">
          <h3><Star size={16} /> Feedback & reviews</h3>
          {feedback.count > 0 ? (
            <p className="pg-muted">
              Average {feedback.average.toFixed(1)} / 5 from {feedback.count} review{feedback.count > 1 ? "s" : ""}
            </p>
          ) : (
            <p className="pg-muted">No reviews yet.</p>
          )}
          {feedback.items.length > 0 && (
            <ul className="pg-list">
              {feedback.items.map((f) => (
                <li key={f.id}>
                  <span className="pg-review-body">
                    <strong>{f.name}</strong> <span className="pg-stars">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span>
                    {f.comment && <span className="pg-review">{f.comment}</span>}
                  </span>
                  {isAdmin && (
                    <button className="pg-icon-btn pg-danger" onClick={() => removeReview(f.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!isAdmin && canReview && (
            <form className="pg-inline-form" onSubmit={submitReview}>
              <select value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>
                ))}
              </select>
              <input
                placeholder="Share your experience (optional)"
                maxLength={1000}
                value={review.comment}
                onChange={(e) => setReview({ ...review, comment: e.target.value })}
              />
              <button className="pg-btn" disabled={busy}>Submit review</button>
            </form>
          )}
          {!isAdmin && !isJoined && p.status !== "PLANNING" && (
            <p className="pg-muted">Join this programme to share feedback.</p>
          )}
        </section>

        {/* Documents & photos */}
        <section className="pg-detail-section">
          <h3><ImageIcon size={16} /> Documents, photos & videos</h3>
          {p.media.length ? (
            <div className="pg-media-grid">
              {p.media.map((m) => (
                <div className="pg-media" key={m.id}>
                  {m.mediaType === "PHOTO" && (
                    <a href={fileUrl(m.fileUrl)} target="_blank" rel="noreferrer"><img src={fileUrl(m.fileUrl)} alt={m.originalName || ""} /></a>
                  )}
                  {m.mediaType === "VIDEO" && <video src={fileUrl(m.fileUrl)} controls preload="metadata" />}
                  {m.mediaType === "DOCUMENT" && (
                    <a href={fileUrl(m.fileUrl)} target="_blank" rel="noreferrer" className="pg-doc"><FileText size={18} /> {m.originalName || "Document"}</a>
                  )}
                  {isAdmin && (
                    <button className="pg-icon-btn pg-danger pg-media-del" disabled={busy} onClick={() => run(() => deleteMedia(p.id, m.id), "File removed.")}>
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="pg-muted">No files uploaded yet.</p>
          )}
          {isAdmin && (
            <div className="pg-inline-form">
              <select value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
                <option value="PHOTO">Photo</option>
                <option value="VIDEO">Video</option>
                <option value="DOCUMENT">Document</option>
              </select>
              <input
                type="file"
                accept={
                  mediaType === "PHOTO" ? "image/*" : mediaType === "VIDEO" ? "video/*" : ".pdf,.doc,.docx,.xls,.xlsx,.txt"
                }
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
              />
              <button
                className="pg-btn"
                disabled={!mediaFile || busy}
                onClick={() =>
                  run(async () => {
                    const updated = await uploadMedia(p.id, mediaFile, mediaType);
                    setMediaFile(null);
                    return updated;
                  }, "File uploaded.")
                }
              >
                <Upload size={14} /> Upload
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
