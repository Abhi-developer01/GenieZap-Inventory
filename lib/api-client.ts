import type {
  DashboardStats,
  InventoryHistoryEntry,
  Product,
  Purchase,
  Sale,
} from "@/lib/types";
import type { ProductFormValues } from "@/lib/validations";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data as T;
}

export const api = {
  dashboard: () => fetchJson<DashboardStats>("/api/dashboard"),

  products: {
    list: () => fetchJson<Product[]>("/api/products"),
    create: (body: ProductFormValues) =>
      fetchJson<Product>("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Partial<ProductFormValues>) =>
      fetchJson<Product>(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/products/${id}`, {
        method: "DELETE",
      }),
  },

  stock: {
    in: (body: { productId: string; quantity: number; notes?: string }) =>
      fetchJson<Product>("/api/stock/in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    out: (body: { productId: string; quantity: number; notes?: string }) =>
      fetchJson<Product>("/api/stock/out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  },

  history: () => fetchJson<InventoryHistoryEntry[]>("/api/history"),

  purchases: {
    list: () => fetchJson<Purchase[]>("/api/purchases"),
    create: (body: Record<string, unknown>) =>
      fetchJson<Purchase>("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  },

  sales: {
    list: () => fetchJson<Sale[]>("/api/sales"),
    create: (body: Record<string, unknown>) =>
      fetchJson<Sale>("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    createBatch: (body: Record<string, unknown>) =>
      fetchJson<{ sales: Sale[]; count: number }>("/api/sales/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  },

  init: () =>
    fetchJson<{ success: boolean }>("/api/init", { method: "POST" }),
};
