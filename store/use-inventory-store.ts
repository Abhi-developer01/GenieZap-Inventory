"use client";

import { create } from "zustand";
import type {
  DashboardStats,
  InventoryHistoryEntry,
  Product,
  Purchase,
  Sale,
} from "@/lib/types";
import { api } from "@/lib/api-client";

type InventoryState = {
  products: Product[];
  history: InventoryHistoryEntry[];
  purchases: Purchase[];
  sales: Sale[];
  dashboard: DashboardStats | null;
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchPurchases: () => Promise<void>;
  fetchSales: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  refreshAll: () => Promise<void>;
  setError: (error: string | null) => void;
};

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  history: [],
  purchases: [],
  sales: [],
  dashboard: null,
  loading: false,
  error: null,

  setError: (error) => set({ error }),

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const products = await api.products.list();
      set({ products, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load products",
      });
    }
  },

  fetchHistory: async () => {
    try {
      const history = await api.history();
      set({ history });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to load history",
      });
    }
  },

  fetchPurchases: async () => {
    try {
      const purchases = await api.purchases.list();
      set({ purchases });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to load purchases",
      });
    }
  },

  fetchSales: async () => {
    try {
      const sales = await api.sales.list();
      set({ sales });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to load sales" });
    }
  },

  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const dashboard = await api.dashboard();
      set({ dashboard, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load dashboard",
      });
    }
  },

  refreshAll: async () => {
    const { fetchProducts, fetchHistory, fetchPurchases, fetchSales, fetchDashboard } =
      get();
    await Promise.all([
      fetchProducts(),
      fetchHistory(),
      fetchPurchases(),
      fetchSales(),
      fetchDashboard(),
    ]);
  },
}));
