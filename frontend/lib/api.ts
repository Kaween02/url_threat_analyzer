export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export type User = { id: number; name: string; email: string };
export type Scan = { id: number; url: string; risk: string; score: number; explanation: string; indicators: string[]; created_at: string };

export function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("uta_token");
}
export async function api<T>(path: string, options: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  const saved = auth ? token() : null;
  if (saved) headers.set("Authorization", `Bearer ${saved}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" });
  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    try { const data = await response.json(); message = data.detail || message; } catch {}
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
