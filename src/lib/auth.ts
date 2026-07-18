import { Capacitor } from "@capacitor/core";

const SESSION_KEY = "jacto_auth_session";
const LOGOUT_EVENT = "jacto:auth-logout";

/**
 * Base URL del backend.
 * - Web normal (single-process fullstack): queda vacío y las rutas /api/... son relativas al mismo origen.
 * - App Android empaquetada (Capacitor, assets locales en dist/): se define en build time con
 *   VITE_API_BASE_URL apuntando al servidor publicado (ej: https://mi-app.dominio.com), porque
 *   dentro del WebView nativo window.location.origin no es el backend real.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

/** true cuando la app corre empaquetada dentro de Android/iOS (Capacitor), no en un navegador. */
export const isNativeApp = Capacitor.isNativePlatform();

/**
 * true si la app está corriendo como APK/app nativa ("modo bundled") pero no se configuró
 * VITE_API_BASE_URL al compilar: en ese caso todas las llamadas a /api/... van a fallar porque
 * apuntarían al origen local del WebView en vez del backend real.
 */
export const isMissingBackendConfig = isNativeApp && !API_BASE;

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export type Role =
  | "admin"
  | "operator"
  | "sector_armado"
  | "fabrica"
  | "repuestos"
  | "administracion";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  operator: "Operador",
  sector_armado: "Sector Armado",
  fabrica: "Fábrica",
  repuestos: "Repuestos",
  administracion: "Administración",
};

export function roleLabel(role: Role | null | undefined): string {
  if (!role) return "-";
  return ROLE_LABELS[role] ?? role;
}

type Session = { token: string; username: string; role: Role };

function readSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return readSession()?.token ?? null;
}

export function getUsername(): string | null {
  return readSession()?.username ?? null;
}

export function getRole(): Role | null {
  return readSession()?.role ?? null;
}

export function isAdmin(): boolean {
  return getRole() === "admin";
}

function setSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent(LOGOUT_EVENT));
}

export function clearToken(): void {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent(LOGOUT_EVENT));
}

export function onAuthChange(cb: () => void): () => void {
  window.addEventListener(LOGOUT_EVENT, cb);
  return () => window.removeEventListener(LOGOUT_EVENT, cb);
}

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(apiUrl("/api/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || "No se pudo iniciar sesión.");
  }
  const data = (await res.json()) as { token: string; username: string; role: Role };
  setSession(data);
}

export function logout(): void {
  clearToken();
}

/** fetch wrapper que agrega el token de sesión, resuelve la URL contra API_BASE,
 *  corta la espera si el servidor no responde en un tiempo razonable (en vez de
 *  dejar la UI "cargando" para siempre) y cierra sesión automáticamente ante un 401 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const url = input.startsWith("http") ? input : apiUrl(input);

  const timeoutMs = 25_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(
        "El servidor no respondió a tiempo. Verifique su conexión a internet e intente nuevamente."
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 401) {
    clearToken();
  }
  return res;
}
