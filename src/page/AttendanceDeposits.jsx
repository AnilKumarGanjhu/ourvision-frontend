import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import {
  CalendarCheck,
  Wallet,
  Users,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Save,
  Search,
} from "lucide-react";
import "./AttendanceDeposits.css";

const monthNow = () => new Date().toISOString().slice(0, 7);
const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
const dateOnly = (value) => (value ? String(value).slice(0, 10) : "—");
const unwrapList = (data) =>
  Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.data)
        ? data.data
        : [];
const errorText = (error) =>
  error?.message || "Something went wrong. Please try again.";

function Metric({ label, value, hint, icon: Icon }) {
  return (
    <div className="ad-metric">
      <div className="ad-metric-top">
        <span>{label}</span>
        <span className="ad-metric-icon">
          <Icon size={18} />
        </span>
      </div>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}
function Progress({ value }) {
  const percent = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="ad-progress">
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}
function Status({ value }) {
  const status = String(value || "PENDING").toUpperCase();
  return (
    <span className={`ad-status ad-status-${status.toLowerCase()}`}>
      {status}
    </span>
  );
}

export default function AttendanceDeposits({ isAdmin, setNotice }) {
  const [tab, setTab] = useState(isAdmin ? "attendance" : "my-dashboard");
  const [month, setMonth] = useState(monthNow);
  const [members, setMembers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [meetingId, setMeetingId] = useState("");
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [depositRows, setDepositRows] = useState([]);
  const [depositSummary, setDepositSummary] = useState(null);
  const [settings, setSettings] = useState([]);
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(`${month}-01`);
  const [payment, setPayment] = useState({
    userId: "",
    amount: "",
    paymentDate: new Date().toISOString().slice(0, 10),
  });
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [memberDashboard, setMemberDashboard] = useState(null);
  const [memberAttendance, setMemberAttendance] = useState([]);
  const [memberDeposits, setMemberDeposits] = useState([]);

  const loadAdminBase = useCallback(async () => {
    const [memberResult, meetingResult, settingResult] =
      await Promise.allSettled([
        api("/users"),
        api("/meetings"),
        api("/deposits/settings"),
      ]);
    if (memberResult.status === "fulfilled")
      setMembers(
        unwrapList(memberResult.value).filter(
          (m) => String(m.status || "ACTIVE").toUpperCase() === "ACTIVE",
        ),
      );
    if (meetingResult.status === "fulfilled")
      setMeetings(
        unwrapList(meetingResult.value).sort((a, b) =>
          String(b.meetingDate || "").localeCompare(
            String(a.meetingDate || ""),
          ),
        ),
      );
    if (settingResult.status === "fulfilled") {
      const list = unwrapList(settingResult.value);
      setSettings(list);
      const current = list.find(
        (s) => String(s.effectiveFrom || "") <= `${month}-01`,
      );
      if (current) setMonthlyAmount(String(current.monthlyAmount ?? ""));
    }
    const failed = [memberResult, meetingResult, settingResult].filter(
      (r) => r.status === "rejected",
    );
    if (failed.length) throw failed[0].reason;
  }, [month]);

  const loadAttendance = useCallback(async () => {
    const summary = await api(
      `/attendance/dashboard?month=${encodeURIComponent(month)}`,
    );
    setAttendanceSummary(summary);
    if (meetingId) {
      const rows = unwrapList(
        await api(`/attendance/meeting/${encodeURIComponent(meetingId)}`),
      );
      const byUser = new Map(rows.map((r) => [String(r.userId), r.status]));
      setAttendanceRows(
        members.map((m) => ({
          userId: m.id,
          userName: m.fullName || m.name || m.email || `Member ${m.id}`,
          status: byUser.get(String(m.id)) || "",
        })),
      );
    } else setAttendanceRows([]);
  }, [month, meetingId, members]);

  const loadDeposits = useCallback(async () => {
    const [summaryResult, rowsResult] = await Promise.allSettled([
      api(`/deposits/dashboard?month=${encodeURIComponent(month)}`),
      api(`/deposits?month=${encodeURIComponent(month)}`),
    ]);
    if (summaryResult.status === "fulfilled") {
      setDepositSummary(summaryResult.value);
      const rows = unwrapList(summaryResult.value?.members).length
        ? unwrapList(summaryResult.value.members)
        : rowsResult.status === "fulfilled"
          ? unwrapList(rowsResult.value)
          : [];
      setDepositRows(rows);
    } else if (rowsResult.status === "fulfilled")
      setDepositRows(unwrapList(rowsResult.value));
    else throw summaryResult.reason;
    if (summaryResult.status === "rejected" && rowsResult.status === "rejected")
      throw summaryResult.reason;
  }, [month]);

  const loadMemberDashboard = useCallback(async () => {
    const data = await api(`/dashboard/me?month=${encodeURIComponent(month)}`);
    setMemberDashboard(data);
    setMemberAttendance(unwrapList(data?.attendanceHistory));
    setMemberDeposits(unwrapList(data?.depositHistory));
  }, [month]);

  const reload = useCallback(async () => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (isAdmin) {
        await loadAdminBase();
        if (tab === "attendance") await loadAttendance();
        if (tab === "deposits") await loadDeposits();
      } else await loadMemberDashboard();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }, [
    isAdmin,
    tab,
    loadAdminBase,
    loadAttendance,
    loadDeposits,
    loadMemberDashboard,
  ]);

  useEffect(() => {
    reload();
  }, [reload]);
  useEffect(() => {
    setEffectiveFrom(`${month}-01`);
  }, [month]);

  const selectedMeeting = meetings.find(
    (m) => String(m.id) === String(meetingId),
  );
  const filteredDeposits = useMemo(
    () =>
      depositRows.filter((r) =>
        `${r.userName || ""} ${r.status || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [depositRows, search],
  );
  const filteredAttendance = useMemo(
    () =>
      attendanceRows.filter((r) =>
        `${r.userName || ""} ${r.status || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [attendanceRows, search],
  );

  async function submitAttendance() {
    if (!meetingId) {
      setError("Please select a meeting first.");
      return;
    }
    const entries = attendanceRows
      .filter((r) => r.status)
      .map((r) => ({ userId: Number(r.userId), status: r.status }));
    if (!entries.length) {
      setError("Mark at least one member before saving.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api("/attendance/bulk", {
        method: "POST",
        body: JSON.stringify({ meetingId: Number(meetingId), entries }),
      });
      setSuccess(`Attendance saved for ${entries.length} member(s).`);
      await loadAttendance();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function submitSetting(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api("/deposits/settings", {
        method: "PUT",
        body: JSON.stringify({
          monthlyAmount: Number(monthlyAmount),
          effectiveFrom,
        }),
      });
      setSuccess("Monthly deposit amount saved.");
      await loadAdminBase();
      await loadDeposits();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function submitPayment(event) {
    event.preventDefault();
    if (!payment.userId || Number(payment.amount) <= 0) {
      setError("Select a member and enter a valid payment amount.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api("/deposits/payment", {
        method: "POST",
        body: JSON.stringify({
          userId: Number(payment.userId),
          month: `${month}-01`,
          amount: Number(payment.amount),
          paymentDate: payment.paymentDate || null,
        }),
      });
      setSuccess("Payment recorded successfully.");
      setPayment((p) => ({ ...p, amount: "" }));
      await loadDeposits();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const attendancePercent = Number(attendanceSummary?.percentage ?? 0);
  const depositPercent = Number(depositSummary?.percentage ?? 0);
  const ownAttendance = memberDashboard?.attendance || {};
  const ownDeposit = memberDashboard?.deposit || {};

  return (
    <section className="attendance-deposits-page">
      <div className="ad-page-heading">
        <div>
          <span className="ad-eyebrow">OUR VISION · MEMBER SERVICES</span>
          <h1>
            {isAdmin
              ? "Attendance & Monthly Deposits"
              : "My Attendance & Deposits"}
          </h1>
          <p>
            {isAdmin
              ? "Manage meeting attendance, monthly contributions and collection progress."
              : "View your attendance record and monthly deposit status."}
          </p>
        </div>
        <button
          className="ad-button ad-button-secondary"
          onClick={reload}
          disabled={busy}
        >
          <RefreshCw size={16} className={busy ? "ad-spin" : ""} /> Refresh
        </button>
      </div>
      <div className="ad-toolbar">
        <label>
          Month{" "}
          <input
            type="month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setSearch("");
            }}
          />
        </label>
        {isAdmin && (
          <div className="ad-tabs">
            <button
              className={tab === "attendance" ? "active" : ""}
              onClick={() => {
                setTab("attendance");
                setError("");
              }}
            >
              {" "}
              <CalendarCheck size={16} /> Attendance
            </button>
            <button
              className={tab === "deposits" ? "active" : ""}
              onClick={() => {
                setTab("deposits");
                setError("");
              }}
            >
              <Wallet size={16} /> Monthly Deposits
            </button>
          </div>
        )}
      </div>
      {error && (
        <div className="ad-alert ad-alert-error">
          <AlertCircle size={17} />
          {error}
        </div>
      )}
      {success && (
        <div className="ad-alert ad-alert-success">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      {isAdmin && tab === "attendance" && (
        <>
          <div className="ad-metrics-grid">
            <Metric
              label="Attendance rate"
              value={`${attendancePercent.toFixed(1)}%`}
              hint={`${attendanceSummary?.presentCount ?? 0} present records`}
              icon={CalendarCheck}
            />
            <Metric
              label="Applicable attendance"
              value={attendanceSummary?.applicableCount ?? 0}
              hint={`For ${month}`}
              icon={Users}
            />
            <Metric
              label="Active members"
              value={members.length}
              hint="Members included in the list"
              icon={Users}
            />
          </div>
          <div className="ad-panel">
            <div className="ad-panel-heading">
              <div>
                <h2>Mark meeting attendance</h2>
                <p>Select a meeting, set each member's status and save.</p>
              </div>
            </div>
            <div className="ad-form-grid">
              <label>
                Meeting
                <select
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                >
                  <option value="">Select a meeting</option>
                  {meetings.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title || `Meeting ${m.id}`} · {dateOnly(m.meetingDate)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ad-search-label">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members..."
                />
              </label>
              <div className="ad-form-action">
                <button
                  className="ad-button"
                  onClick={submitAttendance}
                  disabled={busy || !meetingId}
                >
                  <Save size={16} /> Save attendance
                </button>
              </div>
            </div>
            {selectedMeeting && (
              <p className="ad-context-note">
                Selected: <strong>{selectedMeeting.title}</strong> ·{" "}
                {dateOnly(selectedMeeting.meetingDate)}
                {selectedMeeting.venue ? ` · ${selectedMeeting.venue}` : ""}
              </p>
            )}
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Attendance status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((r) => (
                    <tr key={r.userId}>
                      <td>
                        <strong>{r.userName}</strong>
                      </td>
                      <td>
                        <select
                          className="ad-status-select"
                          value={r.status}
                          onChange={(e) =>
                            setAttendanceRows((old) =>
                              old.map((x) =>
                                String(x.userId) === String(r.userId)
                                  ? { ...x, status: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        >
                          <option value="">Not marked</option>
                          <option value="PRESENT">Present</option>
                          <option value="ABSENT">Absent</option>
                          <option value="EXCUSED">Excused</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {filteredAttendance.length === 0 && (
                    <tr>
                      <td colSpan="2" className="ad-empty">
                        {meetingId
                          ? "No members match your search."
                          : "Select a meeting to load members and existing attendance."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {isAdmin && tab === "deposits" && (
        <>
          <div className="ad-metrics-grid">
            <Metric
              label="Expected total"
              value={money(depositSummary?.expectedAmount)}
              hint={`For ${month}`}
              icon={Wallet}
            />
            <Metric
              label="Collected"
              value={money(depositSummary?.collectedAmount)}
              hint={`${depositPercent.toFixed(1)}% collected`}
              icon={CheckCircle2}
            />
            <Metric
              label="Pending amount"
              value={money(depositSummary?.pendingAmount)}
              hint={`${depositSummary?.memberCount ?? depositRows.length} members`}
              icon={AlertCircle}
            />
          </div>
          <div className="ad-panel">
            <div className="ad-panel-heading">
              <div>
                <h2>Monthly deposit settings</h2>
                <p>Set the fixed amount and the date from which it applies.</p>
              </div>
            </div>
            <form className="ad-form-grid" onSubmit={submitSetting}>
              <label>
                Monthly amount (₹)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  placeholder="e.g. 1000"
                />
              </label>
              <label>
                Effective from
                <input
                  type="date"
                  required
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                />
              </label>
              <div className="ad-form-action">
                <button className="ad-button" disabled={busy}>
                  <Save size={16} /> Save amount
                </button>
              </div>
            </form>
            {settings.length > 0 && (
              <div className="ad-settings-history">
                <strong>Previous settings</strong>
                {settings.slice(0, 4).map((s) => (
                  <span key={s.id}>
                    {money(s.monthlyAmount)} from {dateOnly(s.effectiveFrom)}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="ad-panel">
            <div className="ad-panel-heading">
              <div>
                <h2>Record a member payment</h2>
                <p>
                  Partial payments are supported; the total cannot exceed the
                  monthly expected amount.
                </p>
              </div>
            </div>
            <form className="ad-form-grid" onSubmit={submitPayment}>
              <label>
                Member
                <select
                  required
                  value={payment.userId}
                  onChange={(e) =>
                    setPayment((p) => ({ ...p, userId: e.target.value }))
                  }
                >
                  <option value="">Select member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName || m.name || m.email}{" "}
                      {m.email ? `(${m.email})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Amount (₹)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={payment.amount}
                  onChange={(e) =>
                    setPayment((p) => ({ ...p, amount: e.target.value }))
                  }
                  placeholder="Enter amount"
                />
              </label>
              <label>
                Payment date
                <input
                  type="date"
                  value={payment.paymentDate}
                  onChange={(e) =>
                    setPayment((p) => ({ ...p, paymentDate: e.target.value }))
                  }
                />
              </label>
              <div className="ad-form-action">
                <button className="ad-button" disabled={busy}>
                  <Wallet size={16} /> Record payment
                </button>
              </div>
            </form>
          </div>
          <div className="ad-panel">
            <div className="ad-panel-heading">
              <div>
                <h2>Member-wise deposits</h2>
                <p>
                  Expected, paid and pending amounts for the selected month.
                </p>
              </div>
              <label className="ad-search-label">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members..."
                />
              </label>
            </div>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Expected</th>
                    <th>Paid</th>
                    <th>Pending</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Last payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeposits.map((r) => (
                    <tr key={`${r.userId}-${r.month}`}>
                      <td>
                        <strong>{r.userName || `Member ${r.userId}`}</strong>
                      </td>
                      <td>{money(r.expectedAmount)}</td>
                      <td>{money(r.paidAmount)}</td>
                      <td>{money(r.pendingAmount)}</td>
                      <td className="ad-progress-cell">
                        <Progress value={r.percentage} />
                        <small>{Number(r.percentage || 0).toFixed(1)}%</small>
                      </td>
                      <td>
                        <Status value={r.status} />
                      </td>
                      <td>{dateOnly(r.lastPaymentDate)}</td>
                    </tr>
                  ))}
                  {filteredDeposits.length === 0 && (
                    <tr>
                      <td colSpan="7" className="ad-empty">
                        No deposit rows available. Check that a monthly amount
                        is configured for this month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!isAdmin && (
        <>
          <div className="ad-metrics-grid">
            <Metric
              label="Attendance rate"
              value={`${Number(ownAttendance.percentage || 0).toFixed(1)}%`}
              hint={`${ownAttendance.presentMeetings ?? 0} present / ${ownAttendance.applicableMeetings ?? 0} applicable`}
              icon={CalendarCheck}
            />
            <Metric
              label="Expected deposit"
              value={money(ownDeposit.expectedAmount)}
              hint={`For ${month}`}
              icon={Wallet}
            />
            <Metric
              label="Paid this month"
              value={money(ownDeposit.paidAmount)}
              hint={`${Number(ownDeposit.percentage || 0).toFixed(1)}% completed`}
              icon={CheckCircle2}
            />
            <Metric
              label="Pending deposit"
              value={money(ownDeposit.pendingAmount)}
              hint={<Status value={ownDeposit.status} />}
              icon={AlertCircle}
            />
          </div>
          <div className="ad-panel">
            <div className="ad-panel-heading">
              <div>
                <h2>My attendance history</h2>
                <p>
                  Your recorded meeting attendance. Contact an administrator if
                  something looks incorrect.
                </p>
              </div>
            </div>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Meeting</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {memberAttendance
                    .filter((r) =>
                      String(r.meetingDate || "").startsWith(month),
                    )
                    .map((r) => (
                      <tr key={r.id || `${r.meetingId}-${r.meetingDate}`}>
                        <td>
                          <strong>
                            {r.meetingTitle || `Meeting ${r.meetingId}`}
                          </strong>
                        </td>
                        <td>{dateOnly(r.meetingDate)}</td>
                        <td>
                          <Status value={r.status} />
                        </td>
                      </tr>
                    ))}
                  {memberAttendance.filter((r) =>
                    String(r.meetingDate || "").startsWith(month),
                  ).length === 0 && (
                    <tr>
                      <td colSpan="3" className="ad-empty">
                        No attendance records found for this month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="ad-panel">
            <div className="ad-panel-heading">
              <div>
                <h2>My deposit history</h2>
                <p>Review your expected, paid and pending monthly deposits.</p>
              </div>
            </div>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Expected</th>
                    <th>Paid</th>
                    <th>Pending</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Last payment</th>
                  </tr>
                </thead>
                <tbody>
                  {memberDeposits.map((r) => (
                    <tr key={`${r.id || r.month}`}>
                      <td>{String(r.month || "").slice(0, 7)}</td>
                      <td>{money(r.expectedAmount)}</td>
                      <td>{money(r.paidAmount)}</td>
                      <td>{money(r.pendingAmount)}</td>
                      <td className="ad-progress-cell">
                        <Progress value={r.percentage} />
                        <small>{Number(r.percentage || 0).toFixed(1)}%</small>
                      </td>
                      <td>
                        <Status value={r.status} />
                      </td>
                      <td>{dateOnly(r.lastPaymentDate)}</td>
                    </tr>
                  ))}
                  {memberDeposits.length === 0 && (
                    <tr>
                      <td colSpan="7" className="ad-empty">
                        No deposit history is available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
