import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { createPurchase, getAllPurchases } from "@/lib/google-sheets";
import { parseApiBody, purchaseSchema } from "@/lib/validations";

export async function GET() {
  try {
    const purchases = await getAllPurchases();
    return NextResponse.json(purchases);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseApiBody(purchaseSchema, body);
    const purchase = await createPurchase({
      productId: parsed.productId,
      supplier: parsed.supplier,
      quantity: parsed.quantity,
      unitCost: parsed.unitCost,
      date: parsed.date,
      notes: parsed.notes ?? "",
    });
    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
