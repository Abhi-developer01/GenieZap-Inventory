"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, DollarSign, IndianRupee, Package, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { StatCard } from "@/components/shared/stat-card";
import { CategoryChart } from "@/components/charts/category-chart";
import { StockTrendChart } from "@/components/charts/stock-trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useInventoryStore } from "@/store/use-inventory-store";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { dashboard, loading, fetchDashboard } = useInventoryStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <>
      <Navbar
        title="Dashboard"
        description="Overview of your inventory at a glance"
      />
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {loading && !dashboard ? (
          <DashboardSkeleton />
        ) : dashboard ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Products"
                value={String(dashboard.totalProducts)}
                icon={Package}
              />
              <StatCard
                title="Stock Value"
                value={formatCurrency(dashboard.totalStockValue)}
                icon={IndianRupee}
                variant="success"
              />
              <StatCard
                title="Low Stock Alerts"
                value={String(dashboard.lowStockCount)}
                subtitle="Items at or below threshold"
                icon={AlertTriangle}
                variant="warning"
              />
              <StatCard
                title="Recent Movements"
                value={String(dashboard.recentActivity.length)}
                subtitle="Latest inventory events"
                icon={TrendingUp}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Stock movement (7 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <StockTrendChart data={dashboard.stockTrend} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Value by category</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryChart data={dashboard.categoryBreakdown} />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Low stock warnings</CardTitle>
                  <Link
                    href="/products"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View all
                  </Link>
                </CardHeader>
                <CardContent>
                  {dashboard.lowStockProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      All products are above threshold.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {dashboard.lowStockProducts.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                        >
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku}</p>
                          </div>
                          <Badge variant="warning">
                            {p.quantity} / {p.lowStockThreshold}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard.recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {dashboard.recentActivity.map((entry) => (
                        <li
                          key={entry.id}
                          className="flex items-start justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                        >
                          <div>
                            <p className="text-sm font-medium">{entry.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.type.replace("_", " ")} · qty {entry.quantity}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatDate(entry.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Configure Google Sheets credentials in .env.local to load data.
          </p>
        )}
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}
