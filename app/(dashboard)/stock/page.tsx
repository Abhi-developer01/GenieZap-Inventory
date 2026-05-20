"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowUpFromLine, Barcode } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api-client";
import { stockMovementSchema } from "@/lib/validations";
import { useInventoryStore } from "@/store/use-inventory-store";
import { findProductByCode } from "@/lib/product-lookup";
import type { Product } from "@/lib/types";
import type { z } from "zod";

type FormValues = z.infer<typeof stockMovementSchema>;

export default function StockPage() {
  const { products, fetchProducts, refreshAll } = useInventoryStore();
  const [tab, setTab] = useState<"in" | "out">("in");

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const formIn = useForm<FormValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: { productId: "", quantity: 1, notes: "" },
  });

  const formOut = useForm<FormValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: { productId: "", quantity: 1, notes: "" },
  });

  const submit = async (data: FormValues, type: "in" | "out") => {
    try {
      if (type === "in") {
        await api.stock.in(data);
        toast.success("Stock added successfully");
        formIn.reset({ productId: "", quantity: 1, notes: "" });
      } else {
        await api.stock.out(data);
        toast.success("Stock removed successfully");
        formOut.reset({ productId: "", quantity: 1, notes: "" });
      }
      await refreshAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Stock update failed");
    }
  };

  return (
    <>
      <Navbar
        title="Stock In / Out"
        description="Record manual inventory adjustments"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "in" | "out")}>
          <TabsList>
            <TabsTrigger value="in" className="gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              Stock In
            </TabsTrigger>
            <TabsTrigger value="out" className="gap-2">
              <ArrowUpFromLine className="h-4 w-4" />
              Stock Out
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in" className="mt-6 max-w-lg">
            <StockForm
              products={products}
              form={formIn}
              onSubmit={(d) => submit(d, "in")}
              submitLabel="Record Stock In"
              variant="in"
            />
          </TabsContent>

          <TabsContent value="out" className="mt-6 max-w-lg">
            <StockForm
              products={products}
              form={formOut}
              onSubmit={(d) => submit(d, "out")}
              submitLabel="Record Stock Out"
              variant="out"
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function StockForm({
  products,
  form,
  onSubmit,
  submitLabel,
  variant,
}: {
  products: Product[];
  form: ReturnType<typeof useForm<FormValues>>;
  onSubmit: (data: FormValues) => void;
  submitLabel: string;
  variant: "in" | "out";
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;
  const productId = watch("productId");
  const [inputMode, setInputMode] = useState<"dropdown" | "barcode">("dropdown");
  const [barcodeInput, setBarcodeInput] = useState("");
  const selected = products.find((p) => p.id === productId);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const handleBarcodeLookup = () => {
    const product = findProductByCode(products, barcodeInput);
    if (product) {
      setValue("productId", product.id);
      toast.success(`Found: ${product.name}`);
      setBarcodeInput("");
    } else {
      toast.error("Product not found with this barcode/SKU");
    }
  };

  const handleModeChange = (mode: "dropdown" | "barcode") => {
    setInputMode(mode);
    setBarcodeInput("");
    if (mode === "barcode") {
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {variant === "in" ? (
            <ArrowDownToLine className="h-5 w-5 text-primary" />
          ) : (
            <ArrowUpFromLine className="h-5 w-5 text-destructive" />
          )}
          {submitLabel}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                type="button"
                variant={inputMode === "dropdown" ? "default" : "outline"}
                size="sm"
                onClick={() => handleModeChange("dropdown")}
              >
                Select Product
              </Button>
              <Button
                type="button"
                variant={inputMode === "barcode" ? "default" : "outline"}
                size="sm"
                onClick={() => handleModeChange("barcode")}
              >
                <Barcode className="h-4 w-4 mr-1" />
                Scan Barcode
              </Button>
            </div>

            {inputMode === "dropdown" ? (
              <Select
                value={productId}
                onValueChange={(v) => setValue("productId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — {p.quantity} in stock
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2">
                <Input
                  ref={barcodeInputRef}
                  placeholder="Enter barcode or SKU..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleBarcodeLookup();
                    }
                  }}
                />
                <Button type="button" onClick={handleBarcodeLookup}>
                  Lookup
                </Button>
              </div>
            )}
            {errors.productId && (
              <p className="mt-1 text-xs text-destructive">
                {errors.productId.message}
              </p>
            )}
          </div>

          {selected && (
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">{selected.name}</p>
              <p className="text-sm text-muted-foreground">
                SKU: {selected.sku} | Barcode: {selected.barcode || "N/A"}
              </p>
              {variant === "out" && (
                <p className="text-sm text-muted-foreground mt-1">
                  Available: <strong>{selected.quantity}</strong> units
                </p>
              )}
            </div>
          )}

          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              min={1}
              {...register("quantity", { valueAsNumber: true })}
            />
            {errors.quantity && (
              <p className="mt-1 text-xs text-destructive">
                {errors.quantity.message}
              </p>
            )}
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea {...register("notes")} placeholder="Reason or reference" />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
