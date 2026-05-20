import { NextResponse } from "next/server";
import { computeDashboardStats } from "@/lib/dashboard-stats";
import { handleApiError } from "@/lib/api-error";
import {
  getAllProducts,
  getInventoryHistory,
} from "@/lib/google-sheets";

export async function GET() {
  try {
    const [products, history] = await Promise.all([
      getAllProducts(),
      getInventoryHistory(),
    ]);
    const stats = computeDashboardStats(products, history);
    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
