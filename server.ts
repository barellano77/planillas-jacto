import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { buildPdf, pdfFileName } from "./src/utils/pdf";
import {
  savePlanilla,
  getPlanilla,
  listPlanillas,
  listCatalogItems,
  addCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  DuplicateCodeError,
  findUserByUsername,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  verifyPassword,
  DuplicateUsernameError,
  type CatalogItemType,
  type UserRole,
} from "./src/server/db";
import type { PlanillaState } from "./src/types";
import { BOQUILLAS_CATALOG, TAPAS_CATALOG, FILTROS_CATALOG } from "./src/data/catalogs";

const VALID_ROLES: UserRole[] = [
  "admin",
  "operator",
  "sector_armado",
  "fabrica",
  "repuestos",
  "administracion",
];

const STATIC_CODES = new Set(
  [...BOQUILLAS_CATALOG, ...TAPAS_CATALOG, ...FILTROS_CATALOG].map((c) =>
    c.code.trim().toLowerCase()
  )
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "15mb" }));

// CORS: permite que la app Android empaquetada (Capacitor, origen capacitor://localhost o
// https://localhost) consuma esta API cuando los assets se sirven embebidos en el APK en vez de
// desde este mismo servidor. La autenticación usa Bearer token (no cookies), así que no hace
// falta habilitar credentials.
const ALLOWED_NATIVE_ORIGINS = new Set([
  "capacitor://localhost",
  "https://localhost",
  "http://localhost",
]);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_NATIVE_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

const APP_PASSWORD = process.env.APP_PASSWORD;
if (APP_PASSWORD) {
  console.warn(
    "[server] La variable APP_PASSWORD ya no se utiliza: ahora el acceso es por usuario y contraseña (ver tabla `users`)."
  );
}

type Session = { username: string; role: UserRole };
const sessions = new Map<string, Session>();

declare module "express-serve-static-core" {
  interface Request {
    user?: Session;
  }
}

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username?.trim() || !password) {
      res.status(400).json({ error: "Usuario y contraseña son obligatorios." });
      return;
    }
    const user = await findUserByUsername(username.trim());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Usuario o contraseña incorrectos." });
      return;
    }
    const token = randomUUID();
    sessions.set(token, { username: user.username, role: user.role });
    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    console.error("Error al iniciar sesión:", err);
    res.status(500).json({ error: "No se pudo iniciar sesión." });
  }
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const session = token ? sessions.get(token) : undefined;
  if (!session) {
    res.status(401).json({ error: "No autorizado. Inicie sesión nuevamente." });
    return;
  }
  req.user = session;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Solo un administrador puede realizar esta acción." });
    return;
  }
  next();
}

app.get("/api/users", requireAuth, requireAdmin, async (_req, res) => {
  try {
    res.json(await listUsers());
  } catch (err) {
    console.error("Error al listar usuarios:", err);
    res.status(500).json({ error: "No se pudo obtener la lista de usuarios." });
  }
});

app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body as {
      username?: string;
      password?: string;
      role?: string;
    };
    if (!username?.trim() || !password || password.length < 4) {
      res
        .status(400)
        .json({ error: "Usuario y contraseña (mínimo 4 caracteres) son obligatorios." });
      return;
    }
    if (!role || !VALID_ROLES.includes(role as UserRole)) {
      res.status(400).json({ error: "Rol inválido." });
      return;
    }
    const user = await createUser({ username: username.trim(), password, role: role as UserRole });
    res.json(user);
  } catch (err) {
    if (err instanceof DuplicateUsernameError) {
      res.status(409).json({ error: err.message });
      return;
    }
    console.error("Error al crear usuario:", err);
    res.status(500).json({ error: "No se pudo crear el usuario." });
  }
});

app.put("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }
    const { password, role } = req.body as { password?: string; role?: string };
    if (role && !VALID_ROLES.includes(role as UserRole)) {
      res.status(400).json({ error: "Rol inválido." });
      return;
    }
    if (password && password.length < 4) {
      res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres." });
      return;
    }
    await updateUser(id, { role: role as UserRole | undefined, password });
    res.json({ ok: true });
  } catch (err) {
    console.error("Error al actualizar usuario:", err);
    res.status(500).json({ error: "No se pudo actualizar el usuario." });
  }
});

app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }
    const all = await listUsers();
    const target = all.find((u) => u.id === id);
    if (target && target.username === req.user?.username) {
      res.status(400).json({ error: "No puede eliminar su propia cuenta." });
      return;
    }
    await deleteUser(id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    res.status(500).json({ error: "No se pudo eliminar el usuario." });
  }
});

app.post("/api/planillas", requireAuth, async (req, res) => {
  try {
    const state = req.body as PlanillaState;
    if (!state || !state.header) {
      res.status(400).json({ error: "Datos de planilla inválidos." });
      return;
    }
    const id = randomUUID();
    await savePlanilla(id, state);
    res.json({ id });
  } catch (err) {
    console.error("Error al guardar la planilla:", err);
    res.status(500).json({ error: "No se pudo guardar la planilla." });
  }
});

app.get("/api/planillas", requireAuth, async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const list = await listPlanillas(search);
    res.json(list);
  } catch (err) {
    console.error("Error al listar las planillas:", err);
    res.status(500).json({ error: "No se pudo obtener el historial de planillas." });
  }
});

app.get("/api/planillas/:id", requireAuth, async (req, res) => {
  try {
    const state = await getPlanilla(String(req.params.id));
    if (!state) {
      res.status(404).json({ error: "Planilla no encontrada." });
      return;
    }
    res.json(state);
  } catch (err) {
    console.error("Error al obtener la planilla:", err);
    res.status(500).json({ error: "No se pudo obtener la planilla." });
  }
});

app.get("/api/planillas/:id/pdf", async (req, res) => {
  try {
    const state = await getPlanilla(req.params.id);
    if (!state) {
      res.status(404).send("Planilla no encontrada.");
      return;
    }
    const doc = buildPdf(state);
    const buffer = Buffer.from(doc.output("arraybuffer"));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${pdfFileName(state)}"`);
    res.send(buffer);
  } catch (err) {
    console.error("Error al generar el PDF:", err);
    res.status(500).send("No se pudo generar el PDF.");
  }
});

const VALID_TYPES: CatalogItemType[] = ["boquilla", "tapa", "filtro"];

app.get("/api/catalog-items", requireAuth, async (_req, res) => {
  try {
    const items = await listCatalogItems();
    res.json(items);
  } catch (err) {
    console.error("Error al listar el catálogo:", err);
    res.status(500).json({ error: "No se pudo obtener el catálogo." });
  }
});

type CatalogPayload = { type: CatalogItemType; code: string; desc: string; qty: number };
type ParsedCatalogPayload = { error: string } | { value: CatalogPayload };

function parseCatalogPayload(body: unknown): ParsedCatalogPayload {
  const { type, code, desc, qty } = body as {
    type?: string;
    code?: string;
    desc?: string;
    qty?: number;
  };
  if (!type || !VALID_TYPES.includes(type as CatalogItemType)) {
    return { error: "Tipo de pieza inválido." };
  }
  if (!code?.trim() || !desc?.trim()) {
    return { error: "Código y descripción son obligatorios." };
  }
  const trimmedCode = code.trim();
  if (STATIC_CODES.has(trimmedCode.toLowerCase())) {
    return { error: `Ya existe una pieza con el código "${trimmedCode}".` };
  }
  const qtyNum = Math.max(0, Math.min(500, Number(qty) || 0));
  return {
    value: { type: type as CatalogItemType, code: trimmedCode, desc: desc.trim(), qty: qtyNum },
  };
}

app.post("/api/catalog-items", requireAuth, requireAdmin, async (req, res) => {
  try {
    const parsed = parseCatalogPayload(req.body);
    if ("error" in parsed) {
      res.status(parsed.error.startsWith("Ya existe") ? 409 : 400).json({ error: parsed.error });
      return;
    }
    const item = await addCatalogItem(parsed.value);
    res.json(item);
  } catch (err) {
    if (err instanceof DuplicateCodeError) {
      res.status(409).json({ error: err.message });
      return;
    }
    console.error("Error al guardar la pieza:", err);
    res.status(500).json({ error: "No se pudo guardar la pieza." });
  }
});

app.put("/api/catalog-items/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }
    const parsed = parseCatalogPayload(req.body);
    if ("error" in parsed) {
      res.status(parsed.error.startsWith("Ya existe") ? 409 : 400).json({ error: parsed.error });
      return;
    }
    const item = await updateCatalogItem(id, parsed.value);
    res.json(item);
  } catch (err) {
    if (err instanceof DuplicateCodeError) {
      res.status(409).json({ error: err.message });
      return;
    }
    console.error("Error al actualizar la pieza:", err);
    res.status(500).json({ error: "No se pudo actualizar la pieza." });
  }
});

app.delete("/api/catalog-items/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }
    await deleteCatalogItem(id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error al eliminar la pieza:", err);
    res.status(500).json({ error: "No se pudo eliminar la pieza." });
  }
});

const distDir = path.join(__dirname, "dist");
app.use(express.static(distDir));
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) {
    next();
    return;
  }
  res.sendFile(path.join(distDir, "index.html"));
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${port}`);
});
