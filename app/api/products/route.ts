import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { createProduct, getAllProducts } from "@/lib/google-sheets";
import { parseApiBody, productSchema } from "@/lib/validations";

export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json(products);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseApiBody(productSchema, body);
    const product = await createProduct({
      name: parsed.name,
      sku: parsed.sku ?? null,
      category: parsed.category,
      quantity: parsed.quantity,
      price: parsed.price,
      barcode: parsed.barcode ?? "",
      image: parsed.image ?? "",
      lowStockThreshold: parsed.lowStockThreshold,
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
