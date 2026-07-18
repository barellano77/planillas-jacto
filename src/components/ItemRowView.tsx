import type { ItemRow } from "../types";
import type { CatalogItem } from "../data/catalogs";

type Props = {
  item: ItemRow;
  index: number;
  catalog: (CatalogItem & { qty?: number })[] | null;
  onChange: (id: string, patch: Partial<ItemRow>) => void;
  onDelete: (id: string) => void;
};

const inputCls =
  "w-full rounded border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100";

export default function ItemRowView({ item, index, catalog, onChange, onDelete }: Props) {
  const matchesCatalog = catalog?.some((c) => c.code === item.code) ?? false;

  return (
    <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60">
      <td className="px-2 py-2 text-center text-sm text-slate-500 dark:text-slate-400">
        {index + 1}
      </td>
      <td className="px-2 py-2 min-w-[220px]">
        {catalog ? (
          <div className="flex flex-col gap-1">
            <select
              className={inputCls}
              value={matchesCatalog ? item.code : "__custom__"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "__custom__") return;
                const found = catalog.find((c) => c.code === val);
                if (found) {
                  onChange(item.id, {
                    code: found.code,
                    desc: found.desc,
                    ...(found.qty !== undefined ? { qty: found.qty } : {}),
                  });
                }
              }}
            >
              {!matchesCatalog && <option value="__custom__">Personalizado (editar abajo)</option>}
              {catalog.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.desc}
                </option>
              ))}
            </select>
            {!matchesCatalog && (
              <input
                className={inputCls}
                value={item.desc}
                onChange={(e) => onChange(item.id, { desc: e.target.value })}
              />
            )}
          </div>
        ) : (
          <input
            className={inputCls}
            value={item.desc}
            onChange={(e) => onChange(item.id, { desc: e.target.value })}
          />
        )}
      </td>
      <td className="px-2 py-2 min-w-[110px]">
        <input
          className={`${inputCls} disabled:bg-slate-100 dark:disabled:bg-slate-700`}
          value={item.code}
          disabled={!!catalog && matchesCatalog}
          onChange={(e) => onChange(item.id, { code: e.target.value })}
        />
      </td>
      <td className="px-2 py-2 w-24">
        <input
          type="number"
          min={0}
          max={500}
          className={`${inputCls} text-center`}
          value={item.qty}
          onChange={(e) => {
            let v = parseInt(e.target.value, 10);
            if (Number.isNaN(v)) v = 0;
            v = Math.max(0, Math.min(500, v));
            onChange(item.id, { qty: v });
          }}
        />
      </td>
      <td className="px-2 py-2 w-28">
        <div className="flex gap-1 justify-center">
          <button
            type="button"
            onClick={() => onChange(item.id, { status: "-" })}
            className={`w-9 rounded border text-sm font-bold ${
              item.status === "-"
                ? "bg-emerald-500 text-white border-emerald-600"
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-300 dark:border-slate-600"
            }`}
            title="Está presente"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => onChange(item.id, { status: "X" })}
            className={`w-9 rounded border text-sm font-bold ${
              item.status === "X"
                ? "bg-rose-500 text-white border-rose-600"
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-300 dark:border-slate-600"
            }`}
            title="No está presente"
          >
            X
          </button>
        </div>
      </td>
      <td className="px-2 py-2 w-10 text-center">
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="text-slate-400 hover:text-rose-600 text-sm"
          title="Eliminar fila"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
