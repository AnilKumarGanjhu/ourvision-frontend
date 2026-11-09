import React, { useEffect, useMemo, useRef, useState } from "react";
import { api, getMemberInformationPhoto } from "../api";
import {
  Search,
  UserRound,
  Save,
  RefreshCw,
  CalendarDays,
  Mail,
  Phone,
  MapPin,
  BriefcaseBusiness,
  HeartPulse,
  ShieldCheck,
  Languages,
  UserCheck,
  Camera,
  Upload,
} from "lucide-react";
import "./MemberInformation.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const emptyInformation = {
  loanStatus: "CLEAR",
  loanDuration: "",
  totalLoansTaken: 0,
  joiningDate: "",
  fatherName: "",
  motherName: "",
  maritalStatus: "",
  nationality: "",
  languagesKnown: "",
  emergencyContactPerson: "",
  nomineeName: "",
  nomineeRelation: "",
};

function displayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function getAge(dateOfBirth) {
  if (!dateOfBirth) return "Not provided";

  const birth = new Date(`${dateOfBirth}T00:00:00`);

  if (Number.isNaN(birth.getTime())) {
    return "Not provided";
  }

  const now = new Date();

  let age = now.getFullYear() - birth.getFullYear();

  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() &&
      now.getDate() < birth.getDate());

  if (beforeBirthday) {
    age -= 1;
  }

  return age >= 0 ? `${age} years` : "Not provided";
}

function skillsList(skills) {
  if (!skills) return [];

  if (Array.isArray(skills)) {
    return skills;
  }

  try {
    const parsed = JSON.parse(skills);

    return Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch {
    return String(skills)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

export default function MemberInformation({ setNotice }) {
  const [members, setMembers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyInformation);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Member photo states
  const photoInputRef = useRef(null);
  const [memberPhoto, setMemberPhoto] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  // ================= LOAD MEMBERS =================

  async function loadMembers() {
    setLoading(true);
    setError("");

    try {
      const rows = await api("/users");

      const list = Array.isArray(rows) ? rows : [];

      setMembers(list);

      if (!selectedId && list.length) {
        setSelectedId(String(list[0].id));
      }

      if (
        selectedId &&
        !list.some((m) => String(m.id) === String(selectedId))
      ) {
        setSelectedId(list.length ? String(list[0].id) : "");
      }
    } catch (err) {
      setError(err.message || "Members could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  // ================= LOAD SELECTED MEMBER =================

  useEffect(() => {
    let active = true;

    if (!selectedId) {
      setProfile(null);
      setForm(emptyInformation);

      return () => {
        active = false;
      };
    }

    setLoading(true);

    (async () => {
      try {
        const userData = await api(
          `/users/${encodeURIComponent(selectedId)}`
        );

        if (!active) return;

        let information = {};
        let informationError = "";

        try {
          const result = await api(
            `/users/${encodeURIComponent(selectedId)}/information`
          );

          information =
            result && typeof result === "object" ? result : {};
        } catch (err) {
          informationError =
            `Existing profile loaded, but additional information could not be loaded: ${
              err.message || "API unavailable"
            }`;
        }

        if (!active) return;

        setProfile({
          ...userData,
          ...information,
        });

        setForm({
          loanStatus: information.loanStatus || "CLEAR",
          loanDuration: information.loanDuration || "",
          totalLoansTaken: information.totalLoansTaken ?? 0,
          joiningDate: information.joiningDate || "",
          fatherName: information.fatherName || "",
          motherName: information.motherName || "",
          maritalStatus: information.maritalStatus || "",
          nationality: information.nationality || "",
          languagesKnown: information.languagesKnown || "",
          emergencyContactPerson:
            information.emergencyContactPerson || "",
          nomineeName: information.nomineeName || "",
          nomineeRelation: information.nomineeRelation || "",
        });

        setError(informationError);
      } catch (err) {
        if (active) {
          setProfile(null);
          setError(
            err.message || "Member profile could not be loaded."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedId]);

  // ================= LOAD MEMBER PHOTO =================

  useEffect(() => {
    let active = true;
    let objectUrl = null;

    async function loadMemberPhoto() {
      setMemberPhoto("");
      setPhotoError("");

      if (!selectedId) return;

      try {
        const url = await getMemberInformationPhoto(selectedId);

        if (!active) {
          if (url) {
            URL.revokeObjectURL(url);
          }

          return;
        }

        objectUrl = url;
        setMemberPhoto(url || "");
      } catch (err) {
        if (active) {
          setPhotoError(
            err.message || "Member photo could not be loaded."
          );
        }
      }
    }

    loadMemberPhoto();

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedId]);

  // ================= SEARCH MEMBERS =================

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return members;

    return members.filter((m) =>
      [m.fullName, m.email, m.phone, m.designation, m.id].some(
        (v) => String(v || "").toLowerCase().includes(q)
      )
    );
  }, [members, search]);

  // ================= FORM CHANGE =================

  function change(field, value) {
    setForm((old) => ({
      ...old,
      [field]: value,
    }));
  }

  // ================= SAVE MEMBER INFORMATION =================

  async function save(e) {
    e.preventDefault();

    if (!selectedId) return;

    setSaving(true);
    setError("");

    try {
      const saved = await api(
        `/users/${encodeURIComponent(selectedId)}/information`,
        {
          method: "PATCH",
          body: JSON.stringify({
            ...form,
            totalLoansTaken: Number(form.totalLoansTaken || 0),
            joiningDate: form.joiningDate || null,
          }),
        }
      );

      setProfile((old) => ({
        ...old,
        ...saved,
      }));

      setNotice?.("Member information saved successfully.", "success");
    } catch (err) {
      setError(
        err.message || "Could not save member information."
      );
    } finally {
      setSaving(false);
    }
  }

  // ================= UPLOAD MEMBER PHOTO =================

  async function handleMemberPhotoUpload(event) {
    const file = event.target.files?.[0];

    if (!file || !selectedId) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setPhotoError(
        "Only JPG, PNG and WEBP images are allowed."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError(
        "Photo size must be 5 MB or smaller."
      );

      event.target.value = "";
      return;
    }

    const formData = new FormData();

    formData.append("file", file);

    setPhotoUploading(true);
    setPhotoError("");

    try {
      await api(
        `/users/${encodeURIComponent(selectedId)}/information/photo`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const newUrl = await getMemberInformationPhoto(selectedId);

      setMemberPhoto((oldUrl) => {
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl);
        }

        return newUrl || "";
      });

      setNotice?.("Member photo uploaded successfully.", "success");
    } catch (err) {
      setPhotoError(
        err.message || "Member photo upload failed."
      );
    } finally {
      setPhotoUploading(false);

      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  }

  // ================= EXISTING PROFILE PHOTO =================

  const photo =
    profile?.hasImage ||
    profile?.imageUrl ||
    profile?.image_url
      ? `${API_BASE}/api/users/${encodeURIComponent(
          profile.id
        )}/image`
      : "";

  // ================= UI =================

  return (
    <div className="member-info-page">
      {/* PAGE HEADING */}

      <div className="member-info-heading">
        <div>
          <span className="member-info-eyebrow">
            MEMBER DIRECTORY
          </span>

          <h1>Member Information</h1>

          <p>
            View existing user details and maintain additional
            membership records.
          </p>
        </div>

        <button
          type="button"
          className="member-info-refresh"
          onClick={loadMembers}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "mi-spin" : ""}
          />

          Refresh
        </button>
      </div>

      {/* MEMBER SEARCH AND SELECT */}

      <div className="member-info-toolbar panel">
        <label className="member-info-search">
          <Search size={17} />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone or ID..."
          />
        </label>

        <label
          className="member-info-select-label"
          htmlFor="member-info-select"
        >
          Select member
        </label>

        <select
          id="member-info-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Choose a member</option>

          {filteredMembers.map((member) => (
            <option key={member.id} value={member.id}>
              #{member.id} · {member.fullName}
              {member.email ? ` — ${member.email}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="member-info-error" role="alert">
          {error}
        </div>
      )}

      {/* EMPTY STATE */}

      {!loading && !profile && (
        <div className="panel member-info-empty">
          <UserRound size={30} />

          <h3>No member selected</h3>

          <p>
            Choose a member from the list to view or update
            their information.
          </p>
        </div>
      )}

      {profile && (
        <>
          {/* MEMBER PROFILE AND PHOTO */}

          <section className="panel member-info-profile">
            <div className="member-info-avatar">
              {photo ? (
                <img
                  src={photo}
                  alt={`${profile.fullName} profile`}
                />
              ) : (
                <span>
                  {String(profile.fullName || "M")
                    .split(/\s+/)
                    .map((v) => v[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
              )}
            </div>

            <div className="member-info-person">
              <span className="member-info-id">
                MEMBER ID · {profile.id}
              </span>

              <h2>{displayValue(profile.fullName)}</h2>

              <p>
                {displayValue(profile.designation)}
                {profile.shortBio
                  ? ` · ${profile.shortBio}`
                  : ""}
              </p>

              <div className="member-info-chips">
                <span
                  className={`mi-status ${String(
                    profile.status || ""
                  ).toLowerCase()}`}
                >
                  {displayValue(profile.status)}
                </span>

                <span>{displayValue(profile.role)}</span>

                <span>
                  Age: {getAge(profile.dateOfBirth)}
                </span>
              </div>
            </div>

            {/* SEPARATE MEMBER PHOTO UPLOAD */}

            <div className="member-info-image-upload">
              <div className="member-photo-preview">
                {memberPhoto ? (
                  <img
                    src={memberPhoto}
                    alt={`${profile.fullName} member photograph`}
                  />
                ) : (
                  <div className="member-photo-placeholder">
                    <Camera size={28} />
                    <span>No Photo</span>
                  </div>
                )}
              </div>

              <div className="member-photo-actions">
                <h3>Member Photo</h3>

                <p>Dedicated membership photograph</p>

                <label
                  className={`member-info-upload-button ${
                    photoUploading ? "upload-disabled" : ""
                  }`}
                >
                  {photoUploading ? (
                    <RefreshCw
                      size={15}
                      className="mi-spin"
                    />
                  ) : (
                    <Upload size={15} />
                  )}

                  {photoUploading
                    ? "Uploading..."
                    : memberPhoto
                      ? "Change Photo"
                      : "Upload Photo"}

                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleMemberPhotoUpload}
                    disabled={photoUploading}
                  />
                </label>

                <small>
                  JPG, PNG, WEBP · Maximum 5 MB
                </small>

                {photoError && (
                  <span
                    className="member-photo-error"
                    role="alert"
                  >
                    {photoError}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* EXISTING USER PROFILE DETAILS */}

          <section className="panel member-info-card">
            <div className="member-info-section-title">
              <div className="mi-section-icon">
                <UserRound size={18} />
              </div>

              <div>
                <h3>Existing user profile</h3>

                <p>
                  Fetched directly from the existing users table.
                </p>
              </div>
            </div>

            <div className="member-info-details">
              <Detail
                icon={<Mail size={16} />}
                label="Email"
                value={profile.email}
              />

              <Detail
                icon={<Phone size={16} />}
                label="Phone"
                value={profile.phone}
              />

              <Detail
                icon={<CalendarDays size={16} />}
                label="Date of birth"
                value={profile.dateOfBirth}
              />

              <Detail
                icon={<HeartPulse size={16} />}
                label="Gender / Blood group"
                value={[
                  profile.gender,
                  profile.bloodGroup,
                ]
                  .filter(Boolean)
                  .join(" / ")}
              />

              <Detail
                icon={<BriefcaseBusiness size={16} />}
                label="Designation"
                value={profile.designation}
              />

              <Detail
                icon={<MapPin size={16} />}
                label="Address"
                value={profile.address}
              />

              <Detail
                icon={<ShieldCheck size={16} />}
                label="Account status"
                value={profile.status}
              />

              <Detail
                icon={<Languages size={16} />}
                label="Skills"
                value={skillsList(profile.skills).join(", ")}
              />

              <Detail
                label="Short bio"
                value={profile.shortBio}
              />

              <Detail
                label="Description"
                value={profile.description}
              />

              <Detail
                label="LinkedIn"
                value={profile.linkedinUrl}
                link
              />

              <Detail
                label="GitHub"
                value={profile.githubUrl}
                link
              />

              <Detail
                icon={<UserCheck size={16} />}
                label="Nominee Name"
                value={profile.nomineeName}
              />

              <Detail
                icon={<UserCheck size={16} />}
                label="Nominee Relation"
                value={profile.nomineeRelation}
              />
            </div>
          </section>

          {/* ADDITIONAL MEMBER INFORMATION FORM */}

          <form
            className="panel member-info-card"
            onSubmit={save}
          >
            <div className="member-info-section-title">
              <div className="mi-section-icon">
                <ShieldCheck size={18} />
              </div>

              <div>
                <h3>Additional member information</h3>

                <p>
                  These fields are stored separately from
                  the existing user profile fields.
                </p>
              </div>
            </div>

            <div className="member-info-form-grid">
              <Field label="Loan status">
                <select
                  value={form.loanStatus}
                  onChange={(e) =>
                    change("loanStatus", e.target.value)
                  }
                >
                  <option value="CLEAR">Clear</option>
                  <option value="PENDING">Pending</option>
                  <option value="DUE">Due</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </Field>

              <Field label="Loan duration">
                <input
                  value={form.loanDuration}
                  onChange={(e) =>
                    change("loanDuration", e.target.value)
                  }
                  placeholder="e.g. 12 months"
                />
              </Field>

              <Field label="Total loans taken">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.totalLoansTaken}
                  onChange={(e) =>
                    change("totalLoansTaken", e.target.value)
                  }
                />
              </Field>

              <Field label="Joining date">
                <input
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) =>
                    change("joiningDate", e.target.value)
                  }
                />
              </Field>

              <Field label="Father's name">
                <input
                  value={form.fatherName}
                  onChange={(e) =>
                    change("fatherName", e.target.value)
                  }
                  placeholder="Enter father's name"
                />
              </Field>

              <Field label="Mother's name">
                <input
                  value={form.motherName}
                  onChange={(e) =>
                    change("motherName", e.target.value)
                  }
                  placeholder="Enter mother's name"
                />
              </Field>

              <Field label="Marital status">
                <select
                  value={form.maritalStatus}
                  onChange={(e) =>
                    change("maritalStatus", e.target.value)
                  }
                >
                  <option value="">Select status</option>
                  <option>Single</option>
                  <option>Married</option>
                  <option>Widowed</option>
                  <option>Divorced</option>
                  <option>Other</option>
                </select>
              </Field>

              <Field label="Nationality">
                <input
                  value={form.nationality}
                  onChange={(e) =>
                    change("nationality", e.target.value)
                  }
                  placeholder="e.g. Indian"
                />
              </Field>

              <Field label="Languages known">
                <input
                  value={form.languagesKnown}
                  onChange={(e) =>
                    change("languagesKnown", e.target.value)
                  }
                  placeholder="e.g. Hindi, English"
                />
              </Field>

              <Field label="Emergency contact person">
                <input
                  value={form.emergencyContactPerson}
                  onChange={(e) =>
                    change(
                      "emergencyContactPerson",
                      e.target.value
                    )
                  }
                  placeholder="Name of emergency contact"
                />
              </Field>

              <Field label="Nominee Name">
                <input
                  value={form.nomineeName}
                  onChange={(e) =>
                    change("nomineeName", e.target.value)
                  }
                  placeholder="Enter nominee's full name"
                />
              </Field>

              <Field label="Nominee Relation">
                <input
                  value={form.nomineeRelation}
                  onChange={(e) =>
                    change("nomineeRelation", e.target.value)
                  }
                  placeholder="e.g. Wife, Father, Brother"
                />
              </Field>
            </div>

            {/* FORM FOOTER */}

            <div className="member-info-form-footer">
              <p>
                Age is calculated automatically from the
                existing date of birth. The member photo is
                stored separately from the existing user
                profile photo.
              </p>

              <button
                type="submit"
                className="member-info-save"
                disabled={saving}
              >
                <Save size={16} />

                {saving
                  ? "Saving…"
                  : "Save information"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

// ================= DETAIL COMPONENT =================

function Detail({ icon, label, value, link = false }) {
  const shown = displayValue(value);

  return (
    <div className="member-info-detail">
      <span className="mi-detail-icon">
        {icon || <UserRound size={16} />}
      </span>

      <div>
        <small>{label}</small>

        {link && value ? (
          <a
            href={String(value)}
            target="_blank"
            rel="noreferrer"
          >
            {shown}
          </a>
        ) : (
          <b>{shown}</b>
        )}
      </div>
    </div>
  );
}

// ================= FORM FIELD COMPONENT =================

function Field({ label, children }) {
  return (
    <label className="member-info-field">
      <span>{label}</span>
      {children}
    </label>
  );
}