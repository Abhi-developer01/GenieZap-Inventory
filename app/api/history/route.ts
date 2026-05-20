import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { getInventoryHistory } from "@/lib/google-sheets";

export async function GET() {
  try {
    const history = await getInventoryHistory();
    return NextResponse.json(history);
  } catch (error) {
    return handleApiError(error);
  }
}
