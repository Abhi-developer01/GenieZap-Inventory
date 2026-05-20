import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { adjustProductStock, getProductById } from "@/lib/google-sheets";
import { parseApiBody, stockMovementSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, quantity, notes } = parseApiBody(stockMovementSchema, body);
    const product = await getProductById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (product.quantity < quantity) {
      return NextResponse.json(
        { error: "Insufficient stock" },
        { status: 400 },
      );
    }
    const updated = await adjustProductStock(
      productId,
      -quantity,
      "stock_out",
      notes ?? "Manual stock out",
    );
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
