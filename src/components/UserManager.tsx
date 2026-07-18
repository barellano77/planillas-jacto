import { useCallback, useEffect, useState } from "react";
import { apiFetch, getUsername, roleLabel, type Role } from "../lib/auth";

const ROLE_OPTIONS: Role[] = [
  "operator",
  "admin",
  "sector_armado",
  "fabrica",
  "repuestos",
  "administracion",
];

type User = { id: number; username: string; role: Role; createdAt: string };

const inputCls =
  "w-full rounded border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100";

export default function UserManager({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("operator");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState<Role>("operator");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const currentUsername = getUsername();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/users");
      if (!res.ok) throw new Error("No se pudo obtener la lista de usuarios.");
      setUsers(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo obtener la lista de usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAdd() {
    if (!username.trim() || password.length < 4) {
      setError("Complete el usuario y una contraseña de al menos 4 caracteres.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password, role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "No se pudo crear el usuario.");
      }
      setUsername("");
      setPassword("");
      setRole("operator");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(u: User) {
    setEditingId(u.id);
    setEditRole(u.role);
    setEditPassword("");
    setEditError(null);
  }

  async function handleSaveEdit(id: number) {
    if (editPassword && editPassword.length < 4) {
      setEditError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      const patch: { role: Role; password?: string } = { role: editRole };
      if (editPassword) patch.password = editPassword;
      const res = await apiFetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "No se pudo actualizar el usuario.");
      }
      setEditingId(null);
      await refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "No se pudo actualizar el usuario.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "No se pudo eliminar el usuario.");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el usuario.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Gestionar usuarios
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Los administradores pueden gestionar el catálogo y usuarios; los operadores solo cargan
          planillas y generan códigos QR.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Usuario
            </label>
            <input
              className={inputCls}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: jperez"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Rol
            </label>
            <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-rose-600 mb-2">{error}</p>}

        <button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          className="w-full px-4 py-2 rounded bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-60 mb-4"
        >
          {saving ? "Guardando..." : "+ Agregar usuario"}
        </button>

        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
          Usuarios existentes
        </h3>
        {loading ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded max-h-64 overflow-y-auto">
            {users.map((u) =>
              editingId === u.id ? (
                <li key={u.id} className="px-3 py-2 text-sm space-y-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{u.username}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className={inputCls}
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as Role)}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {roleLabel(r)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="password"
                      className={inputCls}
                      placeholder="Nueva contraseña (opcional)"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                    />
                  </div>
                  {editError && <p className="text-xs text-rose-600">{editError}</p>}
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(u.id)}
                      disabled={editSaving}
                      className="text-xs px-3 py-1.5 rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60"
                    >
                      {editSaving ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </li>
              ) : (
                <li key={u.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">
                      {u.username}
                    </span>
                    {u.username === currentUsername && (
                      <span className="text-xs text-orange-500 ml-1">(vos)</span>
                    )}
                    <span
                      className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                        u.role === "admin"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {roleLabel(u.role)}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(u)}
                      className="text-slate-400 hover:text-orange-600 text-sm"
                      title="Editar"
                    >
                      ✎
                    </button>
                    {u.username !== currentUsername && (
                      <button
                        type="button"
                        onClick={() => handleDelete(u.id)}
                        className="text-slate-400 hover:text-rose-600 text-sm"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </li>
              )
            )}
          </ul>
        )}

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
