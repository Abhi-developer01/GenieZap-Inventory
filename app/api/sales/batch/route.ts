import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { createBulkSales } from "@/lib/google-sheets";
import { bulkSaleSchema, parseApiBody } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseApiBody(bulkSaleSchema, body);
    const sales = await createBulkSales({
      customer: parsed.customer,
      mobile: parsed.mobile,
      date: parsed.date,
      notes: parsed.notes,
      items: parsed.items,
    });
    return NextResponse.json({ sales, count: sales.length }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
