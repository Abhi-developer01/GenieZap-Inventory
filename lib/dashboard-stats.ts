import type { DashboardStats, InventoryHistoryEntry, Product } from "@/lib/types";
import { format, subDays, startOfDay } from "date-fns";

export function computeDashboardStats(
  products: Product[],
  history: InventoryHistoryEntry[],
): DashboardStats {
  const totalProducts = products.length;
  const totalStockValue = products.reduce(
    (sum, p) => sum + p.quantity * p.price,
    0,
  );
  const lowStockProducts = products.filter(
    (p) => p.quantity <= p.lowStockThreshold,
  );

  const categoryMap = new Map<string, { count: number; value: number }>();
  for (const p of products) {
    const existing = categoryMap.get(p.category) ?? { count: 0, value: 0 };
    categoryMap.set(p.category, {
      count: existing.count + 1,
      value: existing.value + p.quantity * p.price,
    });
  }

  const categoryBreakdown = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({ category, ...data }),
  );

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const day = startOfDay(subDays(new Date(), 6 - i));
    return format(day, "yyyy-MM-dd");
  });

  const stockTrend = last7Days.map((date) => {
    const dayHistory = history.filter((h) => h.createdAt.startsWith(date));
    const stockIn = dayHistory
      .filter((h) => h.type === "stock_in" || h.type === "purchase")
      .reduce((s, h) => s + h.quantity, 0);
    const stockOut = dayHistory
      .filter((h) => h.type === "stock_out" || h.type === "sale")
      .reduce((s, h) => s + h.quantity, 0);
    return { date: format(new Date(date), "MMM d"), stockIn, stockOut };
  });

  return {
    totalProducts,
    totalStockValue,
    lowStockCount: lowStockProducts.length,
    lowStockProducts: lowStockProducts.slice(0, 5),
    recentActivity: history.slice(0, 8),
    categoryBreakdown,
    stockTrend,
  };
}
