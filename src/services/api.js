// Base API helper. Mock-backed for now; swap the fetch call inside each
// service function for a real endpoint later without touching page code.
const BASE_URL = "/api";

export async function mockDelay(data, ms = 250) {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export async function apiPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${path}`);
  return res.json();
}

export async function apiGet(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${path}`);
  return res.json();
}
