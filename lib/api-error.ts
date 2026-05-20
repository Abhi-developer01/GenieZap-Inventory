import { NextResponse } from "next/server";

export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  console.error(error);
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";
  return apiError(message, message.includes("not found") ? 404 : 500);
}
