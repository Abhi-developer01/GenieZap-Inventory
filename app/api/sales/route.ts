import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { createSale, getAllSales } from "@/lib/google-sheets";
import { parseApiBody, saleSchema } from "@/lib/validations";

export async function GET() {
  try {
    const sales = await getAllSales();
    return NextResponse.json(sales);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseApiBody(saleSchema, body);
    const sale = await createSale({
      productId: parsed.productId,
      customer: parsed.customer,
      mobile: parsed.mobile ?? null,
      quantity: parsed.quantity,
      unitPrice: parsed.unitPrice,
      date: parsed.date,
      notes: parsed.notes ?? "",
    });
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
