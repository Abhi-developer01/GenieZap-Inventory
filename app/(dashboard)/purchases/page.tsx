"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { PurchaseForm } from "@/components/transactions/purchase-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatCurrency } from "@/lib/utils";
import { useInventoryStore } from "@/store/use-inventory-store";
import type { z } from "zod";
import { purchaseSchema } from "@/lib/validations";

type FormValues = z.infer<typeof purchaseSchema>;

export default function PurchasesPage() {
  const { purchases, products, fetchPurchases, fetchProducts, refreshAll } =
    useInventoryStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchPurchases();
    fetchProducts();
  }, [fetchPurchases, fetchProducts]);

  const onSubmit = async (data: FormValues) => {
    try {
      await api.purchases.create(data);
      toast.success("Purchase recorded");
      setOpen(false);
      await refreshAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save purchase");
    }
  };

  return (
    <>
      <Navbar
        title="Purchases"
        description="Record incoming stock from suppliers"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            New Purchase
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        {purchases.length === 0 ? (
          <EmptyState
            title="No purchases yet"
            description="Record your first purchase to increase stock."
            action={<Button onClick={() => setOpen(true)}>New Purchase</Button>}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit cost</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.date}</TableCell>
                    <TableCell className="font-medium">{p.productName}</TableCell>
                    <TableCell>{p.supplier}</TableCell>
                    <TableCell>{p.quantity}</TableCell>
                    <TableCell>{formatCurrency(p.unitCost)}</TableCell>
                    <TableCell>{formatCurrency(p.totalCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Purchase</DialogTitle>
          </DialogHeader>
          <Card className="border-0 shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="sr-only">Form</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PurchaseForm products={products} onSubmit={onSubmit} />
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}
