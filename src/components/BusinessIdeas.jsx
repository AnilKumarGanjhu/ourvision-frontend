import React, { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Calendar,
  AlertCircle,
  Sprout,
  Briefcase,
  Laptop,
  Palette,
  BookOpen,
  Zap,
} from "lucide-react";
import "./BusinessIdeas.css";
import { api } from "../api";

const initialForm = { title: "", description: "" };

// ✅ 1. Added isAdmin prop (default false for public)
export default function BusinessIdeas({ isAdmin = false }) {
  const [ideas, setIdeas] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [previewIdea, setPreviewIdea] = useState(null);

  const loadIdeas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/business-ideas");
      setIdeas(data);
    } catch (err) {
      setError(err.message || "Ideas load nahi ho paaye.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function openAddForm() {
    resetForm();
    setShowFormModal(true);
  }

  function startEdit(idea) {
    setEditingId(idea.id);
    setForm({ title: idea.title || "", description: idea.description || "" });
    setMessage("");
    setError("");
    setShowFormModal(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const title = form.title.trim();
    if (!title) {
      setError("Business idea ka title required hai.");
      return;
    }

    setSaving(true);
    try {
      const isEditing = editingId !== null;
      await api(
        isEditing ? `/business-ideas/${editingId}` : "/business-ideas",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify({
            title,
            description: form.description.trim(),
          }),
        }
      );

      resetForm();
      setShowFormModal(false);
      setMessage(
        isEditing
          ? "Business idea successfully updated."
          : "Business idea successfully saved."
      );

      await loadIdeas();
    } catch (err) {
      setError(err.message || "Idea save nahi ho saka.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(idea, e) {
    e.stopPropagation();
    if (!isAdmin) return; // ✅ Safety check
    
    const confirmed = window.confirm(
      `"${idea.title}" ko permanently delete karna hai?`
    );
    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api(`/business-ideas/${idea.id}`, { method: "DELETE" });
      if (editingId === idea.id) resetForm();
      setMessage("Business idea successfully deleted.");
      await loadIdeas();
    } catch (err) {
      setError(err.message || "Idea delete nahi ho saka.");
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <section className="business-ideas">
      {/* ✅ HEADER: Add & Refresh buttons only for Admin */}
      <header className="business-ideas__header">
        <div>
          <h2>Business Ideas</h2>
          <p>Apne business ideas ko manage karein.</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {/* ✅ Sirf Admin ko Add button dikhega */}
          {isAdmin && (
            <button type="button" className="primary-btn" onClick={openAddForm}>
              <Plus size={16} /> Add Business Idea
            </button>
          )}

          <button
            type="button"
            className="secondary-btn"
            onClick={loadIdeas}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </header>

      {error && (
        <div className="business-ideas__alert business-ideas__alert--error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {message && (
        <div className="business-ideas__alert business-ideas__alert--success">
          {message}
        </div>
      )}

      <div className="business-ideas__list-header">
        <h3>Saved Ideas</h3>
        <span>{ideas.length} ideas</span>
      </div>

      {loading ? (
        <p>Ideas load ho rahe hain...</p>
      ) : ideas.length === 0 ? (
        <p>Abhi koi idea saved nahi hai.</p>
      ) : (
        <div className="business-ideas__grid">
          {ideas.map((idea) => {
            const titleLower = (idea.title || "").toLowerCase();
            let Icon = Briefcase;
            let badgeText = "General";
            let badgeColor = "blue";

            if (
              titleLower.includes("farm") ||
              titleLower.includes("organic") ||
              titleLower.includes("grow")
            ) {
              Icon = Sprout;
              badgeText = "Agriculture";
              badgeColor = "green";
            } else if (
              titleLower.includes("market") ||
              titleLower.includes("digital") ||
              titleLower.includes("web")
            ) {
              Icon = Laptop;
              badgeText = "Digital";
              badgeColor = "blue";
            } else if (
              titleLower.includes("craft") ||
              titleLower.includes("handmade") ||
              titleLower.includes("art")
            ) {
              Icon = Palette;
              badgeText = "Creative";
              badgeColor = "orange";
            } else if (
              titleLower.includes("food") ||
              titleLower.includes("tiffin") ||
              titleLower.includes("meal")
            ) {
              Icon = Briefcase;
              badgeText = "Food";
              badgeColor = "red";
            } else if (
              titleLower.includes("teach") ||
              titleLower.includes("learn") ||
              titleLower.includes("education")
            ) {
              Icon = BookOpen;
              badgeText = "Education";
              badgeColor = "purple";
            } else if (
              titleLower.includes("solar") ||
              titleLower.includes("energy") ||
              titleLower.includes("power")
            ) {
              Icon = Zap;
              badgeText = "Energy";
              badgeColor = "yellow";
            }

            return (
              <article
                className="business-idea-card"
                key={idea.id}
                onClick={() => setPreviewIdea(idea)}
                title="Click to preview"
              >
                <div className="card-header">
                  <div className={`card-icon ${badgeColor}`}>
                    <Icon size={20} />
                  </div>
                  <div className="card-title-group">
                    <h4 className="card-title">{idea.title}</h4>
                    <span className={`category-badge ${badgeColor}`}>
                      {badgeText}
                    </span>
                  </div>
                </div>

                <div className="card-body">
                  <p>{idea.description || "No description provided."}</p>
                </div>

                <div className="card-footer">
                  <span className="card-date">
                    <Calendar size={13} /> {formatDate(idea.createdAt)}
                  </span>
                  
                  {/* ✅ Edit & Delete Buttons only for Admin */}
                  {isAdmin && (
                    <div className="card-actions">
                      <button
                        type="button"
                        className="action-icon edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(idea);
                        }}
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        className="action-icon delete"
                        onClick={(e) => handleDelete(idea, e)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ✅ ADD / EDIT FORM MODAL (Only Admin can open this) */}
      {isAdmin && showFormModal && (
        <div
          className="modal-backdrop"
          onClick={(e) =>
            e.target === e.currentTarget && setShowFormModal(false)
          }
        >
          <form className="modal" onSubmit={handleSubmit}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">OUR VISION</span>
                <h2>{editingId !== null ? "Edit Idea" : "Add New Idea"}</h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowFormModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <label>Title *</label>
            <input
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              maxLength={200}
              placeholder="e.g. Online Grocery Store"
              required
            />

            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              placeholder="Business idea ke baare mein likhein..."
            />

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowFormModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? "Saving..." : "Save Idea"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ✅ PREVIEW MODAL (Everyone can see, but Edit/Delete only for Admin) */}
      {previewIdea && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setPreviewIdea(null)}
        >
          <div className="modal" style={{ maxWidth: "600px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
                gap: "15px",
              }}
            >
              <div style={{ flex: 1 }}>
                <span className="eyebrow">BUSINESS IDEA PREVIEW</span>
                <h2 style={{ margin: "4px 0 0" }}>{previewIdea.title}</h2>
              </div>
              
              {/* ✅ Edit & Delete only for Admin */}
              {isAdmin && (
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button
                    className="secondary-btn"
                    onClick={() => {
                      setPreviewIdea(null);
                      startEdit(previewIdea);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Edit size={14} /> Edit
                  </button>
                  
                  <button
                    className="secondary-btn"
                    onClick={(e) => {
                      setPreviewIdea(null);
                      handleDelete(previewIdea, e);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#c24f55",
                      borderColor: "#f7d5d1",
                      background: "#fff0ee",
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>

            <div
              style={{
                background: "var(--background)",
                padding: "16px",
                borderRadius: "10px",
                marginBottom: "20px",
                border: "1px solid var(--border)",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              <p
                style={{
                  margin: 0,
                  lineHeight: 1.6,
                  color: "var(--font-color)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {previewIdea.description || "No description provided."}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                fontSize: "12px",
                color: "var(--muted-text)",
              }}
            >
              <span>
                <Calendar
                  size={14}
                  style={{ display: "inline", marginRight: "6px" }}
                />{" "}
                Created: {formatDate(previewIdea.createdAt)}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}