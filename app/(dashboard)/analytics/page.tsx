"use client";

import { useEffect, useMemo } from "react";
import { Navbar } from "@/components/layout/navbar";
import { CategoryChart } from "@/components/charts/category-chart";
import { StockTrendChart } from "@/components/charts/stock-trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInventoryStore } from "@/store/use-inventory-store";
import { formatCurrency } from "@/lib/utils";

export default function AnalyticsPage() {
  const { dashboard, products, purchases, sales, loading, fetchDashboard, fetchProducts, fetchPurchases, fetchSales } =
    useInventoryStore();

  useEffect(() => {
    fetchDashboard();
    fetchProducts();
    fetchPurchases();
    fetchSales();
  }, [fetchDashboard, fetchProducts, fetchPurchases, fetchSales]);

  const totalPurchaseValue = useMemo(
    () => purchases.reduce((s, p) => s + p.totalCost, 0),
    [purchases],
  );
  const totalSalesValue = useMemo(
    () => sales.reduce((s, p) => s + p.totalPrice, 0),
    [sales],
  );

  return (
    <>
      <Navbar
        title="Analytics"
        description="Insights into inventory and transactions"
      />
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {loading && !dashboard ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Inventory value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(dashboard?.totalStockValue ?? 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total purchases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(totalPurchaseValue)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {purchases.length} entries
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(totalSalesValue)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sales.length} entries
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Stock movement trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <StockTrendChart data={dashboard?.stockTrend ?? []} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Category breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryChart data={dashboard?.categoryBreakdown ?? []} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top categories by product count</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {[...(dashboard?.categoryBreakdown ?? [])]
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8)
                    .map((c) => (
                      <li
                        key={c.category}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                      >
                        <span className="font-medium">{c.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {c.count} products · {formatCurrency(c.value)}
                        </span>
                      </li>
                    ))}
                </ul>
                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
