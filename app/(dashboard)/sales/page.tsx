"use client";

import { useEffect, useState, useMemo, Fragment } from "react";
import { toast } from "sonner";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { MultiSaleForm } from "@/components/transactions/multi-sale-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api-client";
import type { BulkSaleInput } from "@/lib/validations";
import type { Sale } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useInventoryStore } from "@/store/use-inventory-store";

type OrderGroup = {
  orderRef: string;
  customer: string;
  mobile: number | null;
  date: string;
  items: Sale[];
  totalAmount: number;
  totalQty: number;
};

export default function SalesPage() {
  const { sales, products, fetchSales, fetchProducts, refreshAll } =
    useInventoryStore();
  const [open, setOpen] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, [fetchSales, fetchProducts]);

  const onSubmit = async (data: BulkSaleInput) => {
    try {
      const result = await api.sales.createBatch(data);
      toast.success(
        `Sale recorded — ${result.count} line${result.count === 1 ? "" : "s"}`,
      );
      setOpen(false);
      await refreshAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save sale");
    }
  };

  const orderGroups = useMemo(() => {
    const groups = new Map<string, OrderGroup>();

    sales.forEach((sale) => {
      const orderMatch = sale.notes?.match(/Order ([A-Z0-9]+)/);
      const orderRef = orderMatch ? orderMatch[1] : sale.id.slice(0, 8).toUpperCase();

      if (!groups.has(orderRef)) {
        groups.set(orderRef, {
          orderRef,
          customer: sale.customer,
          mobile: sale.mobile,
          date: sale.date,
          items: [],
          totalAmount: 0,
          totalQty: 0,
        });
      }

      const group = groups.get(orderRef)!;
      group.items.push(sale);
      group.totalAmount += sale.totalPrice;
      group.totalQty += sale.quantity;
    });

    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [sales]);

  const toggleOrder = (orderRef: string) => {
    setExpandedOrders((prev) => {
      if (prev.has(orderRef)) {
        return new Set();
      } else {
        return new Set([orderRef]);
      }
    });
  };

  return (
    <>
      <Navbar
        title="Sales"
        description="Scan barcodes or add multiple items per sale"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            New Sale
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        {sales.length === 0 ? (
          <EmptyState
            title="No sales yet"
            description="Record your first sale to track revenue."
            action={<Button onClick={() => setOpen(true)}>New Sale</Button>}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderGroups.map((group: OrderGroup) => {
                  const isExpanded = expandedOrders.has(group.orderRef);
                  return (
                    <Fragment key={group.orderRef}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleOrder(group.orderRef)}
                      >
                        <TableCell>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{group.orderRef}</TableCell>
                        <TableCell>{group.date}</TableCell>
                        <TableCell>{group.customer}</TableCell>
                        <TableCell>{group.mobile ? String(group.mobile) : "—"}</TableCell>
                        <TableCell>{group.totalQty}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(group.totalAmount)}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="p-0">
                            <div className="rounded-lg border border-border m-2 bg-muted/30">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Unit Price</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Notes</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {group.items.map((item: Sale) => (
                                    <TableRow key={item.id}>
                                      <TableCell className="font-medium">
                                        {item.productName}
                                      </TableCell>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                      <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
                                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                        {item.notes || "—"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Sale</DialogTitle>
          </DialogHeader>
          <Card className="border-0 shadow-none">
            <CardContent className="p-0 pt-2">
              <MultiSaleForm products={products} onSubmit={onSubmit} />
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}
