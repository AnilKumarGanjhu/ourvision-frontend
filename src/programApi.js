import { api } from "./api";

// Same base-URL rule as api.js, used to build links to uploaded files.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

export const fileUrl = (path) => (path ? `${API_BASE}${path}` : "");

const json = (body) => JSON.stringify(body);

export const listPrograms = () => api("/programs");
export const createProgram = (body) => api("/programs", { method: "POST", body: json(body) });
export const updateProgram = (id, body) => api(`/programs/${id}`, { method: "PUT", body: json(body) });
export const deleteProgram = (id) => api(`/programs/${id}`, { method: "DELETE" });
export const updateProgramStatus = (id, status) =>
  api(`/programs/${id}/status`, { method: "PATCH", body: json({ status }) });

export const assignVolunteer = (id, userId, role) =>
  api(`/programs/${id}/participants`, { method: "POST", body: json({ userId, role }) });
export const removeVolunteer = (id, userId) =>
  api(`/programs/${id}/participants/${userId}`, { method: "DELETE" });
export const registerForProgram = (id) => api(`/programs/${id}/register`, { method: "POST" });

export const addExpense = (id, body) => api(`/programs/${id}/expenses`, { method: "POST", body: json(body) });
export const deleteExpense = (id, expenseId) =>
  api(`/programs/${id}/expenses/${expenseId}`, { method: "DELETE" });

export const uploadBanner = (id, file) => {
  const form = new FormData();
  form.append("file", file);
  return api(`/programs/${id}/banner`, { method: "PUT", body: form });
};

export const uploadMedia = (id, file, type) => {
  const form = new FormData();
  form.append("file", file);
  return api(`/programs/${id}/media?type=${encodeURIComponent(type)}`, { method: "POST", body: form });
};
export const deleteMedia = (id, mediaId) => api(`/programs/${id}/media/${mediaId}`, { method: "DELETE" });

export const getFeedback = (id) => api(`/programs/${id}/feedback`);
export const submitFeedback = (id, body) => api(`/programs/${id}/feedback`, { method: "POST", body: json(body) });
export const deleteFeedback = (feedbackId) => api(`/programs/feedback/${feedbackId}`, { method: "DELETE" });

export const getGalleryPhotos = () => api("/programs/gallery-photos");
