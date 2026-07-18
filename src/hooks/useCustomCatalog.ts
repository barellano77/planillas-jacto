import { useCallback, useEffect, useState } from "react";
import type { CatalogItemType } from "../data/catalogs";
import { apiFetch } from "../lib/auth";

export type CustomCatalogItem = {
  id: number;
  type: CatalogItemType;
  code: string;
  desc: string;
  qty: number;
};

export function useCustomCatalog() {
  const [items, setItems] = useState<CustomCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch("/api/catalog-items");
      if (res.ok) setItems(await res.json());
    } catch {
      // sin conexión al servidor: se mantiene la lista vacía/actual
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addItem(item: { type: CatalogItemType; code: string; desc: string; qty: number }) {
    const res = await apiFetch("/api/catalog-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || "No se pudo guardar la pieza.");
    }
    await refresh();
  }

  async function updateItem(
    id: number,
    item: { type: CatalogItemType; code: string; desc: string; qty: number }
  ) {
    const res = await apiFetch(`/api/catalog-items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || "No se pudo actualizar la pieza.");
    }
    await refresh();
  }

  async function removeItem(id: number) {
    const res = await apiFetch(`/api/catalog-items/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("No se pudo eliminar la pieza.");
    await refresh();
  }

  return { items, loading, refresh, addItem, updateItem, removeItem };
}
