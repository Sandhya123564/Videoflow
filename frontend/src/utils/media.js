const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const MEDIA_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "");

export function mediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${MEDIA_ORIGIN}${url}`;
}

export function formatBytes(n) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
