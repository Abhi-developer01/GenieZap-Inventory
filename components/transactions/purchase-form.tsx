"use client";

import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
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
import type { Product } from "@/lib/types";
import { purchaseSchema } from "@/lib/validations";
import type { z } from "zod";

type FormValues = z.infer<typeof purchaseSchema>;

export function PurchaseForm({
  products,
  onSubmit,
}: {
  products: Product[];
  onSubmit: (data: FormValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      productId: "",
      supplier: "",
      quantity: 1,
      unitCost: 0,
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  const productId = watch("productId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Product" error={errors.productId?.message}>
        <Select value={productId} onValueChange={(v) => setValue("productId", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} — {p.quantity} in stock
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Supplier" error={errors.supplier?.message}>
        <Input {...register("supplier")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Quantity" error={errors.quantity?.message}>
          <Input type="number" min={1} {...register("quantity", { valueAsNumber: true })} />
        </Field>
        <Field label="Unit cost ($)" error={errors.unitCost?.message}>
          <Input type="number" step="0.01" {...register("unitCost", { valueAsNumber: true })} />
        </Field>
        <Field label="Date" error={errors.date?.message}>
          <Input type="date" {...register("date")} />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea {...register("notes")} placeholder="Optional" />
      </Field>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Saving..." : "Save purchase"}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
