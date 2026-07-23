import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { parseCsvWithHeader } from "@/lib/csv";
import { productBulkService } from "@/services/productBulk.service";

const MAX_ROWS = 5000;

export async function POST(request: NextRequest) {
  const auth = await requirePermission("products.create");
  if (auth instanceof NextResponse) return auth;

  const csvText = await request.text();
  if (!csvText || !csvText.trim()) {
    return NextResponse.json({ error: "Request body must be CSV text." }, { status: 400 });
  }

  const rows = parseCsvWithHeader(csvText);
  if (rows.length === 0) {
    return NextResponse.json({ error: "No data rows found in the CSV." }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (max ${MAX_ROWS} per import). Split the file and try again.` },
      { status: 400 }
    );
  }

  const summary = await productBulkService.importRows(rows, auth.user.id);
  return NextResponse.json(summary);
}
