import { api } from "./api";

export const listNotifications = () => api("/notifications");
export const getUnreadCount = async () => (await api("/notifications/unread-count"))?.count ?? 0;
export const markNotificationRead = (id) => api(`/notifications/${id}/read`, { method: "PATCH" });
export const markAllNotificationsRead = () => api("/notifications/read-all", { method: "PATCH" });
export const broadcastNotification = (body) =>
  api("/notifications/broadcast", { method: "POST", body: JSON.stringify(body) });
