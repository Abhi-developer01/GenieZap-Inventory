import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().nullable().optional(),
  category: z.string().min(1, "Category is required"),
  quantity: z.number().int().min(0),
  price: z.number().min(0),
  barcode: z.number().min(1, "Barcode is required"),
  image: z
    .string()
    .refine((v) => !v || /^https?:\/\//.test(v), "Must be a valid URL"),
  lowStockThreshold: z.number().int().min(0),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const stockMovementSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  notes: z.string().optional(),
});

export const purchaseSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  supplier: z.string().min(1, "Supplier is required"),
  quantity: z.number().int().positive(),
  unitCost: z.number().min(0),
  date: z.string().min(1),
  notes: z.string().optional(),
});

export const saleSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  customer: z.string().min(1, "Customer is required"),
  mobile: z.number().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
  date: z.string().min(1),
  notes: z.string().optional(),
});

export const saleLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
});

export const bulkSaleSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  mobile: z.number().optional(),
  date: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(saleLineSchema).min(1, "Add at least one item"),
});

export type BulkSaleInput = z.infer<typeof bulkSaleSchema>;

/** Parse API JSON bodies where numbers may arrive as strings */
export function parseApiBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const normalized =
    typeof body === "object" && body !== null
      ? Object.fromEntries(
          Object.entries(body as Record<string, unknown>).map(([k, v]) => [
            k,
            typeof v === "string" && v !== "" && !Number.isNaN(Number(v))
              ? Number(v)
              : v,
          ]),
        )
      : body;
  return schema.parse(normalized);
}
