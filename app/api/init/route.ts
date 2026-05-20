import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { ensureSheetHeaders } from "@/lib/google-sheets";

export async function POST() {
  try {
    await ensureSheetHeaders();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
