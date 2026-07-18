import mysql from "mysql2/promise";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { ChecklistAnswer, PlanillaState } from "../types";

const connectionString = process.env.DATABASE_URL;

let pool: mysql.Pool | null = null;
const memoryPlanillas = new Map<string, PlanillaState>();

export type CatalogItemType = "boquilla" | "tapa" | "filtro";

export type CatalogItemRow = {
  id: number;
  type: CatalogItemType;
  code: string;
  desc: string;
  qty: number;
};

export class DuplicateCodeError extends Error {
  constructor(code: string) {
    super(`Ya existe una pieza con el código "${code}".`);
    this.name = "DuplicateCodeError";
  }
}

let memoryCatalogId = 0;
const memoryCatalog: CatalogItemRow[] = [];

export type UserRole =
  | "admin"
  | "operator"
  | "sector_armado"
  | "fabrica"
  | "repuestos"
  | "administracion";

export type UserRow = {
  id: number;
  username: string;
  role: UserRole;
  createdAt: string;
};

type UserRowWithHash = UserRow & { passwordHash: string };

export class DuplicateUsernameError extends Error {
  constructor(username: string) {
    super(`Ya existe un usuario con el nombre "${username}".`);
    this.name = "DuplicateUsernameError";
  }
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, 64);
  if (candidate.length !== hashBuffer.length) return false;
  return timingSafeEqual(candidate, hashBuffer);
}

let memoryUserId = 0;
const memoryUsers: UserRowWithHash[] = [];

if (connectionString) {
  pool = mysql.createPool({
    uri: connectionString,
    // Evita que una conexión/consulta trabada deje al cliente esperando para siempre:
    // si no se puede conectar o la consulta no responde en este lapso, se corta con un
    // error claro en vez de quedar "cargando" indefinidamente.
    connectTimeout: 10_000,
  });
} else {
  console.warn(
    "[db] DATABASE_URL no está definida. Usando almacenamiento en memoria (solo para desarrollo; los datos se pierden al reiniciar)."
  );
  memoryUserId += 1;
  memoryUsers.push({
    id: memoryUserId,
    username: "Admin",
    role: "admin",
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword("Admin3030"),
  });
  console.warn(
    '[db] Usuario admin creado por defecto -> usuario: "Admin", contraseña: "Admin3030".'
  );
}

let schemaReady: Promise<void> | null = null;

/**
 * Evita que una consulta a MySQL deje la petición HTTP "colgada" para siempre si la base
 * no responde (conexión trabada, red caída entre servicios, etc.). En vez de eso, falla
 * con un error claro después de `ms` milisegundos.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

const DB_TIMEOUT_MS = 15_000;
const DB_TIMEOUT_MESSAGE =
  "La consulta a la base de datos tardó demasiado en responder (posible problema de conexión con MySQL).";

async function addColumnIfMissing(table: string, definition: string): Promise<void> {
  try {
    await pool!.query(`ALTER TABLE ${table} ADD COLUMN ${definition};`);
  } catch (err) {
    const mysqlErr = err as { code?: string };
    if (mysqlErr.code !== "ER_DUP_FIELDNAME") throw err;
  }
}

async function ensureSchema(): Promise<void> {
  if (!pool) return;
  if (!schemaReady) {
    schemaReady = withTimeout(
      (async () => {
      await pool!.query(`
        CREATE TABLE IF NOT EXISTS planillas (
          id VARCHAR(36) PRIMARY KEY,
          data JSON NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await addColumnIfMissing("planillas", "modelo VARCHAR(150)");
      await addColumnIfMissing("planillas", "cliente VARCHAR(255)");
      await addColumnIfMissing("planillas", "chasis VARCHAR(100)");
      await addColumnIfMissing("planillas", "fecha VARCHAR(20)");
      await addColumnIfMissing("planillas", "realizado_por VARCHAR(255)");
      await addColumnIfMissing("planillas", "checklist JSON NULL");
      await pool!.query(`
        CREATE TABLE IF NOT EXISTS catalog_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          type VARCHAR(20) NOT NULL,
          code VARCHAR(50) NOT NULL,
          description VARCHAR(255) NOT NULL,
          qty INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_catalog_items_code (code)
        );
      `);
      await pool!.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'operator',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_users_username (username)
        );
      `);
      const [countRows] = await pool!.query("SELECT COUNT(*) AS c FROM users");
      const count = (countRows as { c: number }[])[0]?.c ?? 0;
      if (count === 0) {
        await pool!.query(
          "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')",
          ["Admin", hashPassword("Admin3030")]
        );
        console.warn(
          '[db] Usuario admin creado por defecto -> usuario: "Admin", contraseña: "Admin3030". Cámbiela luego de iniciar sesión.'
        );
      }
    })(),
      20_000,
      DB_TIMEOUT_MESSAGE
    );
  }
  await schemaReady;
}

export type PlanillaSummary = {
  id: string;
  modelo: string;
  cliente: string;
  chasis: string;
  fecha: string;
  realizadoPor: string;
  createdAt: string;
  checklist: ChecklistAnswer[] | null;
};

export async function savePlanilla(id: string, data: PlanillaState): Promise<void> {
  const header = data.header ?? ({} as PlanillaState["header"]);
  if (pool) {
    await ensureSchema();
    await withTimeout(
      pool.query(
        `INSERT INTO planillas (id, data, modelo, cliente, chasis, fecha, realizado_por, checklist)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           data = VALUES(data), modelo = VALUES(modelo), cliente = VALUES(cliente),
           chasis = VALUES(chasis), fecha = VALUES(fecha), realizado_por = VALUES(realizado_por),
           checklist = VALUES(checklist)`,
        [
          id,
          JSON.stringify(data),
          header.modelo ?? "",
          header.cliente ?? "",
          header.chasisN ?? "",
          header.fecha ?? "",
          header.realizadoPor ?? "",
          JSON.stringify(data.checklist ?? null),
        ]
      ),
      DB_TIMEOUT_MS,
      DB_TIMEOUT_MESSAGE
    );
    return;
  }
  memoryPlanillas.set(id, data);
}

export async function getPlanilla(id: string): Promise<PlanillaState | null> {
  if (pool) {
    await ensureSchema();
    const [rows] = await withTimeout(
      pool.query("SELECT data FROM planillas WHERE id = ?", [id]),
      DB_TIMEOUT_MS,
      DB_TIMEOUT_MESSAGE
    );
    const result = rows as { data: PlanillaState }[];
    if (result.length === 0) return null;
    return result[0].data;
  }
  return memoryPlanillas.get(id) ?? null;
}

export async function listPlanillas(search?: string): Promise<PlanillaSummary[]> {
  if (pool) {
    await ensureSchema();
    const like = `%${(search ?? "").trim()}%`;
    const [rows] = search?.trim()
      ? await pool.query(
          `SELECT id, modelo, cliente, chasis, fecha, realizado_por AS realizadoPor, created_at AS createdAt, checklist
           FROM planillas
           WHERE modelo LIKE ? OR cliente LIKE ? OR chasis LIKE ?
           ORDER BY created_at DESC LIMIT 200`,
          [like, like, like]
        )
      : await pool.query(
          `SELECT id, modelo, cliente, chasis, fecha, realizado_por AS realizadoPor, created_at AS createdAt, checklist
           FROM planillas ORDER BY created_at DESC LIMIT 200`
        );
    return (rows as (PlanillaSummary & { checklist: ChecklistAnswer[] | string | null })[]).map((row) => ({
      ...row,
      checklist:
        typeof row.checklist === "string"
          ? (JSON.parse(row.checklist) as ChecklistAnswer[] | null)
          : row.checklist ?? null,
    }));
  }
  const q = (search ?? "").trim().toLowerCase();
  return [...memoryPlanillas.entries()]
    .map(([id, data]) => ({
      id,
      modelo: data.header?.modelo ?? "",
      cliente: data.header?.cliente ?? "",
      chasis: data.header?.chasisN ?? "",
      fecha: data.header?.fecha ?? "",
      realizadoPor: data.header?.realizadoPor ?? "",
      createdAt: "",
      checklist: data.checklist ?? null,
    }))
    .filter(
      (s) =>
        !q ||
        s.modelo.toLowerCase().includes(q) ||
        s.cliente.toLowerCase().includes(q) ||
        s.chasis.toLowerCase().includes(q)
    )
    .reverse();
}

export async function listCatalogItems(): Promise<CatalogItemRow[]> {
  if (pool) {
    await ensureSchema();
    const [rows] = await pool.query(
      "SELECT id, type, code, description AS `desc`, qty FROM catalog_items ORDER BY created_at DESC"
    );
    return rows as CatalogItemRow[];
  }
  return [...memoryCatalog];
}

export async function addCatalogItem(item: {
  type: CatalogItemType;
  code: string;
  desc: string;
  qty: number;
}): Promise<CatalogItemRow> {
  if (pool) {
    await ensureSchema();
    try {
      const [result] = await pool.query(
        "INSERT INTO catalog_items (type, code, description, qty) VALUES (?, ?, ?, ?)",
        [item.type, item.code, item.desc, item.qty]
      );
      const insertId = (result as mysql.ResultSetHeader).insertId;
      return { id: insertId, ...item };
    } catch (err) {
      const mysqlErr = err as { code?: string };
      if (mysqlErr.code === "ER_DUP_ENTRY") {
        throw new DuplicateCodeError(item.code);
      }
      throw err;
    }
  }
  const exists = memoryCatalog.some(
    (c) => c.code.trim().toLowerCase() === item.code.trim().toLowerCase()
  );
  if (exists) {
    throw new DuplicateCodeError(item.code);
  }
  memoryCatalogId += 1;
  const row: CatalogItemRow = { id: memoryCatalogId, ...item };
  memoryCatalog.unshift(row);
  return row;
}

export async function deleteCatalogItem(id: number): Promise<void> {
  if (pool) {
    await ensureSchema();
    await pool.query("DELETE FROM catalog_items WHERE id = ?", [id]);
    return;
  }
  const idx = memoryCatalog.findIndex((c) => c.id === id);
  if (idx !== -1) memoryCatalog.splice(idx, 1);
}

export async function updateCatalogItem(
  id: number,
  item: { type: CatalogItemType; code: string; desc: string; qty: number }
): Promise<CatalogItemRow> {
  if (pool) {
    await ensureSchema();
    try {
      await pool.query(
        "UPDATE catalog_items SET type = ?, code = ?, description = ?, qty = ? WHERE id = ?",
        [item.type, item.code, item.desc, item.qty, id]
      );
      return { id, ...item };
    } catch (err) {
      const mysqlErr = err as { code?: string };
      if (mysqlErr.code === "ER_DUP_ENTRY") {
        throw new DuplicateCodeError(item.code);
      }
      throw err;
    }
  }
  const exists = memoryCatalog.some(
    (c) => c.id !== id && c.code.trim().toLowerCase() === item.code.trim().toLowerCase()
  );
  if (exists) {
    throw new DuplicateCodeError(item.code);
  }
  const idx = memoryCatalog.findIndex((c) => c.id === id);
  const row: CatalogItemRow = { id, ...item };
  if (idx !== -1) memoryCatalog[idx] = row;
  return row;
}

export async function findUserByUsername(
  username: string
): Promise<UserRowWithHash | null> {
  if (pool) {
    await ensureSchema();
    const [rows] = await pool.query(
      "SELECT id, username, password_hash AS passwordHash, role, created_at AS createdAt FROM users WHERE username = ?",
      [username]
    );
    const result = rows as UserRowWithHash[];
    return result[0] ?? null;
  }
  return memoryUsers.find((u) => u.username === username) ?? null;
}

export async function listUsers(): Promise<UserRow[]> {
  if (pool) {
    await ensureSchema();
    const [rows] = await pool.query(
      "SELECT id, username, role, created_at AS createdAt FROM users ORDER BY created_at ASC"
    );
    return rows as UserRow[];
  }
  return memoryUsers.map(({ id, username, role, createdAt }) => ({ id, username, role, createdAt }));
}

export async function createUser(user: {
  username: string;
  password: string;
  role: UserRole;
}): Promise<UserRow> {
  const passwordHash = hashPassword(user.password);
  if (pool) {
    await ensureSchema();
    try {
      const [result] = await pool.query(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
        [user.username, passwordHash, user.role]
      );
      const insertId = (result as mysql.ResultSetHeader).insertId;
      return { id: insertId, username: user.username, role: user.role, createdAt: new Date().toISOString() };
    } catch (err) {
      const mysqlErr = err as { code?: string };
      if (mysqlErr.code === "ER_DUP_ENTRY") {
        throw new DuplicateUsernameError(user.username);
      }
      throw err;
    }
  }
  const exists = memoryUsers.some(
    (u) => u.username.toLowerCase() === user.username.toLowerCase()
  );
  if (exists) {
    throw new DuplicateUsernameError(user.username);
  }
  memoryUserId += 1;
  const row: UserRowWithHash = {
    id: memoryUserId,
    username: user.username,
    role: user.role,
    createdAt: new Date().toISOString(),
    passwordHash,
  };
  memoryUsers.push(row);
  return { id: row.id, username: row.username, role: row.role, createdAt: row.createdAt };
}

export async function updateUser(
  id: number,
  patch: { role?: UserRole; password?: string }
): Promise<void> {
  if (pool) {
    await ensureSchema();
    if (patch.role) {
      await pool.query("UPDATE users SET role = ? WHERE id = ?", [patch.role, id]);
    }
    if (patch.password) {
      await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
        hashPassword(patch.password),
        id,
      ]);
    }
    return;
  }
  const user = memoryUsers.find((u) => u.id === id);
  if (!user) return;
  if (patch.role) user.role = patch.role;
  if (patch.password) user.passwordHash = hashPassword(patch.password);
}

export async function deleteUser(id: number): Promise<void> {
  if (pool) {
    await ensureSchema();
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    return;
  }
  const idx = memoryUsers.findIndex((u) => u.id === id);
  if (idx !== -1) memoryUsers.splice(idx, 1);
}
