"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Barcode, Plus, ScanLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Product } from "@/lib/types";
import type { BulkSaleInput } from "@/lib/validations";
import { findProductByCode } from "@/lib/product-lookup";
import { formatCurrency } from "@/lib/utils";

export type CartLine = {
  productId: string;
  name: string;
  sku: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  stock: number;
};

type Props = {
  products: Product[];
  onSubmit: (data: BulkSaleInput) => Promise<void>;
};

export function MultiSaleForm({ products, onSubmit }: Props) {
  const barcodeRef = useRef<HTMLInputElement>(null);
  const [barcode, setBarcode] = useState("");
  const [manualProductId, setManualProductId] = useState("");
  const [customer, setCustomer] = useState("");
  const [mobile, setMobile] = useState<number | "">("");
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  const grandTotal = useMemo(
    () => lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0),
    [lines],
  );

  const addProduct = useCallback(
    (product: Product, qty = 1) => {
      if (product.quantity <= 0) {
        toast.error(`${product.name} is out of stock`);
        return;
      }

      setLines((prev) => {
        const idx = prev.findIndex((l) => l.productId === product.id);
        if (idx >= 0) {
          const next = [...prev];
          const line = next[idx];
          const newQty = line.quantity + qty;
          if (newQty > product.quantity) {
            toast.error(`Only ${product.quantity} in stock for ${product.name}`);
            return prev;
          }
          next[idx] = { ...line, quantity: newQty };
          return next;
        }
        if (qty > product.quantity) {
          toast.error(`Only ${product.quantity} in stock for ${product.name}`);
          return prev;
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            // sku: product.sku,
            // barcode: product.barcode,
              sku: product.sku || "",
            barcode: String(product.barcode),
            quantity: qty,
            unitPrice: product.price,
            stock: product.quantity,
          },
        ];
      });
    },
    [],
  );

  const scanBarcode = () => {
    const product = findProductByCode(products, barcode);
    if (!product) {
      toast.error(`No product found for "${barcode.trim()}"`);
      setBarcode("");
      return;
    }
    addProduct(product, 1);
    setBarcode("");
    toast.success(`Added ${product.name}`);
    barcodeRef.current?.focus();
  };

  const handleManualAdd = () => {
    const product = products.find((p) => p.id === manualProductId);
    if (!product) {
      toast.error("Select a product");
      return;
    }
    addProduct(product, 1);
    setManualProductId("");
  };

  const updateLine = (
    productId: string,
    field: "quantity" | "unitPrice",
    value: number,
  ) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.productId !== productId) return l;
        if (field === "quantity") {
          const q = Math.max(1, Math.floor(value));
          if (q > l.stock) {
            toast.error(`Max stock: ${l.stock}`);
            return l;
          }
          return { ...l, quantity: q };
        }
        return { ...l, unitPrice: Math.max(0, value) };
      }),
    );
  };

  const removeLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (lines.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        customer: customer.trim(),
        mobile: mobile === "" ? undefined : mobile,
        date,
        notes: notes.trim() || undefined,
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });
      setLines([]);
      setCustomer("");
      setMobile("");
      setNotes("");
      setBarcode("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleCheckout} className="space-y-5">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <Label htmlFor="barcode" className="flex items-center gap-2 text-primary">
          <ScanLine className="h-4 w-4" />
          Scan barcode
        </Label>
        <p className="mb-2 text-xs text-muted-foreground">
          Focus this field and scan with your barcode scanner, or type barcode / SKU
          and press Enter.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="barcode"
              ref={barcodeRef}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  scanBarcode();
                }
              }}
              placeholder="Scan or enter barcode / SKU"
              className="pl-9"
              autoComplete="off"
            />
          </div>
          <Button type="button" variant="secondary" onClick={scanBarcode}>
            Add
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={manualProductId} onValueChange={setManualProductId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Or pick a product manually" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
                {p.barcode ? ` · ${p.barcode}` : ""} — {p.quantity} in stock
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={handleManualAdd}>
          <Plus className="h-4 w-4" />
          Add line
        </Button>
      </div>

      {lines.length > 0 ? (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="w-24">Qty</TableHead>
                <TableHead className="w-28">Price</TableHead>
                <TableHead className="text-right">Line total</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.productId}>
                  <TableCell>
                    <p className="font-medium">{line.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {line.barcode || line.sku}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      max={line.stock}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(
                          line.productId,
                          "quantity",
                          Number(e.target.value),
                        )
                      }
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLine(
                          line.productId,
                          "unitPrice",
                          Number(e.target.value),
                        )
                      }
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(line.quantity * line.unitPrice)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(line.productId)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <Badge variant="secondary">{lines.length} item(s)</Badge>
            <p className="text-lg font-semibold">
              Total: {formatCurrency(grandTotal)}
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Scan a barcode or add products to build the sale.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="customer">Customer *</Label>
          <Input
            id="customer"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Walk-in customer"
            required
          />
        </div>
        <div>
          <Label htmlFor="mobile">Mobile</Label>
          <Input
            id="mobile"
            type="number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Optional"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="sale-date">Date</Label>
        <Input
          id="sale-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="sale-notes">Notes</Label>
        <Textarea
          id="sale-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
          rows={2}
        />
      </div>

      <Button
        type="submit"
        disabled={submitting || lines.length === 0}
        className="w-full"
      >
        {submitting
          ? "Processing..."
          : `Complete sale (${lines.length} item${lines.length === 1 ? "" : "s"})`}
      </Button>
    </form>
  );
}
