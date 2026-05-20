"use client";

import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { api } from "@/lib/api-client";
import { productSchema, type ProductFormValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInventoryStore } from "@/store/use-inventory-store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
};

export function ProductFormDialog({ open, onOpenChange, product }: Props) {
  const refreshAll = useInventoryStore((s) => s.refreshAll);
  const isEdit = Boolean(product);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: "",
      quantity: 0,
      price: 0,
      barcode: 0,
      image: "",
      lowStockThreshold: 5,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        category: product.category,
        quantity: product.quantity,
        price: product.price,
        barcode: product.barcode,
        image: product.image,
        lowStockThreshold: product.lowStockThreshold,
      });
    } else {
      reset({
        name: "",
        sku: "",
        category: "",
        quantity: 0,
        price: 0,
        barcode: 0,
        image: "",
        lowStockThreshold: 5,
      });
    }
  }, [product, reset, open]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      if (isEdit && product) {
        await api.products.update(product.id, data);
        toast.success("Product updated");
      } else {
        await api.products.create(data);
        toast.success("Product created");
      }
      await refreshAll();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save product");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name?.message}>
              <Input {...register("name")} placeholder="Product name" />
            </Field>
            <Field label="SKU" error={errors.sku?.message}>
              <Input {...register("sku")} placeholder="SKU-001" />
            </Field>
            <Field label="Category" error={errors.category?.message}>
              <Input {...register("category")} placeholder="Electronics" />
            </Field>
            <Field label="Barcode" error={errors.barcode?.message}>
              <Input
                type="number"
                {...register("barcode", {
                  valueAsNumber: true,
                  setValueAs: (v) => (v === "" ? 0 : Number(v)),
                })}
                placeholder="Required"
              />
            </Field>
            <Field label="Quantity" error={errors.quantity?.message}>
              <Input
                type="number"
                {...register("quantity", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Price ($)" error={errors.price?.message}>
              <Input
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Low stock threshold" error={errors.lowStockThreshold?.message}>
              <Input
                type="number"
                {...register("lowStockThreshold", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Image URL" error={errors.image?.message} className="sm:col-span-2">
              <Input {...register("image")} placeholder="https://..." />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
