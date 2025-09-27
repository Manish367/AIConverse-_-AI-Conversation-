import { API_URL } from "../config/constants";

export function absUrl(u = "") {
  if (!u) return "";
  // Already an absolute URL
  if (/^(https?:|data:|blob:)/i.test(u)) return u;
  // Use environment API_URL when really pointing to API (for fetch calls)
  return `${API_URL || ""}${u.startsWith("/") ? "" : "/"}${u}`;
}