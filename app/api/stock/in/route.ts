import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { adjustProductStock } from "@/lib/google-sheets";
import { parseApiBody, stockMovementSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, quantity, notes } = parseApiBody(stockMovementSchema, body);
    const updated = await adjustProductStock(
      productId,
      quantity,
      "stock_in",
      notes ?? "Manual stock in",
    );
    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
