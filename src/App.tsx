import { useEffect, useState } from "react";
import ModelSelector from "./components/ModelSelector";
import Planilla from "./components/Planilla";
import Login from "./components/Login";
import type { ModelTemplate, PlanillaState } from "./types";
import { todayISO } from "./utils/format";
import { classifyItem } from "./utils/classify";
import { getAttachmentGroup } from "./data/attachmentGroups";
import { buildEmptyAttachments } from "./utils/attachments";
import { getToken, getUsername, getRole, roleLabel, logout, onAuthChange, isMissingBackendConfig } from "./lib/auth";
import jactoLogo from "./assets/jacto-logo.png";

function buildInitialState(model: ModelTemplate): PlanillaState {
  const group = getAttachmentGroup(model.id);
  return {
    header: {
      modeloId: model.id,
      modelo: model.modelo,
      cliente: "",
      chasisN: "",
      serieN: "",
      bombaN: "",
      motorN: "",
      fecha: todayISO(),
      realizadoPor: "",
    },
    items: model.items.map((it) => ({ ...it, type: classifyItem(it.desc) })),
    // La planilla de Solicitud de Pieza Faltante debe estar disponible siempre,
    // exista o no un grupo de anexos (Cummins/telemetría/etc.) para el modelo.
    attachments: buildEmptyAttachments(group?.hasEmbrague),
    photos: [],
    checklist: null,
  };
}

function normalizeLoadedState(loaded: PlanillaState): PlanillaState {
  const group = getAttachmentGroup(loaded.header?.modeloId ?? "");
  let next = loaded;
  if (!next.attachments) {
    next = { ...next, attachments: buildEmptyAttachments(group?.hasEmbrague) };
  } else if (group?.hasEmbrague && !next.attachments.embrague) {
    next = {
      ...next,
      attachments: { ...next.attachments, embrague: { firma: "", aclaracion: "", dni: "" } },
    };
  }
  if (!next.header?.bombaN) {
    next = { ...next, header: { ...next.header, bombaN: next.header?.bombaN ?? "" } };
  }
  if (!next.photos) {
    next = { ...next, photos: [] };
  }
  if (next.checklist === undefined) {
    next = { ...next, checklist: null };
  }
  return next;
}

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}

function SplashScreen({ theme }: { theme: "light" | "dark" }) {
  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center gap-5">
        <img src={jactoLogo} alt="Jacto Argentina" className="h-24 w-auto rounded-lg shadow-sm" />
        <div className="h-10 w-10 rounded-full border-4 border-orange-200 dark:border-orange-900 border-t-orange-600 animate-spin" />
      </div>
    </div>
  );
}

function BackendNotConfiguredScreen({ theme }: { theme: "light" | "dark" }) {
  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center gap-4 px-6 text-center">
        <img src={jactoLogo} alt="Jacto Argentina" className="h-16 w-auto rounded-lg shadow-sm mb-2" />
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Falta configurar el servidor
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
          Esta app se compiló en modo empaquetado (APK) sin indicar la dirección del backend.
          Definí <code className="px-1 rounded bg-slate-100 dark:bg-slate-800">VITE_API_BASE_URL</code>{" "}
          en el archivo <code className="px-1 rounded bg-slate-100 dark:bg-slate-800">.env</code>{" "}
          apuntando al servidor publicado, y volvé a compilar (<code className="px-1 rounded bg-slate-100 dark:bg-slate-800">npm run android:sync</code>).
        </p>
      </div>
    </div>
  );
}

function App() {
  const [state, setState] = useState<PlanillaState | null>(null);
  const [authed, setAuthed] = useState(() => !!getToken());
  const [booting, setBooting] = useState(true);
  const { theme, toggle } = useTheme();

  useEffect(() => onAuthChange(() => setAuthed(!!getToken())), []);

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 700);
    return () => clearTimeout(timer);
  }, []);

  if (booting) {
    return <SplashScreen theme={theme} />;
  }

  if (isMissingBackendConfig) {
    return <BackendNotConfiguredScreen theme={theme} />;
  }

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-white dark:bg-black transition-colors">
        <header className="bg-orange-600 dark:bg-black text-white py-3 px-4 no-print flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={jactoLogo} alt="Jacto Argentina" className="h-8 w-auto rounded" />
            <span className="font-semibold text-sm sm:text-base">
              Planillas de Armado de Equipos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/80 hidden sm:inline">
              {getUsername()} ({roleLabel(getRole())})
            </span>
            <button
              type="button"
              onClick={toggle}
              className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded"
              title="Cambiar entre modo claro y oscuro"
            >
              {theme === "dark" ? "☀ Modo claro" : "🌙 Modo oscuro"}
            </button>
            {state && (
              <button
                type="button"
                onClick={() => setState(null)}
                className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded"
              >
                Cambiar modelo
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                logout();
                setState(null);
              }}
              className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {!state ? (
          <ModelSelector
            onSelect={(model) => setState(buildInitialState(model))}
            onOpenSaved={(loaded) => setState(normalizeLoadedState(loaded))}
          />
        ) : (
          <Planilla
            state={state}
            setState={(updater) => setState((prev) => (prev ? updater(prev) : prev))}
            onLoadPlanilla={(loaded) => setState(normalizeLoadedState(loaded))}
            onBack={() => setState(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
