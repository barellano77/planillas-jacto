import { useState } from "react";
import { login } from "../lib/auth";
import jactoLogo from "../assets/jacto-logo.png";

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full"
      >
        <div className="flex justify-center mb-4">
          <img src={jactoLogo} alt="Jacto Argentina" className="h-14 w-auto rounded" />
        </div>
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 text-center mb-1">
          Acceso restringido
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
          Ingrese sus credenciales para acceder a las planillas de armado
        </p>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
          Usuario
        </label>
        <input
          type="text"
          autoFocus
          className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm mb-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
          Contraseña
        </label>
        <input
          type="password"
          className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-xs text-rose-600 mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full px-4 py-2 rounded bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

