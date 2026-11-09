import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { api } from "../api";
import "./MemberDetailPage.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?";

// skills are stored as a JSON array string by the backend; be tolerant of plain text too.
function parseSkills(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [String(value)];
  } catch {
    return String(raw).split(",").map((s) => s.trim()).filter(Boolean);
  }
}

export default function MemberDetailPage({ member, onBack }) {
  const [profile, setProfile] = useState(member);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setProfile(member);
    setPhotoFailed(false);
    setLoading(true);
    setError("");

    api(`/users/${encodeURIComponent(member.id)}`)
      .then((data) => {
        if (active && data) setProfile({ ...member, ...data });
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load member details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [member]);

  const p = profile;
  const photo = p.hasMemberPhoto && !photoFailed ? `${API_BASE}/api/users/${p.id}/information/photo` : null;
  const role = p.role?.replace("ROLE_", "");
  const skills = parseSkills(p.skills);

  const fields = [
    ["Email", p.email],
    ["Phone", p.phone],
    ["Date of birth", p.dateOfBirth],
    ["Gender", p.gender],
    ["Blood group", p.bloodGroup],
    ["Designation", p.designation],
    ["Status", p.status || "ACTIVE"],
  ];

  return (
    <div className="member-detail-page">
      <button className="member-detail-back" onClick={onBack}>
        <ArrowLeft size={16} /> Back to overview
      </button>

      <section className="member-detail-hero">
        {photo ? (
          <img src={photo} alt={p.fullName} onError={() => setPhotoFailed(true)} />
        ) : (
          <div className="member-detail-initials">{initials(p.fullName)}</div>
        )}
        <div>
          <span className="eyebrow">MEMBER PROFILE</span>
          <h1>{p.fullName}</h1>
          {role && <span className="role-pill">{role}</span>}
        </div>
      </section>

      {loading && <p className="muted">Loading details…</p>}
      {error && <p className="member-detail-error" role="alert">{error}</p>}

      <div className="member-profile-grid">
        {fields.map(([label, value]) => (
          <div className="member-profile-field" key={label}>
            <small>{label}</small>
            <br />
            <b>{value || "—"}</b>
          </div>
        ))}
        <div className="member-profile-field profile-full-width">
          <small>Short bio</small>
          <br />
          <b>{p.shortBio || "—"}</b>
        </div>
        <div className="member-profile-field profile-full-width">
          <small>Description</small>
          <br />
          <b>{p.description || "—"}</b>
        </div>
        <div className="member-profile-field profile-full-width">
          <small>Skills</small>
          <br />
          <b>{skills.length ? skills.join(", ") : "—"}</b>
        </div>
      </div>
    </div>
  );
}
