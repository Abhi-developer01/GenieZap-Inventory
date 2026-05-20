"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useInventoryStore } from "@/store/use-inventory-store";
import { formatDate } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  stock_in: "Stock In",
  stock_out: "Stock Out",
  adjustment: "Adjustment",
  purchase: "Purchase",
  sale: "Sale",
};

const typeVariants: Record<string, "default" | "secondary" | "destructive" | "outline" | "warning" | "success"> = {
  stock_in: "success",
  stock_out: "destructive",
  adjustment: "warning",
  purchase: "success",
  sale: "secondary",
};

export default function HistoryPage() {
  const { history, loading, fetchHistory } = useInventoryStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filtered = useMemo(() => {
    return history.filter((h) => {
      const matchSearch =
        !search ||
        h.productName.toLowerCase().includes(search.toLowerCase()) ||
        h.notes.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || h.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [history, search, typeFilter]);

  return (
    <>
      <Navbar
        title="Inventory History"
        description="Complete log of stock movements"
      />
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search product or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(typeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && history.length === 0 ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No history yet"
            description="Stock movements will appear here."
          />
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Before → After</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.productName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeVariants[entry.type] ?? "outline"}>
                        {typeLabels[entry.type] ?? entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.quantity}</TableCell>
                    <TableCell>
                      {entry.previousQty} → {entry.newQty}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {entry.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
