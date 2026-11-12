import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import BusinessIdeas from "./components/BusinessIdeas";
import ImageSlider from "./components/ImageSlider";
import MemberLayout from "./components/MemberLayout";
import ConfirmDialog from "./components/ConfirmDialog";
import StarField from "./components/StarField";
import Footer from "./components/Footer";
import BirthdayBanner from "./components/BirthdayBanner";
import ChatbotWidget from "./components/ChatbotWidget";
import AdminElectionManagement from "./components/AdminElectionManagement";
import MemberElectionVoting from "./components/MemberElectionVoting";
import About from "./page/About";
import { ToastProvider, useToast } from "./page/ToastContext";
import ContactUs from "./page/ContactUs";
import MemberInformation from "./page/MemberInformation";
import AttendanceDeposits from "./page/AttendanceDeposits";
import SlideDetail from "./page/SlideDetail";
import MemberDetailPage from "./page/MemberDetailPage";
import BikeLoader from "./components/BikeLoader";
import PublicSite from "./page/PublicSite";
import DashboardCommunityPhotos from "./components/DashboardCommunityPhotos";
import MiniProjects from "./page/MiniProjects";
import { Routes, Route } from "react-router-dom";
import PrivacyPolicy from "./page/PrivacyPolicy";
import TermsOfUse from "./page/TermsOfUse";
import Volunteer from "./page/Volunteer";
import OurImpact from "./page/OurImpact";
import ProgramsDashboard from "./components/ProgramsDashboard";
import NotificationsCenter from "./components/NotificationsCenter";
import ProgramPhotos from "./components/ProgramPhotos";
import { getUnreadCount } from "./notificationApi";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  CreditCard,
  FileText,
  Handshake,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Info,
  Settings,
  ShieldCheck,
  Users,
  X,
  CalendarCheck,
  Sparkles,
  Eye,
  EyeOff,
  Palette,
  Type,
  ALargeSmall,
  Link as LinkIcon,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  MoreVertical,
  Edit,
  Trash2,
  Gamepad2,
  Vote,
} from "lucide-react";
import { api, getToken, login, setToken } from "./api";

// ==========================================
// ROLE CONSTANTS
// ==========================================
const ADMIN_ROLES = [
  "ROLE_ADMIN",
  "ROLE_PRESIDENT",
  "ROLE_SECRETARY",
  "ROLE_TREASURER",
];

const isAdminUser = (user) => {
  if (!user || !user.role) return false;
  const normalized = String(user.role).toUpperCase();
  return ADMIN_ROLES.includes(normalized);
};

// ==========================================
// ADMIN NAVIGATION
// ==========================================
const adminNav = [
  { label: "Home", icon: LayoutDashboard },
  { label: "Our Team", icon: Users },
  { label: "Donate / Contributions", icon: CreditCard },
  { label: "Meetings", icon: CalendarDays },
  { label: "Attendance & Deposits", icon: CalendarCheck },
  { label: "Gallery & Events", icon: CalendarCheck },
  { label: "Our Impact", icon: MessageSquare },
  { label: "Our Programs", icon: Handshake },
  { label: "Business Ideas", icon: Lightbulb },
  { label: "Fun Time", icon: Gamepad2 },
  { label: "Notifications", icon: Bell },
  { label: "About Us", icon: Info },
  { label: "Contact Us", icon: CircleHelp },
  { label: "Member Information", icon: Users },
  { label: "Election Management", icon: Vote },
  { label: "Settings", icon: Settings },
];

// ==========================================
// MEMBER NAVIGATION
// ==========================================
const memberNav = [
  { label: "Home", icon: LayoutDashboard },
  { label: "Gallery & Events", icon: CalendarCheck },
  { label: "Our Programs", icon: Handshake },
  { label: "Business Ideas", icon: Lightbulb },
  { label: "Fun Time", icon: Gamepad2 },
  { label: "Donate / Contributions", icon: CreditCard },
  { label: "About Us", icon: Info },
  { label: "Contact Us", icon: CircleHelp },
  { label: "Elections & Voting", icon: Vote },
];

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

// ✅ FIX: initials() — empty/whitespace safe
const initials = (name) => {
  const clean = String(name || "").trim();
  if (!clean) return "OV";
  return clean
    .split(/\s+/)
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

// ✅ FIX: debounce hook for search
function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// StarField ko memoize kiya taaki Overview re-render pe re-mount na ho
const MemoizedStarField = React.memo(StarField);

// ==========================================
// ✅ FIX: Merged WebP converter
// ==========================================
async function convertImageToWebP(file, opts = {}) {
  const { output = "file", maxSize = 1920, quality = 0.85 } = opts;

  if (!file || !file.type || !file.type.startsWith("image/")) {
    return output === "dataUrl" ? null : file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Unable to create image canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (output === "dataUrl") {
          const dataUrl = canvas.toDataURL("image/webp", quality);
          URL.revokeObjectURL(objectUrl);
          if (!dataUrl.startsWith("data:image/webp;")) {
            reject(new Error("WebP conversion is not supported"));
            return;
          }
          resolve(dataUrl);
          return;
        }

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              reject(new Error("WebP conversion failed"));
              return;
            }
            if (blob.size >= file.size) {
              resolve(file);
              return;
            }
            resolve(
              new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
                type: "image/webp",
                lastModified: Date.now(),
              }),
            );
          },
          "image/webp",
          quality,
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Unable to load image: ${file.name}`));
    };

    img.src = objectUrl;
  });
}

// ✅ FIX: Error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}
        >
          <h2 style={{ marginBottom: 12 }}>Something went wrong</h2>
          <p style={{ color: "#666", marginBottom: 20 }}>
            {this.state.error?.message || "Unexpected error"}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#6554d9",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// LOGIN
// ==========================================
function Login({ onLogin, onBack, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [registrationNotice, setRegistrationNotice] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-art">
        <div className="brand-mark large">
          <Sparkles size={29} />
        </div>
        <p className="eyebrow">COMMUNITY • PURPOSE • PROGRESS</p>
        <h1>
          Better together.
          <br />
          <em>Stronger tomorrow.</em>
        </h1>
        <p className="login-copy">
          A thoughtful space to connect members, organise initiatives and make
          every contribution count.
        </p>
        <div className="art-orbit orbit-one" />
        <div className="art-orbit orbit-two" />
        <div className="art-stat">
          <span className="stat-dot" />
          <div>
            <b>One community</b>
            <small>Many ways to make a difference</small>
          </div>
        </div>
      </div>

      <form className="login-card" onSubmit={submit}>
        <button type="button" className="login-back-btn" onClick={onBack}>
          ← Back to public page
        </button>
        <div className="brand-lockup">
          <div className="brand-mark">
            <Sparkles size={22} />
          </div>
          <div>
            <b>OUR VISION</b>
            <small>Community portal</small>
          </div>
        </div>

        <div className="welcome">
          <h2>Welcome back</h2>
          <p>Sign in to your organisation workspace.</p>
        </div>

        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@ourvision.org"
          required
        />

        <label htmlFor="login-password">Password</label>
        <div className="password-field">
          <input
            id="login-password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="eye"
            onClick={() => setShow(!show)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="primary-btn login-btn"
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Signing in…" : "Sign in"} <span>→</span>
        </button>

        <div className="login-note">
          <ShieldCheck size={15} /> Secure access for your community
        </div>
        <div className="registration-prompt">
          <span>New user?</span>{" "}
          <button
            type="button"
            onClick={() => {
              setRegistrationNotice(true);
              onRegister?.();
            }}
          >
            Register here
          </button>
        </div>
        {registrationNotice && (
          <div className="registration-notice" role="status">
            Please contact with ADMIN for registration.
          </div>
        )}
      </form>
    </div>
  );
}

// ==========================================
// MAIN APP
// ==========================================
function App() {
  const { showToast } = useToast();

  // ✅ NEW: First-paint theme apply — public/login page pe bhi dark rahe
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("ourvision_appearance") || "{}",
      );
      const theme = saved.theme || "dark";
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
      document.body.classList.toggle("dark-mode", theme === "dark");
    } catch {
      // fallback: dark
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.dataset.theme = "dark";
      document.documentElement.style.colorScheme = "dark";
      document.body.classList.add("dark-mode");
    }
  }, []);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ourvision_user") || "null");
    } catch {
      return null;
    }
  });
  const [authScreen, setAuthScreen] = useState("public");

  const isAdmin = isAdminUser(user);

  const [section, setSection] = useState(() => {
    const savedSection = localStorage.getItem("ourvision_current_section");
    if (!savedSection || ["SlideDetail", "MemberDetail"].includes(savedSection)) return "Home";
    return savedSection;
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const refreshUnread = useCallback(() => {
    if (!user) return;
    getUnreadCount().then(setUnreadCount).catch(() => {});
  }, [user]);
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return undefined;
    }
    refreshUnread();
    const timer = window.setInterval(refreshUnread, 60000);
    return () => window.clearInterval(timer);
  }, [user, section, refreshUnread]);

  const [bikeLoading, setBikeLoading] = useState(true);
  const previousSectionRef = useRef(section);

  useEffect(() => {
    const timer = window.setTimeout(() => setBikeLoading(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (previousSectionRef.current === section) return;
    previousSectionRef.current = section;
    setBikeLoading(true);
    const timer = window.setTimeout(() => setBikeLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, [section]);

  useEffect(() => {
    if (!["SlideDetail", "MemberDetail"].includes(section)) {
      localStorage.setItem("ourvision_current_section", section);
    }
  }, [section]);

  const [selectedSlide, setSelectedSlide] = useState(null);
  const [sidebar, setSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  // Banner slider shows every member. Members without an uploaded photo get an initials card.
  const sliderItems = members.map((m) => ({
    id: m.id,
    name: m.fullName,
    image: m.hasMemberPhoto ? `${import.meta.env.VITE_API_BASE_URL}/api/users/${m.id}/information/photo` : null,
    member: m,
  }));
  const [contributions, setContributions] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const PAGE_SIZE = 25;
  const [pageNumbers, setPageNumbers] = useState({
    members: 0,
    contributions: 0,
    meetings: 0,
    events: 0,
  });
  const [pageMeta, setPageMeta] = useState({
    members: { page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 },
    contributions: {
      page: 0,
      size: PAGE_SIZE,
      totalElements: 0,
      totalPages: 0,
    },
    meetings: { page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 },
    events: { page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 },
  });

  function changePage(key, page) {
    setPageNumbers((old) => ({ ...old, [key]: Math.max(0, page) }));
  }

  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewProfile, setViewProfile] = useState(null);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    setPageNumbers((old) => ({ ...old, members: 0 }));
  }, [debouncedQuery]);

  const [businessIdeas, setBusinessIdeas] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("ourvision_business_ideas") || "[]",
      );
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  // Notices now show as toasts (kept as setNotice so existing callers still work).
  const setNotice = (message, type = "error") => {
    if (message) showToast(message, type);
  };
  const [modal, setModal] = useState("");
  const [form, setForm] = useState({});
  const [uploadFile, setUploadFile] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // ✅ DEFAULT DARK MODE — saved preference wins, warna "dark"
  const [appearance, setAppearance] = useState(() => {
    const defaults = {
      theme: "dark",
      wallpaper: "none",
      customWallpaper: "",
      uploadedWallpaper: "",
      wallpaperTab: "presets",
      accent: "#6554d9",
      fontColor: "#20253a",
      fontSize: "14",
      fontStyle: "normal",
    };
    try {
      const saved = JSON.parse(
        localStorage.getItem("ourvision_appearance") || "{}",
      );
      return {
        ...defaults,
        ...saved,
        theme: saved.theme || "dark",
      };
    } catch {
      return defaults;
    }
  });

  useLayoutEffect(() => {
    localStorage.setItem("ourvision_appearance", JSON.stringify(appearance));

    // ✅ Theme attribute + color-scheme + body class
    document.documentElement.setAttribute("data-theme", appearance.theme);
    document.documentElement.dataset.theme = appearance.theme;
    document.documentElement.style.colorScheme = appearance.theme;
    document.body.classList.toggle("dark-mode", appearance.theme === "dark");

    document.documentElement.style.setProperty("--purple", appearance.accent);
    document.documentElement.style.setProperty(
      "--font-size-base",
      `${appearance.fontSize}px`,
    );
    document.documentElement.style.setProperty(
      "--font-weight-base",
      appearance.fontStyle === "bold" ? "700" : "400",
    );
    document.documentElement.style.setProperty(
      "--font-style-base",
      appearance.fontStyle === "italic" ? "italic" : "normal",
    );

    const effectiveFontColor =
      appearance.theme === "dark" ? "#e8eaf5" : appearance.fontColor;
    document.documentElement.style.setProperty(
      "--font-color",
      effectiveFontColor,
    );

    const presets = {
      none: "none",
      aurora: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 45%, #ecfeff 100%)",
      sunset: "linear-gradient(135deg, #fff7ed 0%, #fdf2f8 50%, #eef2ff 100%)",
      ocean: "linear-gradient(135deg, #ecfeff 0%, #eff6ff 50%, #eef2ff 100%)",
      forest: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #f0f9ff 100%)",
      midnight:
        "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
      lavender:
        "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)",
      cream: "linear-gradient(135deg, #fefce8, #fffbeb 50%, #fef3c7 100%)",
    };

    let wallpaperValue = "none";
    if (appearance.uploadedWallpaper) {
      wallpaperValue = `url("${appearance.uploadedWallpaper}")`;
    } else if (appearance.customWallpaper) {
      wallpaperValue = `url("${appearance.customWallpaper.replace(/"/g, "")}")`;
    } else if (appearance.wallpaper && presets[appearance.wallpaper]) {
      wallpaperValue = presets[appearance.wallpaper];
    }

    document.documentElement.style.setProperty(
      "--page-wallpaper",
      wallpaperValue,
    );
  }, [appearance]);

  function updateAppearance(patch) {
    setAppearance((old) => ({ ...old, ...patch }));
  }

  async function handleLogin(email, password) {
    const result = await login(email, password);
    const u = { name: result.name, role: result.role, userId: result.userId };
    localStorage.setItem("ourvision_user", JSON.stringify(u));
    setUser(u);
    setAuthScreen("public");
  }

  function logout() {
    setToken(null);
    localStorage.removeItem("ourvision_user");
    localStorage.removeItem("ourvision_current_section");
    setUser(null);
    setSection("Home");
    setAuthScreen("public");
  }

  // ==========================================
  // DATA FETCHING
  // ==========================================
  useEffect(() => {
    if (!user || !getToken()) return;

    let active = true;
    setLoading(true);

    const apiRequests = {
      Home: [
        ["members", "/users"],
        ["contributions", "/contributions"],
        ["meetings", "/meetings"],
        ["events", "/events"],
      ],
      "Our Impact": [
        ["members", "/users"],
        ["contributions", "/contributions"],
        ["events", "/events"],
      ],
      "Our Team": [
        [
          "members",
          `/users/page?page=${pageNumbers.members}&size=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}&role=${encodeURIComponent(roleFilter === "All" ? "" : roleFilter)}&status=${encodeURIComponent(statusFilter === "All" ? "" : statusFilter)}`,
          true,
          "members",
        ],
      ],
      "Donate / Contributions": [
        ["members", "/users"],
        [
          "contributions",
          `/contributions/page?page=${pageNumbers.contributions}&size=${PAGE_SIZE}${isAdmin ? "" : `&userId=${user?.userId}`}`,
          true,
          "contributions",
        ],
      ],
      Meetings: [
        [
          "meetings",
          `/meetings/page?page=${pageNumbers.meetings}&size=${PAGE_SIZE}`,
          true,
          "meetings",
        ],
      ],
      "Gallery & Events": [
        [
          "events",
          `/events/page?page=${pageNumbers.events}&size=${PAGE_SIZE}`,
          true,
          "events",
        ],
      ],
    };

    const requests = apiRequests[section] || [];

    if (requests.length === 0) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    Promise.allSettled(
      requests.map(
        async ([key, endpoint, paginated = false, pageKey = null]) => ({
          key,
          paginated,
          pageKey,
          data: await api(endpoint),
        }),
      ),
    )
      .then((results) => {
        if (!active) return;

        let hasFailure = false;

        results.forEach((result) => {
          if (result.status === "rejected") {
            hasFailure = true;
            console.error("Data loading failed:", result.reason);
            return;
          }

          const { key, data, paginated, pageKey } = result.value;
          const value = paginated ? data?.content || [] : data || [];

          if (paginated && pageKey) {
            setPageMeta((old) => ({
              ...old,
              [pageKey]: {
                page: data?.number ?? 0,
                size: data?.size ?? PAGE_SIZE,
                totalElements: data?.totalElements ?? value.length,
                totalPages: data?.totalPages ?? (value.length ? 1 : 0),
              },
            }));
          }

          switch (key) {
            case "members":
              setMembers(value);
              break;
            case "contributions":
              setContributions(value);
              break;
            case "meetings":
              setMeetings(value);
              break;
            case "events":
              setEvents(value);
              break;
            default:
              break;
          }
        });

        if (hasFailure) {
          setNotice(
            "Some data could not load. Check that the backend and database are running.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    user,
    refresh,
    section,
    pageNumbers.members,
    pageNumbers.contributions,
    pageNumbers.meetings,
    pageNumbers.events,
    debouncedQuery,
    roleFilter,
    statusFilter,
    isAdmin,
  ]);

  const total = contributions.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0,
  );

  // ==========================================
  // SUBMIT FORM
  // ==========================================
  async function submitForm(e) {
    e.preventDefault();
    const currentModal = modal;
    try {
      if (currentModal === "member") {
        const memberPayload = {
          fullName: String(form.fullName || "").trim(),
          email: String(form.email || "").trim(),
          phone: String(form.phone || "").trim(),
          role: form.role || "MEMBER",
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender || null,
          bloodGroup: form.bloodGroup || null,
          designation: String(form.designation || "").trim(),
          shortBio: String(form.shortBio || "").trim(),
          description: String(form.description || "").trim(),
          skills: JSON.stringify(
            String(form.skills || "")
              .split(",")
              .map((skill) => skill.trim())
              .filter(Boolean),
          ),
          avatar: String(form.avatar || "").trim(),
          address: String(form.address || "").trim(),
          aadharNumber: String(form.aadharNumber || "").trim(),
          imageUrl: form.imageUrl || "",
          linkedinUrl: String(form.linkedinUrl || "").trim(),
          githubUrl: String(form.githubUrl || "").trim(),
          status: form.status || "ACTIVE",
          displayOrder: Number.isFinite(Number(form.displayOrder))
            ? Number(form.displayOrder)
            : 0,
        };
        if (!memberPayload.fullName || !memberPayload.email) {
          setNotice("Please enter the member name and email address.");
          return;
        }
        await api("/users", {
          method: "POST",
          body: JSON.stringify(memberPayload),
        });
      } else if (currentModal === "contribution") {
        await api("/contributions", {
          method: "POST",
          body: JSON.stringify({
            ...form,
            userId: Number(form.userId),
            amount: Number(form.amount),
          }),
        });
      } else if (currentModal === "meeting") {
        const isEdit = Boolean(form.id);
        await api(isEdit ? `/meetings/${form.id}` : "/meetings", {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify({
            ...form,
            meetingTime: form.meetingTime || null,
          }),
        });
      } else if (currentModal === "event") {
        const isEdit = Boolean(form.id);
        const url = isEdit
          ? `${import.meta.env.VITE_API_BASE_URL}/api/events/${form.id}/upload`
          : `${import.meta.env.VITE_API_BASE_URL}/api/events/upload`;

        const formData = new FormData();
        formData.append("title", form.title);
        if (form.eventDate) formData.append("eventDate", form.eventDate);
        if (form.venue) formData.append("venue", form.venue);
        if (form.description) formData.append("description", form.description);

        if (uploadFile && uploadFile.length > 0) {
          const convertedFiles = await Promise.all(
            uploadFile.map((file) =>
              convertImageToWebP(file, { output: "file", maxSize: 1920 }),
            ),
          );
          convertedFiles.forEach((file) => {
            if (file) formData.append("files", file);
          });
        }

        const token = getToken();
        const res = await fetch(url, {
          method: isEdit ? "PUT" : "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (!res.ok)
          throw new Error(`Event ${isEdit ? "update" : "upload"} failed`);
        setUploadFile(null);
      } else if (currentModal === "businessIdea") {
        const title = String(form.title || "").trim();
        const description = String(form.description || "").trim();
        if (!title || !description) {
          setNotice("Please enter both the business title and description.");
          return;
        }
        const idea = {
          id: Date.now(),
          title,
          description,
          createdAt: new Date().toISOString(),
        };
        setBusinessIdeas((previous) => {
          const updated = [idea, ...previous];
          localStorage.setItem(
            "ourvision_business_ideas",
            JSON.stringify(updated),
          );
          return updated;
        });
      }

      setModal("");
      setForm({});
      setUploadFile(null);

      showToast("Saved successfully.", "success");

      if (currentModal !== "businessIdea") {
        setRefresh((v) => v + 1);
      }
    } catch (err) {
      console.error("Form submission failed:", err);
      showToast(err.message || "Could not save. Please try again.", "error");
    }
  }

  const askConfirmation = (title, message, onConfirm) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm });
  };
  const closeConfirmation = () => {
    setConfirmConfig({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  };

  async function openMemberProfile(id) {
    try {
      const fullProfile = await api(`/users/${encodeURIComponent(id)}`);
      setViewProfile(fullProfile);
    } catch (err) {
      console.error("Could not load member profile:", err);
      showToast(err.message || "Could not load member profile.", "error");
    }
  }

  async function deleteMember(id) {
    askConfirmation(
      "Delete this member?",
      "This action cannot be undone. All data for this member will be permanently removed.",
      async () => {
        closeConfirmation();
        try {
          await api(`/users/${id}`, { method: "DELETE" });
          setMembers((v) => v.filter((m) => String(m.id) !== String(id)));
          setViewProfile((current) =>
            current && String(current.id) === String(id) ? null : current,
          );
          showToast("Member deleted successfully.", "success");
        } catch (err) {
          showToast(err.message || "Could not delete member.", "error");
        }
      },
    );
  }

  function deleteBusinessIdea(id) {
    askConfirmation(
      "Delete this business idea?",
      "This action cannot be undone.",
      () => {
        closeConfirmation();
        setBusinessIdeas((previous) => {
          const updated = previous.filter((idea) => idea.id !== id);
          localStorage.setItem(
            "ourvision_business_ideas",
            JSON.stringify(updated),
          );
          return updated;
        });
        showToast("Business idea deleted.", "success");
      },
    );
  }

  async function handleDeleteItem(kind, id) {
    const endpointMap = {
      event: `/events/${id}`,
      meeting: `/meetings/${id}`,
    };
    const endpoint = endpointMap[kind];
    if (!endpoint) {
      console.warn("Unsupported delete kind:", kind);
      return;
    }
    askConfirmation(
      `Delete this ${kind}?`,
      `This action cannot be undone. The ${kind} will be permanently removed.`,
      async () => {
        closeConfirmation();
        try {
          await api(endpoint, { method: "DELETE" });
          if (kind === "event") {
            setEvents((previous) => previous.filter((item) => item.id !== id));
          } else if (kind === "meeting") {
            setMeetings((previous) =>
              previous.filter((item) => item.id !== id),
            );
          }
          showToast(`${kind} deleted successfully.`, "success");
        } catch (err) {
          showToast(err.message || `Could not delete ${kind}.`, "error");
        }
      },
    );
  }

  const handleEditItem = (kind, item) => {
    setForm(item);
    setModal(kind);
  };

  const handleAddNewItem = (kind) => {
    setForm({});
    setUploadFile(null);
    setModal(kind);
  };

  // ==========================================
  // PUBLIC PAGE / LOGIN SCREEN
  // ==========================================

  // Public legal pages — accessible to everyone
  const currentPath = window.location.pathname;

  if (currentPath === "/privacy") {
    return (
      <div className="public-shell">
        <PrivacyPolicy />
        <Footer />
        <ChatbotWidget />
      </div>
    );
  }

  if (currentPath === "/terms") {
    return (
      <div className="public-shell">
        <TermsOfUse />
        <Footer />
        <ChatbotWidget />
      </div>
    );
  }

  // Volunteer page — accessible to everyone
  if (currentPath === "/volunteer") {
    return (
      <div className="public-shell">
        <Volunteer />
        <Footer />
        <ChatbotWidget />
      </div>
    );
  }

  if (!user || !getToken()) {
    return (
      <div
        className="public-shell"
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <div style={{ flex: 1 }}>
          {authScreen === "login" ? (
            <Login
              onLogin={handleLogin}
              onBack={() => setAuthScreen("public")}
              onRegister={() => {}}
            />
          ) : (
            <PublicSite onLogin={() => setAuthScreen("login")} />
          )}
        </div>
        <Footer /> {/* ✅ Public Page Footer */}
        <ChatbotWidget />
      </div>
    );
  }

  // ==========================================
  // LOGGED IN DASHBOARD
  // ==========================================
  return (
    <>
      {bikeLoading && <BikeLoader />}
      <ErrorBoundary>
        {/* 👇 MAIN WRAPPER: Flexbox column layout for full height */}
        <div
          className={`dashboard-layout ${isAdmin ? (sidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded") : "no-sidebar"}`}
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
        >
          {/* 👇 APP SHELL: Sidebar + Main Content */}
          <div className="app-shell" style={{ flex: 1 }}>
            {sidebar && (
              <div className="scrim" onClick={() => setSidebar(false)} />
            )}

            {isAdmin && (
              <>
                {sidebar && (
                  <div className="scrim" onClick={() => setSidebar(false)} />
                )}
                <aside className={`sidebar ${sidebar ? "open" : ""}`}>
                  <div className="sidebar-brand-wrapper">
                    <div className="brand-header">
                      <div className="brand-mark">
                        <img
                          src="/golden-ov-logo.png"
                          alt="OV"
                          className="brand-logo-img"
                        />
                      </div>
                      <div className="brand-text-container">
                        <h3 className="brand-title">OUR VISION</h3>
                        <span className="brand-subtitle">Community portal</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="sidebar-toggle"
                      title={
                        sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                      }
                      aria-label={
                        sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                      }
                      aria-expanded={!sidebarCollapsed}
                      onClick={() => setSidebarCollapsed((value) => !value)}
                    >
                      <Menu size={18} />
                    </button>
                    <button
                      type="button"
                      className="mobile-close"
                      aria-label="Close navigation menu"
                      onClick={() => setSidebar(false)}
                    >
                      <X size={21} />
                    </button>
                  </div>

                  <div className="org-pill">
                    <span className="org-avatar">OV</span>
                    <span>
                      <b>Our Vision Society</b>
                      <small>Admin workspace</small>
                    </span>
                    <ChevronDown size={15} />
                  </div>

                  <div className="nav-caption">ADMIN WORKSPACE</div>

                  <nav aria-label="Admin navigation">
                    {adminNav.map((item) => {
                      const Icon = item.icon;
                      const isCurrent = section === item.label;
                      return (
                        <button
                          key={item.label}
                          className={`nav-item ${isCurrent ? "active" : ""}`}
                          aria-current={isCurrent ? "page" : undefined}
                          onClick={() => {
                            setSection(item.label);
                            setSidebar(false);
                            setQuery("");
                          }}
                        >
                          <Icon size={18} />
                          <span>{item.label}</span>
                          {item.label === "Notifications" && unreadCount > 0 && (
                            <i className="nav-badge">{unreadCount}</i>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </aside>
              </>
            )}

            <main className={`main-area ${!isAdmin ? "member-main-area" : ""}`}>
              <header className="topbar">
                <div className="top-center">
                  <img
                    src="/Our Vision_ Together We Grow.png"
                    alt="Our Vision"
                    className="brand-logo-banner"
                  />
                </div>
                <div className="top-actions">
                  <div className="top-date">
                    <CalendarDays size={15} />
                    {new Date().toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <button
                    className="icon-btn notification-btn"
                    onClick={() => setSection("Notifications")}
                    aria-label="Notifications"
                  >
                    <Bell size={18} />
                    <i />
                  </button>
                  <div className="profile-menu-wrap">
                    <button
                      type="button"
                      className="profile-trigger top-user"
                      onClick={() => setProfileOpen((open) => !open)}
                    >
                      <span className="avatar small">
                        {initials(user.name)}
                      </span>
                      <ChevronDown size={15} />
                    </button>
                    {profileOpen && (
                      <div className="profile-dropdown">
                        <div className="profile-dropdown-user">
                          <b>{user.name}</b>
                          <small>
                            {user.role
                              ?.replace("ROLE_", "")
                              .replaceAll("_", " ")}
                          </small>
                        </div>
                        <button
                          className="profile-menu-item"
                          onClick={() => {
                            setProfileOpen(false);
                            setSection("Settings");
                          }}
                        >
                          <Settings size={16} /> Settings
                        </button>
                        <button
                          className="profile-logout"
                          onClick={() => {
                            setProfileOpen(false);
                            logout();
                          }}
                        >
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="auth-action-btn"
                    onClick={logout}
                    title="Log out and return to public page"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </header>

              {!isAdmin && (
                <MemberLayout section={section} setSection={setSection} />
              )}

              <div className="page-content">

                {section === "Our Team" && isAdmin && (
                  <Members
                    members={members}
                    query={query}
                    setQuery={(value) => setQuery(value)}
                    setModal={setModal}
                    deleteMember={deleteMember}
                    loading={loading}
                    roleFilter={roleFilter}
                    setRoleFilter={(value) => {
                      setRoleFilter(value);
                      changePage("members", 0);
                    }}
                    statusFilter={statusFilter}
                    setStatusFilter={(value) => {
                      setStatusFilter(value);
                      changePage("members", 0);
                    }}
                    setViewProfile={setViewProfile}
                    openMemberProfile={openMemberProfile}
                    pageInfo={pageMeta.members}
                    onPageChange={(page) => changePage("members", page)}
                  />
                )}

                {section === "Our Team" && !isAdmin && (
                  <AccessDenied section="Our Team" />
                )}

                {section === "Home" && (
                  <>
                    <Overview
                      user={user}
                      members={members}
                      contributions={contributions}
                      meetings={meetings}
                      events={events}
                      total={total}
                      loading={loading}
                      setSection={setSection}
                      setModal={setModal}
                      setSelectedSlide={setSelectedSlide}
                      sliderItems={sliderItems}
                      setSelectedMember={setSelectedMember}
                      isAdmin={isAdmin}
                    />

                    {/* Existing community photos, if present */}
                    <DashboardCommunityPhotos />
                  </>
                )}

                {section === "Donate / Contributions" && (
                  <Contributions
                    contributions={contributions}
                    members={members}
                    setModal={setModal}
                    total={total}
                    isAdmin={isAdmin}
                    currentUser={user}
                    pageInfo={pageMeta.contributions}
                    onPageChange={(page) => changePage("contributions", page)}
                    loading={loading}
                  />
                )}

                {section === "Attendance & Deposits" && isAdmin && (
                  <AttendanceDeposits isAdmin={true} setNotice={setNotice} />
                )}
                {section === "My Attendance & Deposits" && !isAdmin && (
                  <AttendanceDeposits isAdmin={false} setNotice={setNotice} />
                )}
                {section === "Attendance & Deposits" && !isAdmin && (
                  <AccessDenied section="Attendance & Deposits" />
                )}

                {section === "Meetings" && (
                  <SimpleList
                    title="Meetings"
                    description="Keep everyone aligned with upcoming gatherings."
                    items={meetings}
                    kind="meeting"
                    setModal={setModal}
                    loading={loading}
                    isAdmin={isAdmin}
                    onDelete={handleDeleteItem}
                    onEdit={handleEditItem}
                    onAdd={handleAddNewItem}
                    askConfirmation={askConfirmation}
                    setNotice={setNotice}
                    setRefresh={setRefresh}
                    pageInfo={pageMeta.meetings}
                    onPageChange={(page) => changePage("meetings", page)}
                  />
                )}

                {section === "Gallery & Events" && (
                  <SimpleList
                    title="Events"
                    description="Bring the community together through meaningful moments."
                    items={events}
                    kind="event"
                    setModal={setModal}
                    loading={loading}
                    isAdmin={isAdmin}
                    onDelete={handleDeleteItem}
                    onEdit={handleEditItem}
                    onAdd={handleAddNewItem}
                    askConfirmation={askConfirmation}
                    closeConfirmation={closeConfirmation}
                    setNotice={setNotice}
                    setRefresh={setRefresh}
                    pageInfo={pageMeta.events}
                    onPageChange={(page) => changePage("events", page)}
                  />
                )}

                {section === "Gallery & Events" && <ProgramPhotos />}

                {section === "Our Impact" && (
                  <OurImpact
                    contributions={contributions}
                    members={members}
                    events={events}
                  />
                )}

                {section === "Our Programs" && (
                  <ProgramsDashboard isAdmin={isAdmin} user={user} members={members} />
                )}

                {section === "Business Ideas" && (
                  <BusinessIdeas
                    ideas={businessIdeas}
                    setModal={setModal}
                    deleteIdea={deleteBusinessIdea}
                    isAdmin={isAdmin}
                  />
                )}

                {section === "Fun Time" && <MiniProjects />}

                {section === "Notifications" && (
                  <NotificationsCenter
                    isAdmin={isAdmin}
                    onNavigate={setSection}
                    onChanged={refreshUnread}
                  />
                )}

                {section === "MemberDetail" && selectedMember && (
                  <MemberDetailPage
                    member={selectedMember}
                    onBack={() => {
                      setSelectedMember(null);
                      setSection("Home");
                    }}
                  />
                )}

                {section === "SlideDetail" && selectedSlide && (
                  <SlideDetail
                    slide={selectedSlide}
                    onBack={() => {
                      setSelectedSlide(null);
                      setSection("Home");
                    }}
                  />
                )}

                {section === "About Us" && <About />}
                {section === "Contact Us" && <ContactUs />}
                {section === "Member Information" && isAdmin && (
                  <MemberInformation setNotice={setNotice} />
                )}
                {section === "Member Information" && !isAdmin && (
                  <AccessDenied section="Member Information" />
                )}

                {/* Admin-only election management */}
                {section === "Election Management" && isAdmin && (
                  <AdminElectionManagement />
                )}

                {/* Member election and voting page.
                    Support both labels because older navigation stores
                    "Election Management" while member navigation uses
                    "Elections & Voting". */}
                {(section === "Elections & Voting" ||
                  (section === "Election Management" && !isAdmin)) && (
                  <MemberElectionVoting />
                )}

                {section === "Settings" && (
                  <SettingsPage
                    appearance={appearance}
                    updateAppearance={updateAppearance}
                  />
                )}
              </div>
            </main>

            {modal && (
              <Modal
                kind={modal}
                form={form}
                setForm={setForm}
                members={members}
                setUploadFile={setUploadFile}
                setRefresh={setRefresh}
                close={() => {
                  setModal("");
                  setForm({});
                  setUploadFile(null);
                }}
                submit={submitForm}
              />
            )}

            {viewProfile && (
              <div
                className="modal-backdrop"
                onClick={(e) =>
                  e.target === e.currentTarget && setViewProfile(null)
                }
              >
                <div className="modal member-profile-modal">
                  <div className="modal-head">
                    <div>
                      <span className="eyebrow">MEMBER PROFILE</span>
                      <h2>{viewProfile.fullName}</h2>
                    </div>
                    <button
                      className="icon-btn"
                      onClick={() => setViewProfile(null)}
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      alignItems: "center",
                      marginBottom: "24px",
                    }}
                  >
                    {viewProfile.hasMemberPhoto ? (
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL}/api/users/${viewProfile.id}/information/photo`}
                        alt="Profile"
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        className="avatar"
                        style={{
                          width: "80px",
                          height: "80px",
                          fontSize: "28px",
                          borderRadius: "50%",
                        }}
                      >
                        {initials(viewProfile.fullName)}
                      </div>
                    )}
                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: "18px" }}>
                        {viewProfile.fullName}
                      </h3>
                      <span className="role-pill">
                        {viewProfile.role?.replace("ROLE_", "")}
                      </span>
                    </div>
                  </div>

                  <div className="member-profile-grid">
                    <div className="member-profile-field">
                      <small style={{ color: "var(--muted-text)" }}>
                        Email
                      </small>
                      <br />
                      <b>{viewProfile.email}</b>
                    </div>
                    <div className="member-profile-field">
                      <small style={{ color: "var(--muted-text)" }}>
                        Phone
                      </small>
                      <br />
                      <b>{viewProfile.phone || "—"}</b>
                    </div>
                    <div className="member-profile-field">
                      <small style={{ color: "var(--muted-text)" }}>
                        Date of birth
                      </small>
                      <br />
                      <b>{viewProfile.dateOfBirth || "—"}</b>
                    </div>
                    <div className="member-profile-field">
                      <small style={{ color: "var(--muted-text)" }}>
                        Gender
                      </small>
                      <br />
                      <b>{viewProfile.gender || "—"}</b>
                    </div>
                    <div className="member-profile-field">
                      <small style={{ color: "var(--muted-text)" }}>
                        Blood group
                      </small>
                      <br />
                      <b>{viewProfile.bloodGroup || "—"}</b>
                    </div>
                    <div className="member-profile-field">
                      <small style={{ color: "var(--muted-text)" }}>
                        Designation
                      </small>
                      <br />
                      <b>{viewProfile.designation || "—"}</b>
                    </div>
                    <div className="member-profile-field">
                      <small style={{ color: "var(--muted-text)" }}>
                        Short bio
                      </small>
                      <br />
                      <b>{viewProfile.shortBio || "—"}</b>
                    </div>
                    <div className="member-profile-field">
                      <small style={{ color: "var(--muted-text)" }}>
                        Status
                      </small>
                      <br />
                      <b
                        className={`profile-status ${String(viewProfile.status || "ACTIVE").toLowerCase()}`}
                      >
                        {viewProfile.status || "ACTIVE"}
                      </b>
                    </div>
                    <div className="member-profile-field profile-full-width">
                      <small style={{ color: "var(--muted-text)" }}>
                        Description
                      </small>
                      <br />
                      <b>{viewProfile.description || "—"}</b>
                    </div>
                    <div className="member-profile-field profile-full-width">
                      <small style={{ color: "var(--muted-text)" }}>
                        Skills
                      </small>
                      <br />
                      <b>
                        {(() => {
                          const value = viewProfile.skills;
                          if (!value) return "—";
                          try {
                            const parsed =
                              typeof value === "string"
                                ? JSON.parse(value)
                                : value;
                            return Array.isArray(parsed)
                              ? parsed.join(", ")
                              : String(value);
                          } catch {
                            return String(value);
                          }
                        })()}
                      </b>
                    </div>
                    <div className="member-profile-field">
                      <small style={{ color: "var(--muted-text)" }}>
                        LinkedIn
                      </small>
                      <br />
                      {viewProfile.linkedinUrl ? (
                        <a
                          href={viewProfile.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open profile
                        </a>
                      ) : (
                        <b>—</b>
                      )}
                    </div>
                    <div className="member-profile-field">
                      <small style={{ color: "var(--muted-text)" }}>
                        GitHub
                      </small>
                      <br />
                      {viewProfile.githubUrl ? (
                        <a
                          href={viewProfile.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open profile
                        </a>
                      ) : (
                        <b>—</b>
                      )}
                    </div>
                    <div className="member-profile-field profile-full-width">
                      <small style={{ color: "var(--muted-text)" }}>
                        Address
                      </small>
                      <br />
                      <b>{viewProfile.address || "—"}</b>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <ConfirmDialog
              isOpen={confirmConfig.isOpen}
              title={confirmConfig.title}
              message={confirmConfig.message}
              onConfirm={confirmConfig.onConfirm}
              onCancel={closeConfirmation}
            />
          </div>
          {/* 👆 APP SHELL CLOSE */}

          {/* 👇 NAYA DASHBOARD FOOTER: Full width, app-shell ke bahar */}
          <Footer />

          {/* ✅ ChatbotWidget yahan add kiya gaya hai */}
          <ChatbotWidget />
        </div>
        {/* 👆 MAIN WRAPPER CLOSE */}
      </ErrorBoundary>
    </>
  );
}

// ==========================================
// PAGINATION
// ==========================================
function PaginationControls({ pageInfo, onPageChange }) {
  if (!pageInfo || pageInfo.totalPages <= 1) return null;
  const currentPage = pageInfo.page || 0;
  const totalPages = pageInfo.totalPages || 0;
  return (
    <div
      className="list-toolbar"
      style={{
        justifyContent: "space-between",
        marginTop: "18px",
        gap: "12px",
      }}
    >
      <span
        aria-live="polite"
        style={{ color: "var(--muted, #777)", fontSize: "13px" }}
      >
        Page {currentPage + 1} of {totalPages} · {pageInfo.totalElements}{" "}
        records · {pageInfo.size} per page
      </span>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          className="secondary-btn"
          aria-label="Previous page"
          disabled={currentPage <= 0}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="secondary-btn"
          aria-label="Next page"
          disabled={currentPage >= totalPages - 1}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MEMBERS COMPONENT
═══════════════════════════════════════ */
function Members({
  members,
  query,
  setQuery,
  setModal,
  deleteMember,
  loading,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  setViewProfile,
  openMemberProfile,
  pageInfo,
  onPageChange,
}) {
  const serverFilteringActive =
    query.trim() !== "" || roleFilter !== "All" || statusFilter !== "All";

  const displayed = serverFilteringActive
    ? members
    : members.filter((m) => {
        const text = `${m.fullName} ${m.email} ${m.phone || ""}`.toLowerCase();
        const matchesSearch = text.includes(query.toLowerCase());
        const matchesRole = roleFilter === "All" || m.role === roleFilter;
        const matchesStatus =
          statusFilter === "All" || m.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      });

  const getRoleColor = (role) => {
    const r = (role || "").replace("ROLE_", "");
    if (r === "ADMIN") return "purple";
    if (r === "PRESIDENT") return "orange";
    if (r === "SECRETARY") return "blue";
    if (r === "TREASURER") return "green";
    return "grey";
  };

  return (
    <>
      <div className="page-heading" style={{ marginBottom: "20px" }}>
        <div>
          <div className="eyebrow">YOUR PEOPLE, YOUR STRENGTH</div>
          <h1>
            All Members{" "}
            <span className="count-pill">
              {pageInfo?.totalElements ?? members.length}
            </span>
          </h1>
          <p>Directory of your organisation members</p>
        </div>
        <button className="primary-btn" onClick={() => setModal("member")}>
          <Plus size={17} /> Add Member
        </button>
      </div>

      <div className="panel list-panel" aria-busy={loading}>
        <div className="list-toolbar" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div className="search-box" style={{ flex: 1, minWidth: "240px" }}>
            <Search size={17} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              aria-label="Search members by name, email, or phone"
            />
          </div>

          <select
            className="settings-input"
            style={{ width: "auto" }}
            aria-label="Filter members by role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="ROLE_ADMIN">Admin</option>
            <option value="ROLE_PRESIDENT">President</option>
            <option value="ROLE_SECRETARY">Secretary</option>
            <option value="ROLE_TREASURER">Treasurer</option>
            <option value="ROLE_MEMBER">Member</option>
          </select>

          <select
            className="settings-input"
            style={{ width: "auto" }}
            aria-label="Filter members by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="empty-state" role="status" aria-live="polite">
            Loading members…
          </div>
        ) : displayed.length ? (
          <div className="table-wrap">
            <table className="members-table">
              <thead>
                <tr>
                  <th>MEMBER</th>
                  <th>PHONE</th>
                  <th>ROLE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="person-cell">
                        {m.hasMemberPhoto ? (
                          <img
                            src={`${import.meta.env.VITE_API_BASE_URL}/api/users/${m.id}/information/photo`}
                            alt={m.fullName}
                            className="avatar-img"
                            onError={(e) => {
                              e.target.style.display = "none";
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = "grid";
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`avatar table-avatar bg-${getRoleColor(m.role)}`}
                          style={{ display: m.hasMemberPhoto ? "none" : "grid" }}
                        >
                          {initials(m.fullName)}
                        </div>

                        <div>
                          <b>{m.fullName}</b>
                          <small>{m.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{m.phone || "—"}</td>
                    <td>
                      <span
                        className={`role-pill role-${getRoleColor(m.role)}`}
                      >
                        {(m.role || "MEMBER")
                          .replace("ROLE_", "")
                          .replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status ${String(m.status || "ACTIVE").toUpperCase() === "INACTIVE" ? "inactive" : String(m.status || "ACTIVE").toUpperCase() === "BLOCKED" ? "blocked" : "paid"}`}
                      >
                        <i /> {m.status || "ACTIVE"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          className="action-icon view"
                          onClick={() => openMemberProfile(m.id)}
                          title="View Profile"
                          aria-label="View profile"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="action-icon delete"
                          onClick={() => deleteMember(m.id)}
                          title="Remove Member"
                          aria-label="Remove member"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Users size={22} />
            </div>
            <b>No members found</b>
            <p>Try adjusting your search or filters.</p>
          </div>
        )}
        <PaginationControls pageInfo={pageInfo} onPageChange={onPageChange} />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
   SIMPLE LIST (Meetings / Events)
═══════════════════════════════════════ */
function SimpleList({
  title,
  description,
  items,
  kind,
  setModal,
  loading,
  isAdmin,
  onDelete,
  onEdit,
  onAdd,
  askConfirmation,
  closeConfirmation,
  setNotice,
  setRefresh,
  pageInfo,
  onPageChange,
}) {
  const dateKey = kind === "meeting" ? "meetingDate" : "eventDate";
  const [menuOpen, setMenuOpen] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeMenu = () => setMenuOpen(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [menuOpen]);

  const handleDeleteAttachment = () => {
    const snapshot = {
      eventId: previewFile?.eventId,
      index: previewFile?.currentIndex,
    };
    if (snapshot.eventId == null || snapshot.index == null) return;

    askConfirmation(
      "Delete this attachment?",
      "This action cannot be undone. The file will be permanently removed from the event.",
      async () => {
        if (closeConfirmation) closeConfirmation();
        try {
          await api(
            `/events/${snapshot.eventId}/attachments/${snapshot.index}`,
            {
              method: "DELETE",
            },
          );
          setNotice("Attachment deleted successfully!", "success");
          setPreviewFile(null);
          setRefresh((v) => v + 1);
        } catch (err) {
          console.error("Delete failed:", err);
          setNotice("Could not delete attachment. Please try again.");
        }
      },
    );
  };

  return (
    <>
      <PageHeading
        eyebrow="PLAN • GATHER • GROW"
        title={title}
        description={description}
        action={
          isAdmin ? (
            <button className="primary-btn" onClick={() => onAdd(kind)}>
              <Plus size={17} /> Add {kind}
            </button>
          ) : null
        }
      />
      <div className="cards-grid">
        {loading ? (
          <div className="panel empty-state">Loading…</div>
        ) : items.length ? (
          items.map((item) => (
            <div
              className="panel event-card"
              key={item.id}
              style={{ position: "relative" }}
            >
              {isAdmin && (
                <div
                  style={{
                    position: "absolute",
                    top: "15px",
                    right: "15px",
                    zIndex: 10,
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === item.id ? null : item.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--font-color)",
                    }}
                    aria-label="More options"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {menuOpen === item.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        background: "var(--panel)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        display: "flex",
                        flexDirection: "column",
                        minWidth: "120px",
                        overflow: "hidden",
                        zIndex: 20,
                      }}
                    >
                      <button
                        onClick={() => {
                          onEdit(kind, item);
                          setMenuOpen(null);
                        }}
                        style={{
                          padding: "10px 14px",
                          border: "none",
                          background: "transparent",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "12px",
                          color: "#20253a",
                        }}
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          onDelete(kind, item.id);
                          setMenuOpen(null);
                        }}
                        style={{
                          padding: "10px 14px",
                          border: "none",
                          background: "transparent",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "12px",
                          color: "#c24f55",
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "15px",
                }}
              >
                <div
                  className={`event-icon ${kind}`}
                  style={{ margin: 0, flexShrink: 0 }}
                >
                  {kind === "meeting" ? (
                    <CalendarDays size={21} />
                  ) : (
                    <CalendarCheck size={21} />
                  )}
                </div>
                <div>
                  <div className="event-date">
                    {item[dateKey] || "Date to be announced"}
                  </div>
                  <h3 style={{ marginTop: "4px" }}>{item.title}</h3>
                </div>
              </div>

              <p style={{ marginTop: "15px" }}>
                {item.description || "No description added yet."}
              </p>

              {item.fileUrl && (
                <div
                  style={{
                    marginTop: "12px",
                    marginBottom: "12px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  {item.fileUrl.split(",").map((url, idx) => {
                    if (!url) return null;
                    const fileType = item.fileType
                      ? item.fileType.split(",")[idx]
                      : "DOCUMENT";
                    const fileName = item.fileName
                      ? item.fileName.split(",")[idx]
                      : "";

                    let thumbnailUrl = `${import.meta.env.VITE_API_BASE_URL}${url}`;
                    if (fileType === "IMAGE") {
                      const imageFileName = url.split("/").pop();
                      thumbnailUrl = `${import.meta.env.VITE_API_BASE_URL}/events/thumbnail/${encodeURIComponent(imageFileName)}`;
                    }

                    return (
                      <div
                        key={idx}
                        style={{
                          flex: "1 1 80px",
                          cursor: "pointer",
                          maxWidth: "100px",
                        }}
                        onClick={() =>
                          setPreviewFile({
                            eventId: item.id,
                            urls: item.fileUrl.split(","),
                            types: item.fileType
                              ? item.fileType.split(",")
                              : [],
                            names: item.fileName
                              ? item.fileName.split(",")
                              : [],
                            currentIndex: idx,
                            title: item.title,
                          })
                        }
                      >
                        {fileType === "IMAGE" && (
                          <img
                            src={thumbnailUrl}
                            alt={fileName || "Event thumbnail"}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.target.src = `${import.meta.env.VITE_API_BASE_URL}${url}`;
                            }}
                            style={{
                              width: "100%",
                              borderRadius: "8px",
                              height: "80px",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        )}
                        {fileType === "VIDEO" && (
                          <div
                            style={{
                              height: "80px",
                              background: "#000",
                              borderRadius: "8px",
                              display: "grid",
                              placeItems: "center",
                              color: "#fff",
                              fontSize: "12px",
                            }}
                          >
                            ▶ Video
                          </div>
                        )}
                        {fileType === "AUDIO" && (
                          <div
                            style={{
                              height: "80px",
                              background: "var(--border)",
                              borderRadius: "8px",
                              display: "grid",
                              placeItems: "center",
                              fontSize: "11px",
                              textAlign: "center",
                            }}
                          >
                            🎵 Audio
                          </div>
                        )}
                        {fileType === "DOCUMENT" && (
                          <div
                            style={{
                              height: "80px",
                              background: "var(--border)",
                              borderRadius: "8px",
                              display: "grid",
                              placeItems: "center",
                              fontSize: "11px",
                              textAlign: "center",
                            }}
                          >
                            📄 Doc
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="event-meta" style={{ marginTop: "15px" }}>
                <span>
                  <CalendarDays size={15} /> {item[dateKey] || "TBD"}
                </span>
                <span>
                  <Activity size={15} /> {item.venue || "Venue TBD"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="panel empty-state wide-empty">
            <div className="empty-icon">
              {kind === "meeting" ? (
                <CalendarDays size={22} />
              ) : (
                <CalendarCheck size={22} />
              )}
            </div>
            <b>No {title.toLowerCase()} yet</b>
            <p>{isAdmin ? "Create one to get started." : "Check back soon."}</p>
            {isAdmin && (
              <button className="text-btn" onClick={() => onAdd(kind)}>
                + Add {kind}
              </button>
            )}
          </div>
        )}
      </div>
      <PaginationControls pageInfo={pageInfo} onPageChange={onPageChange} />

      {previewFile && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 9999, padding: "20px" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewFile(null);
          }}
        >
          <div
            style={{
              background: "var(--panel)",
              padding: "20px",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "800px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ margin: 0, color: "#20253a" }}>
                {previewFile.title} - Attachment
              </h3>

              <div
                style={{ display: "flex", gap: "15px", alignItems: "center" }}
              >
                <button
                  onClick={handleDeleteAttachment}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#c24f55",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "14px",
                  }}
                  title="Delete Attachment"
                >
                  <Trash2 size={18} /> Delete
                </button>

                <button
                  onClick={() => setPreviewFile(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#20253a",
                  }}
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#000",
                borderRadius: "8px",
                position: "relative",
              }}
            >
              {previewFile.types[previewFile.currentIndex] === "IMAGE" && (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL}${previewFile.urls[previewFile.currentIndex]}`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "70vh",
                    objectFit: "contain",
                  }}
                  alt=""
                />
              )}
              {previewFile.types[previewFile.currentIndex] === "VIDEO" && (
                <video
                  src={`${import.meta.env.VITE_API_BASE_URL}${previewFile.urls[previewFile.currentIndex]}`}
                  controls
                  autoPlay
                  style={{ maxWidth: "100%", maxHeight: "70vh" }}
                />
              )}
              {previewFile.types[previewFile.currentIndex] === "AUDIO" && (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    width: "100%",
                  }}
                >
                  <p style={{ color: "#fff", marginBottom: "20px" }}>
                    {previewFile.names[previewFile.currentIndex]}
                  </p>
                  <audio
                    src={`${import.meta.env.VITE_API_BASE_URL}${previewFile.urls[previewFile.currentIndex]}`}
                    controls
                    autoPlay
                    style={{ width: "100%" }}
                  />
                </div>
              )}
              {previewFile.types[previewFile.currentIndex] === "DOCUMENT" && (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <p style={{ color: "#fff", marginBottom: "20px" }}>
                    {previewFile.names[previewFile.currentIndex]}
                  </p>
                  <a
                    href={`${import.meta.env.VITE_API_BASE_URL}${previewFile.urls[previewFile.currentIndex]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="primary-btn"
                  >
                    Open Document in New Tab
                  </a>
                </div>
              )}

              {previewFile.urls.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFile((prev) => ({
                        ...prev,
                        currentIndex:
                          prev.currentIndex === 0
                            ? prev.urls.length - 1
                            : prev.currentIndex - 1,
                      }));
                    }}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "10px",
                      transform: "translateY(-50%)",
                      background: "rgba(0, 0, 0, 0.8)",
                      color: "#fff",
                      border: "2px solid #ffffff",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      zIndex: 10,
                      fontSize: "24px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                      transition: "all 0.2s ease",
                    }}
                    aria-label="Previous"
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFile((prev) => ({
                        ...prev,
                        currentIndex:
                          prev.currentIndex === prev.urls.length - 1
                            ? 0
                            : prev.currentIndex + 1,
                      }));
                    }}
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: "10px",
                      transform: "translateY(-50%)",
                      background: "rgba(0, 0, 0, 0.8)",
                      color: "#fff",
                      border: "2px solid #ffffff",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      zIndex: 10,
                      fontSize: "24px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                      transition: "all 0.2s ease",
                    }}
                    aria-label="Next"
                  >
                    ›
                  </button>

                  <div
                    style={{
                      position: "absolute",
                      bottom: "15px",
                      left: "0",
                      right: "0",
                      display: "flex",
                      justifyContent: "center",
                      gap: "8px",
                      zIndex: 10,
                    }}
                  >
                    {previewFile.urls.map((_, idx) => (
                      <div
                        key={idx}
                        style={{
                          width:
                            idx === previewFile.currentIndex ? "20px" : "8px",
                          height: "8px",
                          borderRadius: "4px",
                          background:
                            idx === previewFile.currentIndex
                              ? "#fff"
                              : "rgba(255,255,255,0.4)",
                          transition: "all 0.3s ease",
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════
   ACCESS DENIED
═══════════════════════════════════════ */
function AccessDenied({ section }) {
  return (
    <div
      className="panel"
      style={{
        padding: "60px 30px",
        textAlign: "center",
        maxWidth: "480px",
        margin: "60px auto",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "16px",
          background: "#fff0ee",
          color: "#c24f55",
          display: "grid",
          placeItems: "center",
          margin: "0 auto 20px",
          fontSize: "28px",
        }}
      >
        🔒
      </div>
      <h2
        style={{
          font: "800 20px Manrope, sans-serif",
          color: "var(--font-color)",
          margin: "0 0 10px",
        }}
      >
        Access Denied
      </h2>
      <p
        style={{
          fontSize: "12px",
          color: "var(--muted-text)",
          margin: "0 0 20px",
          lineHeight: 1.6,
        }}
      >
        You don't have permission to access the <b>{section}</b> section. Please
        contact your administrator if you believe this is an error.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════
   SETTINGS PAGE
═══════════════════════════════════════ */
function SettingsPage({ appearance, updateAppearance }) {
  const { showToast } = useToast();
  const wallpapers = [
    {
      id: "none",
      name: "Clean",
      preview: "linear-gradient(135deg, #f5f7fb, #ffffff)",
    },
    {
      id: "aurora",
      name: "Aurora",
      preview: "linear-gradient(135deg, #043cf5, #7053ff, #5e15b3)",
    },
    {
      id: "sunset",
      name: "Sunset",
      preview: "linear-gradient(135deg, #e9aa5c, #bdd344, #101111)",
    },
    {
      id: "ocean",
      name: "Ocean",
      preview: "linear-gradient(135deg, #c107f0, #c611cc, #dd92dd)",
    },
    {
      id: "forest",
      name: "Forest",
      preview: "linear-gradient(135deg, #0cff34, #57da7e, #04880a)",
    },
    {
      id: "midnight",
      name: "Midnight",
      preview: "linear-gradient(135deg, #1e1b4b, #312e81, #4338ca)",
    },
    {
      id: "lavender",
      name: "Lavender",
      preview: "linear-gradient(135deg, #800ff1, #837296, #e20ead)",
    },
    {
      id: "cream",
      name: "Cream",
      preview: "linear-gradient(135deg, #fefce8, #fffbeb, #fef3c7)",
    },
  ];

  const accents = [
    { name: "Violet", value: "#6554d9" },
    { name: "Blue", value: "#3478d4" },
    { name: "Teal", value: "#159b91" },
    { name: "Rose", value: "#d84f83" },
    { name: "Amber", value: "#c78322" },
  ];

  const fontColors = [
    { name: "Charcoal", value: "#20253a" },
    { name: "Navy", value: "#1e3a8a" },
    { name: "Forest", value: "#14532d" },
    { name: "Maroon", value: "#7f1d1d" },
    { name: "Black", value: "#000000" },
  ];

  function handleWallpaperUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Image is too large. Please choose an image under 2 MB.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      updateAppearance({
        uploadedWallpaper: e.target.result,
        customWallpaper: "",
      });
    };
    reader.onerror = () => {
      showToast("Could not read the file. Please try again.", "error");
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <PageHeading
        eyebrow="MAKE IT YOURS"
        title="Appearance settings"
        description="Choose a theme, accent colour, font, and page background wallpaper."
      />

      <div className="settings-grid">
        <section className="panel settings-card">
          <div className="settings-title">
            <span className="settings-icon">
              <Palette size={19} />
            </span>
            <div>
              <h3>Display theme</h3>
              <p>Switch between light and dark appearance.</p>
            </div>
          </div>
          <div className="theme-options">
            <button
              className={`theme-choice light-preview ${appearance.theme === "light" ? "selected" : ""}`}
              onClick={() => updateAppearance({ theme: "light" })}
            >
              <span className="mini-window">
                <i />
                <i />
                <i />
                <b />
              </span>
              <span>Light</span>
              {appearance.theme === "light" && <CheckCircle2 size={16} />}
            </button>
            <button
              className={`theme-choice dark-preview ${appearance.theme === "dark" ? "selected" : ""}`}
              onClick={() => updateAppearance({ theme: "dark" })}
            >
              <span className="mini-window">
                <i />
                <i />
                <i />
                <b />
              </span>
              <span>Dark</span>
              {appearance.theme === "dark" && <CheckCircle2 size={16} />}
            </button>
          </div>
        </section>

        <section className="panel settings-card">
          <div className="settings-title">
            <span className="settings-icon">
              <Palette size={19} />
            </span>
            <div>
              <h3>Accent colour</h3>
              <p>
                Change the highlight colour used for buttons and active
                navigation.
              </p>
            </div>
          </div>
          <div className="accent-options">
            {accents.map((a) => (
              <button
                key={a.value}
                className={`accent-choice ${appearance.accent === a.value ? "selected" : ""}`}
                onClick={() => updateAppearance({ accent: a.value })}
                title={a.name}
                style={{ "--swatch": a.value }}
              >
                {appearance.accent === a.value && <Check size={17} />}
                <small>{a.name}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="panel settings-card">
          <div className="settings-title">
            <span className="settings-icon">
              <Type size={19} />
            </span>
            <div>
              <h3>Font colour</h3>
              <p>
                Change the main text colour used for headings and body content.
              </p>
            </div>
          </div>
          <div className="accent-options">
            {fontColors.map((c) => (
              <button
                key={c.value}
                className={`accent-choice ${appearance.fontColor === c.value ? "selected" : ""}`}
                onClick={() => updateAppearance({ fontColor: c.value })}
                title={c.name}
                style={{ "--swatch": c.value }}
              >
                {appearance.fontColor === c.value && <Check size={17} />}
                <small>{c.name}</small>
              </button>
            ))}
          </div>
          <p className="settings-hint">
            Note: In dark mode, the font colour is automatically adjusted for
            readability.
          </p>
        </section>

        <section className="panel settings-card">
          <div className="settings-title">
            <span className="settings-icon">
              <ALargeSmall size={19} />
            </span>
            <div>
              <h3>Typography</h3>
              <p>
                Adjust text size and style (Bold, Italic) for the workspace.
              </p>
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <label className="settings-label" style={{ marginTop: 0 }}>
                Font size (px)
              </label>
              <input
                type="number"
                min="12"
                max="24"
                className="settings-input"
                value={appearance.fontSize}
                onChange={(e) => updateAppearance({ fontSize: e.target.value })}
                placeholder="e.g. 14"
              />
            </div>

            <div>
              <label className="settings-label">Font style</label>
              <div
                className="theme-options"
                style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
              >
                <button
                  className={`theme-choice ${appearance.fontStyle === "normal" ? "selected" : ""}`}
                  onClick={() => updateAppearance({ fontStyle: "normal" })}
                >
                  <span style={{ fontWeight: 400 }}>Normal</span>
                </button>
                <button
                  className={`theme-choice ${appearance.fontStyle === "bold" ? "selected" : ""}`}
                  onClick={() => updateAppearance({ fontStyle: "bold" })}
                >
                  <span style={{ fontWeight: 700 }}>Bold</span>
                </button>
                <button
                  className={`theme-choice ${appearance.fontStyle === "italic" ? "selected" : ""}`}
                  onClick={() => updateAppearance({ fontStyle: "italic" })}
                >
                  <span style={{ fontStyle: "italic" }}>Italic</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="panel settings-card wallpaper-card">
          <div className="settings-title">
            <span className="settings-icon">
              <ImageIcon size={19} />
            </span>
            <div>
              <h3>Background wallpaper</h3>
              <p>Choose a preset, paste an image URL, or upload your own.</p>
            </div>
          </div>

          <div className="wallpaper-tabs">
            <button
              className={`wallpaper-tab ${appearance.wallpaperTab === "presets" ? "active" : ""}`}
              onClick={() => updateAppearance({ wallpaperTab: "presets" })}
            >
              <Sparkles size={14} /> Presets
            </button>
            <button
              className={`wallpaper-tab ${appearance.wallpaperTab === "url" ? "active" : ""}`}
              onClick={() => updateAppearance({ wallpaperTab: "url" })}
            >
              <LinkIcon size={14} /> URL
            </button>
            <button
              className={`wallpaper-tab ${appearance.wallpaperTab === "upload" ? "active" : ""}`}
              onClick={() => updateAppearance({ wallpaperTab: "upload" })}
            >
              <Upload size={14} /> Upload
            </button>
          </div>

          {appearance.wallpaperTab === "presets" && (
            <div className="wallpaper-options">
              {wallpapers.map((w) => (
                <button
                  key={w.id}
                  className={`wallpaper-choice ${appearance.wallpaper === w.id && !appearance.customWallpaper && !appearance.uploadedWallpaper ? "selected" : ""}`}
                  onClick={() =>
                    updateAppearance({
                      wallpaper: w.id,
                      customWallpaper: "",
                      uploadedWallpaper: "",
                    })
                  }
                >
                  <span style={{ background: w.preview }} />
                  <b>{w.name}</b>
                  {appearance.wallpaper === w.id &&
                    !appearance.customWallpaper &&
                    !appearance.uploadedWallpaper && <CheckCircle2 size={15} />}
                </button>
              ))}
            </div>
          )}

          {appearance.wallpaperTab === "url" && (
            <div className="wallpaper-tab-content">
              <label className="settings-label" htmlFor="custom-wallpaper">
                Image URL
              </label>
              <input
                id="custom-wallpaper"
                className="settings-input"
                type="url"
                placeholder="https://example.com/wallpaper.jpg"
                value={appearance.customWallpaper}
                onChange={(e) =>
                  updateAppearance({
                    customWallpaper: e.target.value,
                    uploadedWallpaper: "",
                  })
                }
              />

              {appearance.customWallpaper && (
                <div className="wallpaper-preview">
                  <span className="wallpaper-preview-label">Preview:</span>
                  <div
                    className="wallpaper-preview-img"
                    style={{
                      backgroundImage: `url("${appearance.customWallpaper}")`,
                    }}
                  />
                </div>
              )}

              <p className="settings-hint">
                Use a public image URL starting with https:// — the image loads
                directly from that source.
              </p>
            </div>
          )}

          {appearance.wallpaperTab === "upload" && (
            <div className="wallpaper-tab-content">
              <label className="wallpaper-upload-zone" htmlFor="wallpaper-file">
                <input
                  id="wallpaper-file"
                  type="file"
                  accept="image/*"
                  onChange={handleWallpaperUpload}
                  style={{ display: "none" }}
                />
                <Upload size={26} />
                <b>Click to upload an image</b>
                <small>JPG, PNG, or WebP · max 2 MB</small>
              </label>

              {appearance.uploadedWallpaper && (
                <div className="wallpaper-preview">
                  <span className="wallpaper-preview-label">
                    Uploaded image:
                  </span>
                  <div
                    className="wallpaper-preview-img"
                    style={{
                      backgroundImage: `url("${appearance.uploadedWallpaper}")`,
                    }}
                  />
                </div>
              )}

              <p className="settings-hint">
                Your uploaded image is saved locally in this browser. No file is
                sent to any server.
              </p>
            </div>
          )}

          {(appearance.customWallpaper ||
            appearance.uploadedWallpaper ||
            appearance.wallpaper !== "none") && (
            <button
              className="wallpaper-clear-btn"
              onClick={() =>
                updateAppearance({
                  wallpaper: "none",
                  customWallpaper: "",
                  uploadedWallpaper: "",
                })
              }
            >
              <X size={14} /> Clear wallpaper
            </button>
          )}
        </section>

        <div className="settings-saved">
          <CheckCircle2 size={17} />
          Your appearance preferences are saved automatically on this device.
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
   PAGE HEADING
═══════════════════════════════════════ */
function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════
   OVERVIEW (Home)
═══════════════════════════════════════ */
function Overview({
  user,
  members,
  contributions,
  meetings,
  events,
  total,
  loading,
  setSection,
  setModal,
  setSelectedSlide,
  sliderItems = [],
  setSelectedMember,
  isAdmin,
}) {
  const recent = [...contributions]
    .sort((a, b) => new Date(b.paidAt || 0) - new Date(a.paidAt || 0))
    .slice(0, 5);

  const upcoming = [
    ...meetings.map((x) => ({ ...x, _kind: "meeting", _date: x.meetingDate })),
    ...events.map((x) => ({ ...x, _kind: "event", _date: x.eventDate })),
  ]
    .filter(
      (item) => item._date && !Number.isNaN(new Date(item._date).getTime()),
    )
    .sort((a, b) => new Date(a._date) - new Date(b._date))
    .slice(0, 4);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <MemoizedStarField />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <div className="welcome-banner">
          <div className="banner-copy">
            <div className="banner-label">
              <Sparkles size={14} /> THE POWER OF TOGETHER
            </div>
            <h2>
              Small actions.
              <br />
              <em>Lasting impact.</em>
            </h2>
            <p>Every member and every contribution moves our vision forward.</p>
            <button
              onClick={() =>
                setSection(isAdmin ? "Our Team" : "Gallery & Events")
              }
            >
              {isAdmin ? "Explore your community" : "View gallery & events"}{" "}
              <span>→</span>
            </button>
          </div>
          <div className="banner-art">
            <ImageSlider
              items={sliderItems}
              onSlideClick={(item) => {
                setSelectedMember(item.member);
                setSection("MemberDetail");
              }}
            />
          </div>
        </div>

        <div className="section-row">
          <div>
            <h2>Organisation overview</h2>
            <p>Key numbers at a glance</p>
          </div>
          <span className="period-pill">
            <span /> Live summary
          </span>
        </div>

        <div className="stat-grid">
          {isAdmin ? (
            <>
              <StatCard
                icon={Users}
                label="Total members"
                value={members.length}
                change="Community network"
                tone="purple"
                onClick={() => setSection("Our Team")}
              />
              <StatCard
                icon={CreditCard}
                label="Total contributions"
                value={money(total)}
                change={`${contributions.length} recorded payments`}
                tone="green"
                onClick={() => setSection("Donate / Contributions")}
              />
              <StatCard
                icon={CalendarDays}
                label="Meetings scheduled"
                value={meetings.length}
                change="Meetings in your calendar"
                tone="blue"
                onClick={() => setSection("Meetings")}
              />
              <StatCard
                icon={CalendarCheck}
                label="Community events"
                value={events.length}
                change="Events planned"
                tone="orange"
                onClick={() => setSection("Gallery & Events")}
              />
            </>
          ) : (
            <>
              <StatCard
                icon={CreditCard}
                label="My contributions"
                value={money(total)}
                change="Your recorded payments"
                tone="green"
                onClick={() => setSection("Donate / Contributions")}
              />
              <StatCard
                icon={CalendarDays}
                label="Upcoming meetings"
                value={meetings.length}
                change="Meetings in calendar"
                tone="blue"
                onClick={() => setSection("Meetings")}
              />
              <StatCard
                icon={CalendarCheck}
                label="Community events"
                value={events.length}
                change="Events planned"
                tone="orange"
                onClick={() => setSection("Gallery & Events")}
              />
              <StatCard
                icon={Lightbulb}
                label="Business ideas"
                value="Share"
                change="Suggest an idea"
                tone="purple"
                onClick={() => setSection("Business Ideas")}
              />
            </>
          )}
        </div>

        {/* Automatic Birthday Wisher */}
        <BirthdayBanner />

        <div className="content-grid">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>
                  {isAdmin
                    ? "Recent contributions"
                    : "Your recent contributions"}
                </h3>
                <p>Latest member payments</p>
              </div>
              <button
                className="text-btn"
                onClick={() => setSection("Donate / Contributions")}
              >
                View all <span>→</span>
              </button>
            </div>
            {loading ? (
              <div className="empty-state">Loading your community data…</div>
            ) : recent.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>MEMBER</th>
                      <th>MONTH</th>
                      <th>AMOUNT</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="person-cell">
                            <div className="avatar table-avatar">
                              {initials(c.memberName)}
                            </div>
                            <div>
                              <b>{c.memberName || "Member"}</b>
                              <small>Receipt {c.receiptNo || `#${c.id}`}</small>
                            </div>
                          </div>
                        </td>
                        <td>{c.month || c.contributionMonth}</td>
                        <td className="amount">{money(c.amount)}</td>
                        <td>
                          <span
                            className={`status ${c.late ? "late" : "paid"}`}
                          >
                            <i />
                            {c.late ? "Late" : "Paid"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <CreditCard size={22} />
                </div>
                <b>No contributions yet</b>
                <p>Recorded member payments will appear here.</p>
                {isAdmin && (
                  <button
                    className="text-btn"
                    onClick={() => setModal("contribution")}
                  >
                    Add first contribution →
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="panel upcoming-panel">
            <div className="panel-head">
              <div>
                <h3>Coming up</h3>
                <p>Meetings & events</p>
              </div>
              <button
                className="more-btn"
                onClick={() => setSection("Meetings")}
              >
                •••
              </button>
            </div>
            {upcoming.map((item) => (
              <div className="upcoming-item" key={`${item._kind}-${item.id}`}>
                <div className={`date-tile ${item._kind}`}>
                  <b>{new Date(`${item._date}T00:00:00`).getDate()}</b>
                  <small>
                    {new Date(`${item._date}T00:00:00`).toLocaleString(
                      "en-IN",
                      {
                        month: "short",
                      },
                    )}
                  </small>
                </div>
                <div className="upcoming-info">
                  <b>{item.title}</b>
                  <small>{item.venue || "Venue to be announced"}</small>
                  <span>
                    {item._kind === "meeting"
                      ? "Team meeting"
                      : "Community event"}
                  </span>
                </div>
              </div>
            ))}
            {!upcoming.length && (
              <div className="empty-state compact">
                No upcoming items yet.
                {isAdmin && (
                  <button
                    className="text-btn"
                    onClick={() => setModal("meeting")}
                  >
                    Schedule a meeting →
                  </button>
                )}
              </div>
            )}
            <button
              className="upcoming-footer"
              onClick={() => setSection("Gallery & Events")}
            >
              View calendar <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   COUNT-UP HOOK
   ═══════════════════════════════════════ */
function useCountUp(target, { duration = 1200, enabled = true } = {}) {
  const [value, setValue] = useState(enabled ? 0 : target);
  const rafRef = useRef(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!enabled || prefersReduced || !Number.isFinite(target)) {
      setValue(target);
      return;
    }

    const start = performance.now();
    setValue(0);

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, enabled]);

  return value;
}

/* ═══════════════════════════════════════
   STAT CARD
═══════════════════════════════════════ */
function StatCard({ icon: Icon, label, value, change, tone, onClick }) {
  const isNumeric = typeof value === "number";
  const animated = useCountUp(isNumeric ? value : 0, { enabled: isNumeric });
  const display = isNumeric ? animated.toLocaleString("en-IN") : value;

  return (
    <button className="stat-card" onClick={onClick}>
      <div className={`stat-icon ${tone}`}>
        <Icon size={20} />
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{display}</div>
      <div className="stat-change">
        <span className="change-mark">
          <ArrowUpRight size={13} />
        </span>
        {change}
      </div>
      <span className="stat-arrow">↗</span>
    </button>
  );
}

/* ═══════════════════════════════════════
   CONTRIBUTIONS
═══════════════════════════════════════ */
function Contributions({
  contributions,
  members,
  setModal,
  isAdmin,
  currentUser,
  pageInfo,
  onPageChange,
  loading,
}) {
  const visibleContributions = isAdmin
    ? contributions
    : contributions.filter((c) => c.userId === currentUser?.userId);

  const visibleTotal = visibleContributions.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0,
  );

  return (
    <>
      <PageHeading
        eyebrow={isAdmin ? "TRANSPARENCY BUILDS TRUST" : "YOUR CONTRIBUTIONS"}
        title={isAdmin ? "Contributions" : "My Contributions"}
        description={
          isAdmin
            ? "Keep a clear record of community contributions and receipts."
            : "View your contributions and submit new ones."
        }
        action={
          <button
            className="primary-btn"
            onClick={() => setModal("contribution")}
          >
            <Plus size={17} />{" "}
            {isAdmin ? "Record payment" : "Submit contribution"}
          </button>
        }
      />
      <div className="stat-grid small-grid">
        <StatCard
          icon={CreditCard}
          label={isAdmin ? "Page total collected" : "Page total"}
          value={money(visibleTotal)}
          change="Payments on this page"
          tone="green"
          onClick={() => {}}
        />
        <StatCard
          icon={FileText}
          label="Payments recorded"
          value={visibleContributions.length}
          change={`Entries on this page (${pageInfo?.totalElements ?? visibleContributions.length} total)`}
          tone="purple"
          onClick={() => {}}
        />
        <StatCard
          icon={ArrowDownRight}
          label="Late payments on page"
          value={visibleContributions.filter((c) => c.late).length}
          change="Payments after due date on this page"
          tone="orange"
          onClick={() => {}}
        />
      </div>
      <div className="panel list-panel">
        <div className="list-toolbar">
          <div>
            <h3>{isAdmin ? "Payment history" : "My payment history"}</h3>
            <p>Latest contributions and payment modes</p>
          </div>
        </div>
        {loading ? (
          <div className="empty-state">Loading contributions…</div>
        ) : visibleContributions.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>MEMBER</th>
                  <th>MONTH</th>
                  <th>MODE</th>
                  <th>FINE</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {visibleContributions.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <b>
                        {c.memberName ||
                          members.find((m) => m.id === c.userId)?.fullName ||
                          `Member #${c.userId}`}
                      </b>
                    </td>
                    <td>{c.month || c.contributionMonth}</td>
                    <td>{c.paymentMode}</td>
                    <td>{money(c.fineAmount)}</td>
                    <td className="amount">{money(c.amount)}</td>
                    <td>
                      <span className={`status ${c.late ? "late" : "paid"}`}>
                        <i />
                        {c.late ? "Late" : "Paid"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <CreditCard size={22} />
            </div>
            <b>No payments recorded</b>
            <p>
              {isAdmin
                ? 'Use "Record payment" to add the first entry.'
                : "Submit your first contribution."}
            </p>
          </div>
        )}
        <PaginationControls pageInfo={pageInfo} onPageChange={onPageChange} />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
   COMING SOON
═══════════════════════════════════════ */
function ComingSoon({ icon: Icon, title, text }) {
  return (
    <>
      <PageHeading
        eyebrow="OUR VISION WORKSPACE"
        title={title}
        description="Tools to help your community do more together."
      />
      <div className="coming-panel panel">
        <div className="coming-art">
          <div className="coming-orbit" />
          <div className="coming-icon">
            <Icon size={33} />
          </div>
          <Sparkles className="spark spark-a" size={20} />
          <Sparkles className="spark spark-b" size={15} />
        </div>
        <span className="coming-pill">MODULE PREVIEW</span>
        <h2>{title}, all in one place.</h2>
        <p>{text}</p>
        <div className="coming-checks">
          <span>
            <Check size={15} /> Organisation-ready
          </span>
          <span>
            <Check size={15} /> Designed to connect with the API
          </span>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
   MODAL
═══════════════════════════════════════ */
function Modal({
  kind,
  form,
  setForm,
  members,
  close,
  submit,
  setUploadFile,
  setRefresh,
}) {
  const { showToast } = useToast();
  const title = {
    member: "Add a member",
    contribution: "Record contribution",
    meeting: form?.id ? "Edit meeting" : "Schedule a meeting",
    event: form?.id ? "Edit event" : "Create an event",
    businessIdea: "Add a business idea",
  }[kind];

  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">OUR VISION</span>
            <h2>{title}</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={close}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {kind === "member" && (
          <>
            <div className="form-row">
              <div>
                <label>Full name</label>
                <input
                  required
                  value={form.fullName || ""}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="e.g. Priya Sharma"
                />
              </div>
              <div>
                <label>Role</label>
                <select
                  value={form.role || "MEMBER"}
                  onChange={(e) => update("role", e.target.value)}
                >
                  <option value="MEMBER">Member</option>
                  <option value="OFFICE_BEARER">Office bearer</option>
                  <option value="PRESIDENT">President</option>
                  <option value="SECRETARY">Secretary</option>
                  <option value="TREASURER">Treasurer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Email address</label>
                <input
                  required
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="member@example.com"
                />
              </div>
              <div>
                <label>Phone number</label>
                <input
                  value={form.phone || ""}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Date of birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth || ""}
                  onChange={(e) => update("dateOfBirth", e.target.value)}
                />
              </div>
              <div>
                <label>Gender</label>
                <select
                  value={form.gender || ""}
                  onChange={(e) => update("gender", e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Blood group</label>
                <select
                  value={form.bloodGroup || ""}
                  onChange={(e) => update("bloodGroup", e.target.value)}
                >
                  <option value="">Select blood group</option>
                  {[
                    ["A_POS", "A+"],
                    ["A_NEG", "A-"],
                    ["B_POS", "B+"],
                    ["B_NEG", "B-"],
                    ["AB_POS", "AB+"],
                    ["AB_NEG", "AB-"],
                    ["O_POS", "O+"],
                    ["O_NEG", "O-"],
                  ].map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Designation</label>
                <input
                  value={form.designation || ""}
                  onChange={(e) => update("designation", e.target.value)}
                  placeholder="e.g. Software Engineer"
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Short bio</label>
                <input
                  maxLength={200}
                  value={form.shortBio || ""}
                  onChange={(e) => update("shortBio", e.target.value)}
                  placeholder="A short introduction"
                />
              </div>
              <div>
                <label>Skills (comma separated)</label>
                <input
                  value={form.skills || ""}
                  onChange={(e) => update("skills", e.target.value)}
                  placeholder="Java, Spring Boot, PostgreSQL"
                />
              </div>
            </div>

            <label>Description</label>
            <textarea
              value={form.description || ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Member profile description"
              rows={3}
            />

            <div className="form-row">
              <div>
                <label>LinkedIn URL</label>
                <input
                  type="url"
                  value={form.linkedinUrl || ""}
                  onChange={(e) => update("linkedinUrl", e.target.value)}
                  placeholder="https://www.linkedin.com/in/..."
                />
              </div>
              <div>
                <label>GitHub URL</label>
                <input
                  type="url"
                  value={form.githubUrl || ""}
                  onChange={(e) => update("githubUrl", e.target.value)}
                  placeholder="https://github.com/..."
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Aadhaar Number</label>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  value={form.aadharNumber || ""}
                  onChange={(e) => update("aadharNumber", e.target.value)}
                  placeholder="Enter only if required"
                />
                <small style={{ color: "var(--muted-text)" }}>
                  Avoid displaying this value in public profiles.
                </small>
              </div>
              <div>
                <label>Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    if (file.size > 2 * 1024 * 1024) {
                      showToast("Image too large. Please choose an image under 2 MB.", "warning");
                      e.target.value = "";
                      return;
                    }

                    try {
                      const webpDataUrl = await convertImageToWebP(file, {
                        output: "dataUrl",
                        maxSize: 400,
                        quality: 0.85,
                      });
                      if (webpDataUrl) update("imageUrl", webpDataUrl);
                    } catch (err) {
                      console.error("Image conversion failed:", err);
                      showToast("Could not process image. Please try again.", "error");
                    }
                  }}
                  style={{
                    padding: "8px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    width: "100%",
                  }}
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Status</label>
                <select
                  value={form.status || "ACTIVE"}
                  onChange={(e) => update("status", e.target.value)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>
              <div>
                <label>Display order</label>
                <input
                  type="number"
                  min="0"
                  value={form.displayOrder ?? 0}
                  onChange={(e) => update("displayOrder", e.target.value)}
                />
              </div>
            </div>

            <label>Address</label>
            <textarea
              value={form.address || ""}
              onChange={(e) => update("address", e.target.value)}
              placeholder="House No, Street, City, State, PIN"
              rows={2}
            />
          </>
        )}

        {kind === "contribution" && (
          <>
            <label>Member</label>
            <select
              required
              value={form.userId || ""}
              onChange={(e) => update("userId", e.target.value)}
            >
              <option value="">Choose a member</option>
              {members.map((m) => (
                <option value={m.id} key={m.id}>
                  {m.fullName} — {m.email}
                </option>
              ))}
            </select>
            <div className="form-row">
              <div>
                <label>Amount (₹)</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.amount || ""}
                  onChange={(e) => update("amount", e.target.value)}
                  placeholder="500"
                />
              </div>
              <div>
                <label>Contribution month</label>
                <input
                  required
                  value={form.month || ""}
                  onChange={(e) => update("month", e.target.value)}
                  placeholder="2026-10"
                />
              </div>
            </div>
            <label>Payment mode</label>
            <select
              value={form.paymentMode || "UPI"}
              onChange={(e) => update("paymentMode", e.target.value)}
            >
              <option>UPI</option>
              <option>CASH</option>
              <option>BANK_TRANSFER</option>
              <option>CHEQUE</option>
            </select>
            <label>Receipt number (optional)</label>
            <input
              value={form.receiptNo || ""}
              onChange={(e) => update("receiptNo", e.target.value)}
              placeholder="OV-2026-001"
            />
          </>
        )}

        {kind === "meeting" && (
          <>
            <label>Meeting title</label>
            <input
              required
              value={form.title || ""}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Monthly member meeting"
            />
            <div className="form-row">
              <div>
                <label>Date</label>
                <input
                  required
                  type="date"
                  value={form.meetingDate || ""}
                  onChange={(e) => update("meetingDate", e.target.value)}
                />
              </div>
              <div>
                <label>Time</label>
                <input
                  type="time"
                  value={form.meetingTime || ""}
                  onChange={(e) => update("meetingTime", e.target.value)}
                />
              </div>
            </div>
            <label>Venue</label>
            <input
              value={form.venue || ""}
              onChange={(e) => update("venue", e.target.value)}
              placeholder="Community hall"
            />
            <label>Description</label>
            <textarea
              value={form.description || ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Agenda and details"
            />
          </>
        )}

        {kind === "businessIdea" && (
          <>
            <label>Business title</label>
            <input
              required
              maxLength={120}
              value={form.title || ""}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Organic Grocery Delivery"
            />
            <label>Description</label>
            <textarea
              required
              maxLength={2000}
              rows={5}
              value={form.description || ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Local farmers se fresh organic vegetables lekar customers ke ghar deliver karne ka business."
            />
            <p className="form-hint">
              Your idea is saved in this browser on this device.
            </p>
          </>
        )}

        {kind === "event" && (
          <>
            <label>Event title</label>
            <input
              required
              value={form.title || ""}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Community service day"
            />
            <label>Date</label>
            <input
              required
              type="date"
              value={form.eventDate || ""}
              onChange={(e) => update("eventDate", e.target.value)}
            />
            <label>Venue</label>
            <input
              value={form.venue || ""}
              onChange={(e) => update("venue", e.target.value)}
              placeholder="Venue"
            />
            <label>Description</label>
            <textarea
              value={form.description || ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Tell members about the event"
            />

            {form.id && form.fileUrl && (
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "var(--font-color)",
                  }}
                >
                  Existing Attachments (Click ✕ to remove)
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "8px",
                  }}
                >
                  {form.fileUrl.split(",").map((url, idx) => {
                    const type = form.fileType
                      ? form.fileType.split(",")[idx]
                      : "DOCUMENT";
                    const name = form.fileName
                      ? form.fileName.split(",")[idx]
                      : "";

                    let thumbnailUrl = `${import.meta.env.VITE_API_BASE_URL}${url}`;
                    if (type === "IMAGE") {
                      const imageName = url.split("/").pop();
                      thumbnailUrl = `${import.meta.env.VITE_API_BASE_URL}/events/thumbnail/${encodeURIComponent(imageName)}`;
                    }

                    return (
                      <div
                        key={url || idx}
                        style={{
                          position: "relative",
                          width: "70px",
                          height: "70px",
                        }}
                      >
                        {type === "IMAGE" ? (
                          <img
                            src={`${thumbnailUrl}?t=${Date.now()}`}
                            alt="Existing"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "6px",
                              border: "1px solid #ccc",
                            }}
                            onError={(e) => {
                              e.target.src = `${import.meta.env.VITE_API_BASE_URL}${url}`;
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "grid",
                              placeItems: "center",
                              background: "#eee",
                              borderRadius: "6px",
                              fontSize: "10px",
                              textAlign: "center",
                            }}
                          >
                            📄 {type}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const token = getToken();
                              const response = await fetch(
                                `${import.meta.env.VITE_API_BASE_URL}/api/events/${form.id}/attachments/${idx}`,
                                {
                                  method: "DELETE",
                                  headers: token
                                    ? { Authorization: `Bearer ${token}` }
                                    : {},
                                },
                              );

                              if (!response.ok) {
                                throw new Error(
                                  "Failed to delete from backend",
                                );
                              }

                              if (setRefresh) {
                                setRefresh((v) => v + 1);
                              }

                              setForm((prevForm) => {
                                const urls = prevForm.fileUrl
                                  ? prevForm.fileUrl.split(",")
                                  : [];
                                const names = prevForm.fileName
                                  ? prevForm.fileName.split(",")
                                  : [];
                                const types = prevForm.fileType
                                  ? prevForm.fileType.split(",")
                                  : [];

                                const deletedUrl = urls[idx];

                                const newUrls = urls.filter(
                                  (u) => u !== deletedUrl,
                                );
                                const newNames = names.filter(
                                  (_, i) => i !== idx,
                                );
                                const newTypes = types.filter(
                                  (_, i) => i !== idx,
                                );

                                return {
                                  ...prevForm,
                                  fileUrl: newUrls.join(","),
                                  fileName: newNames.join(","),
                                  fileType: newTypes.join(","),
                                };
                              });
                            } catch (err) {
                              console.error(
                                "Could not delete attachment:",
                                err,
                              );
                            }
                          }}
                          style={{
                            position: "absolute",
                            top: "-6px",
                            right: "-6px",
                            background: "#c24f55",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                            fontSize: "12px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                          }}
                          title="Delete attachment"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <label>Upload New Photo / Video / Document</label>
            <div
              style={{
                border: "1px dashed #ccc",
                padding: "10px",
                borderRadius: "8px",
                marginTop: "5px",
              }}
            >
              <input
                type="file"
                multiple
                accept="image/*, video/*, audio/*, .pdf, .doc, .docx"
                onChange={(e) => setUploadFile(Array.from(e.target.files))}
                style={{ width: "100%" }}
              />
              <p style={{ fontSize: "10px", color: "gray", marginTop: "5px" }}>
                Max 100MB. Naye files purane files ke sath add ho jayenge.
              </p>
            </div>
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={close}>
            Cancel
          </button>
          <button className="primary-btn">
            <Check size={16} /> Save
          </button>
        </div>
      </form>
    </div>
  );
}

// ==========================================
// ✅ FIX: Main Export wraps the app in ToastProvider
// ==========================================
export default function AppWithProvider() {
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}
