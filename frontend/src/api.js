// Optional API client for the CaseLink backend (the UI currently runs on src/data/mockData.js).
// Usage: import { api } from "./api"; const cases = await api.get("/cases?bureau=PGRC");
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || res.statusText);
  return res.headers.get("content-type")?.includes("json") ? res.json() : res.text();
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: (p, body) => request(p, { method: "PATCH", body: JSON.stringify(body) }),
  async login(email, password, role) {
    const r = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password, role }) });
    localStorage.setItem("token", r.accessToken);
    localStorage.setItem("role", r.role);
    return r;
  },
};
