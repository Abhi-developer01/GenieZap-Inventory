import type { Product } from "@/lib/types";

/** Match by barcode first, then SKU (case-insensitive). */
export function findProductByCode(
  products: Product[],
  code: string,
): Product | undefined {
  const q = code.trim();
  if (!q) return undefined;

  const barcodeNum = Number(q);
  if (!isNaN(barcodeNum)) {
    const byBarcode = products.find((p) => p.barcode === barcodeNum);
    if (byBarcode) return byBarcode;
  }

  const lower = q.toLowerCase();
  return products.find((p) => p.sku?.trim().toLowerCase() === lower);
}
