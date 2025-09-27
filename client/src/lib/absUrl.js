import { API_URL } from "../config/constants";

export function absUrl(u = "") {
  if (!u) return "";
  // Already absolute (Cloudinary, blob, or data URIs)
  if (/^(https?:|data:|blob:)/i.test(u)) return u;
  // Otherwise, assume it’s an API-relative path (rare now)
  return `${API_URL}${u}`;
}