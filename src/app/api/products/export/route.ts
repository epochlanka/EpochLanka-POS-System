import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { productBulkService } from "@/services/productBulk.service";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const csv = await productBulkService.exportToCsv();

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
