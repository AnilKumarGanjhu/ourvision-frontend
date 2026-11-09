import React, { useEffect, useState } from "react";
import { Bell, Megaphone } from "lucide-react";
import { useToast } from "../page/ToastContext";
import {
  broadcastNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../notificationApi";
import { listPrograms } from "../programApi";
import "./NotificationsCenter.css";

const CATEGORY_LABEL = { PROGRAM: "Programme", BROADCAST: "Announcement", GENERAL: "General" };

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

const emptyForm = { title: "", message: "", target: "ALL", programId: "" };

export default function NotificationsCenter({ isAdmin, onNavigate, onChanged }) {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    listNotifications()
      .then((data) => setItems(data || []))
      .catch((err) => showToast(err.message || "Could not load notifications.", "error"))
      .finally(() => setLoading(false));
    if (isAdmin) listPrograms().then(setPrograms).catch(() => {});
  }, [isAdmin]);

  const openItem = async (n) => {
    if (n.read) return;
    try {
      await markNotificationRead(n.id);
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      onChanged?.();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((list) => list.map((x) => ({ ...x, read: true })));
      onChanged?.();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      showToast("Title and message are required.", "error");
      return;
    }
    if (form.target === "PROGRAM" && !form.programId) {
      showToast("Select a programme.", "error");
      return;
    }
    setSending(true);
    try {
      const res = await broadcastNotification({
        title: form.title.trim(),
        message: form.message.trim(),
        programId: form.target === "PROGRAM" ? Number(form.programId) : null,
      });
      showToast(`Sent to ${res?.sent ?? 0} people.`, "success");
      setForm(emptyForm);
    } catch (err) {
      showToast(err.message || "Could not send.", "error");
    } finally {
      setSending(false);
    }
  };

  const unread = items.filter((x) => !x.read).length;
  const visible = onlyUnread ? items.filter((x) => !x.read) : items;

  return (
    <div className="nc-root">
      <div className="page-heading">
        <div>
          <div className="eyebrow">OUR VISION WORKSPACE</div>
          <h1>Notifications</h1>
          <p>Programme updates and announcements from the community team.</p>
        </div>
      </div>

      {isAdmin && (
        <section className="panel">
          <h2><Megaphone size={16} /> Send announcement</h2>
          <form className="nc-form" onSubmit={send}>
            <label>Audience
              <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
                <option value="ALL">All active members</option>
                <option value="PROGRAM">Participants of a programme</option>
              </select>
            </label>
            {form.target === "PROGRAM" && (
              <label>Programme
                <select value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })}>
                  <option value="">Select programme</option>
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </label>
            )}
            <label className="nc-span">Title
              <input maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="nc-span">Message
              <textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </label>
            <div className="nc-span nc-actions">
              <button className="nc-btn nc-btn-primary" disabled={sending}>
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="nc-head">
          <div className="nc-actions">
            <button className={`nc-chip ${!onlyUnread ? "is-active" : ""}`} onClick={() => setOnlyUnread(false)}>
              All ({items.length})
            </button>
            <button className={`nc-chip ${onlyUnread ? "is-active" : ""}`} onClick={() => setOnlyUnread(true)}>
              Unread ({unread})
            </button>
          </div>
          {unread > 0 && <button className="nc-btn" onClick={markAll}>Mark all as read</button>}
        </div>

        {loading ? (
          <p className="nc-empty">Loading…</p>
        ) : !visible.length ? (
          <div className="nc-empty">
            <Bell size={24} />
            <p>{onlyUnread ? "No unread notifications." : "No notifications yet."}</p>
          </div>
        ) : (
          <ul className="nc-list">
            {visible.map((n) => (
              <li key={n.id} className={`nc-item ${n.read ? "" : "is-unread"}`} onClick={() => openItem(n)}>
                <span className="nc-dot" />
                <div className="nc-body">
                  <span className="nc-title">{n.title}</span>
                  {n.message && <p className="nc-msg">{n.message}</p>}
                  <div className="nc-meta">
                    <span className="nc-tag">{CATEGORY_LABEL[n.category] || "General"}</span>
                    <span>{fmt(n.createdAt)}</span>
                    {n.category === "PROGRAM" && onNavigate && (
                      <button
                        className="nc-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate("Our Programs");
                        }}
                      >
                        Open programmes →
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
