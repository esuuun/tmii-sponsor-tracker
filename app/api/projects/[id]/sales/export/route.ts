import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import ExcelJS from "exceljs";

const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type PC = Partial<ExcelJS.Color>;

const C = {
  blueHeader:   { argb: "FF2563EB" } as PC,
  blueLight:    { argb: "FFDBEAFE" } as PC,
  white:        { argb: "FFFFFFFF" } as PC,
  slate50:      { argb: "FFF8FAFC" } as PC,
  text:         { argb: "FF0F172A" } as PC,
  textMuted:    { argb: "FF64748B" } as PC,
  textWhite:    { argb: "FFFFFFFF" } as PC,
  border:       { argb: "FFE2E8F0" } as PC,
};

function setBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top:    { style: "thin", color: C.border },
    left:   { style: "thin", color: C.border },
    bottom: { style: "thin", color: C.border },
    right:  { style: "thin", color: C.border },
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);
    if (isNaN(year)) return NextResponse.json({ error: "Invalid year parameter." }, { status: 400 });

    const [projectRes, allSalesRes, yearSalesRes] = await Promise.all([
      supabase.from("projects").select("name").eq("id", projectId).single(),
      supabase.from("project_sales").select("item_name, price").eq("project_id", projectId),
      supabase.from("project_sales").select("*").eq("project_id", projectId).eq("year", year),
    ]);

    if (projectRes.error) throw new Error(projectRes.error.message);
    if (allSalesRes.error) throw new Error(allSalesRes.error.message);
    if (yearSalesRes.error) throw new Error(yearSalesRes.error.message);

    const projectName = projectRes.data?.name ?? "Project";

    // Master item list (sorted)
    const allItemNames = Array.from(
      new Set((allSalesRes.data ?? []).map((s: any) => s.item_name))
    ).sort() as string[];

    // Price map: item_name → price (use latest non-zero)
    const priceMap: Record<string, number> = {};
    for (const s of (allSalesRes.data ?? [])) {
      if (s.price && !priceMap[s.item_name]) priceMap[s.item_name] = s.price;
    }
    // Also pick up from yearSales (may have been updated more recently)
    for (const s of (yearSalesRes.data ?? [])) {
      if (s.price) priceMap[s.item_name] = s.price;
    }

    // Pivot: item → month → qty
    const pivot: Record<string, Record<string, number>> = {};
    for (const item of allItemNames) pivot[item] = {};
    for (const s of (yearSalesRes.data ?? [])) {
      if (!pivot[s.item_name]) pivot[s.item_name] = {};
      pivot[s.item_name][s.month] = s.sales_amount;
    }

    // ── Workbook ──────────────────────────────────────────────────────────────
    const wb = new ExcelJS.Workbook();
    wb.creator = "TMII Sponsorship Tracker";
    wb.created = new Date();

    const ws = wb.addWorksheet("Sales Matrix", {
      properties: { tabColor: { argb: "FF2563EB" } },
    });

    // Columns: Item Name | Price | Jan..Dec | Revenue
    // Col 1: Item Name, Col 2: Price, Col 3-14: months, Col 15: Revenue
    ws.getColumn(1).width = 28;  // Item Name
    ws.getColumn(2).width = 16;  // Price
    for (let c = 3; c <= 14; c++) ws.getColumn(c).width = 11; // months
    ws.getColumn(15).width = 18; // Revenue

    // ── Row 1: Title ──────────────────────────────────────────────────────────
    ws.getRow(1).height = 26;
    const titleCell = ws.getCell(1, 1);
    titleCell.value = `Sales Matrix — ${projectName} — ${year}`;
    titleCell.font = { bold: true, size: 14, color: C.text };
    titleCell.alignment = { vertical: "middle" };
    ws.mergeCells(1, 1, 1, 15);

    // ── Row 3: Headers ────────────────────────────────────────────────────────
    ws.getRow(3).height = 22;
    const headers = [
      "Item Name",
      "Price (Rp)",
      ...FULL_MONTHS.map(m => m.slice(0, 3).toUpperCase()),
      "Revenue (Rp)",
    ];
    headers.forEach((h, i) => {
      const cell = ws.getCell(3, i + 1);
      cell.value = h;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: C.blueHeader };
      cell.font = { bold: true, size: 10, color: C.textWhite };
      cell.alignment = { horizontal: i === 0 ? "left" : "right", vertical: "middle" };
      setBorder(cell);
    });

    // ── Data rows ─────────────────────────────────────────────────────────────
    let dataRow = 4;
    const colQtyTotals = new Array(12).fill(0);
    let grandRevenue = 0;

    for (const itemName of allItemNames) {
      ws.getRow(dataRow).height = 20;
      const price = priceMap[itemName] ?? 0;
      const rowBg = dataRow % 2 === 0 ? C.white : C.slate50;
      let rowRevenue = 0;

      // Item Name
      const nameCell = ws.getCell(dataRow, 1);
      nameCell.value = itemName;
      nameCell.font = { bold: true, size: 10, color: C.text };
      nameCell.alignment = { horizontal: "left", vertical: "middle" };
      nameCell.fill = { type: "pattern", pattern: "solid", fgColor: rowBg };
      setBorder(nameCell);

      // Price
      const priceCell = ws.getCell(dataRow, 2);
      priceCell.value = price || null;
      priceCell.numFmt = '"Rp "#,##0';
      priceCell.font = { size: 10, color: C.text };
      priceCell.alignment = { horizontal: "right", vertical: "middle" };
      priceCell.fill = { type: "pattern", pattern: "solid", fgColor: rowBg };
      setBorder(priceCell);

      // Month qty cells
      FULL_MONTHS.forEach((month, mi) => {
        const qty = pivot[itemName]?.[month] ?? 0;
        rowRevenue += qty * price;
        colQtyTotals[mi] += qty;

        const cell = ws.getCell(dataRow, mi + 3);
        cell.value = qty || null;
        cell.numFmt = "#,##0";
        cell.font = { size: 10, color: C.text };
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: rowBg };
        setBorder(cell);
      });

      grandRevenue += rowRevenue;

      // Revenue = qty × price
      const revCell = ws.getCell(dataRow, 15);
      revCell.value = rowRevenue || null;
      revCell.numFmt = '"Rp "#,##0';
      revCell.font = { bold: true, size: 10, color: C.text };
      revCell.alignment = { horizontal: "right", vertical: "middle" };
      revCell.fill = { type: "pattern", pattern: "solid", fgColor: rowBg };
      setBorder(revCell);

      dataRow++;
    }

    // ── Totals row ────────────────────────────────────────────────────────────
    ws.getRow(dataRow).height = 22;

    const totalLabelCell = ws.getCell(dataRow, 1);
    totalLabelCell.value = "TOTAL QTY";
    totalLabelCell.font = { bold: true, size: 10, color: C.text };
    totalLabelCell.alignment = { horizontal: "left", vertical: "middle" };
    totalLabelCell.fill = { type: "pattern", pattern: "solid", fgColor: C.blueLight };
    setBorder(totalLabelCell);

    // Price cell blank in totals row
    const totalPriceCell = ws.getCell(dataRow, 2);
    totalPriceCell.fill = { type: "pattern", pattern: "solid", fgColor: C.blueLight };
    setBorder(totalPriceCell);

    colQtyTotals.forEach((qty, mi) => {
      const cell = ws.getCell(dataRow, mi + 3);
      cell.value = qty || null;
      cell.numFmt = "#,##0";
      cell.font = { bold: true, size: 10, color: C.text };
      cell.alignment = { horizontal: "right", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: C.blueLight };
      setBorder(cell);
    });

    const grandRevCell = ws.getCell(dataRow, 15);
    grandRevCell.value = grandRevenue || null;
    grandRevCell.numFmt = '"Rp "#,##0';
    grandRevCell.font = { bold: true, size: 11, color: C.blueHeader };
    grandRevCell.alignment = { horizontal: "right", vertical: "middle" };
    grandRevCell.fill = { type: "pattern", pattern: "solid", fgColor: C.blueLight };
    setBorder(grandRevCell);

    dataRow++;

    // ── Stats section ─────────────────────────────────────────────────────────
    dataRow++;
    const bestMonthIdx = colQtyTotals.indexOf(Math.max(...colQtyTotals));
    const bestMonth = FULL_MONTHS[bestMonthIdx] ?? "-";

    const stats: [string, string | number][] = [
      ["Total Items", allItemNames.length],
      ["Total Revenue", `Rp ${grandRevenue.toLocaleString("en-US")}`],
      ["Best Month", bestMonth],
    ];

    for (const [label, val] of stats) {
      ws.getRow(dataRow).height = 18;
      const lCell = ws.getCell(dataRow, 1);
      lCell.value = label;
      lCell.font = { bold: true, size: 10, color: C.textMuted };
      lCell.alignment = { horizontal: "left", vertical: "middle" };

      const vCell = ws.getCell(dataRow, 2);
      vCell.value = val;
      vCell.font = { bold: true, size: 10, color: C.text };
      vCell.alignment = { horizontal: "left", vertical: "middle" };
      dataRow++;
    }

    ws.views = [{ state: "frozen", xSplit: 1, ySplit: 3 }];

    const buffer = await wb.xlsx.writeBuffer();
    const safeProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, "-");
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Sales-Matrix-${safeProjectName}-${year}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Export failed." }, { status: 500 });
  }
}
