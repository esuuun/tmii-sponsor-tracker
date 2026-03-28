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
  blueDark:     { argb: "FF1D4ED8" } as PC,
  blueLight:    { argb: "FFDBEAFE" } as PC,
  totalRow:     { argb: "FFEFF6FF" } as PC,
  white:        { argb: "FFFFFFFF" } as PC,
  slate50:      { argb: "FFF8FAFC" } as PC,
  slate100:     { argb: "FFF1F5F9" } as PC,
  text:         { argb: "FF0F172A" } as PC,
  textMuted:    { argb: "FF64748B" } as PC,
  textWhite:    { argb: "FFFFFFFF" } as PC,
  green:        { argb: "FF16A34A" } as PC,
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
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  // Fetch project name + all sales (all years for item list, year-specific for amounts)
  const [projectRes, allSalesRes, yearSalesRes] = await Promise.all([
    supabase.from("projects").select("name").eq("id", projectId).single(),
    supabase.from("project_sales").select("item_name").eq("project_id", projectId),
    supabase.from("project_sales").select("*").eq("project_id", projectId).eq("year", year),
  ]);

  if (projectRes.error) throw new Error(projectRes.error.message);
  if (allSalesRes.error) throw new Error(allSalesRes.error.message);
  if (yearSalesRes.error) throw new Error(yearSalesRes.error.message);

  const projectName = projectRes.data?.name ?? "Project";

  // Build item list (all items ever, sorted)
  const allItemNames = Array.from(
    new Set((allSalesRes.data ?? []).map((s: any) => s.item_name))
  ).sort() as string[];

  // Build pivot: item → month → amount
  const pivot: Record<string, Record<string, number>> = {};
  for (const item of allItemNames) pivot[item] = {};
  for (const s of (yearSalesRes.data ?? [])) {
    if (!pivot[s.item_name]) pivot[s.item_name] = {};
    pivot[s.item_name][s.month] = s.sales_amount;
  }

  // ── Build workbook ──────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = "TMII Sponsorship Tracker";
  wb.created = new Date();

  const ws = wb.addWorksheet("Sales Matrix", {
    properties: { tabColor: { argb: "FF2563EB" } },
  });

  // Column widths: Item Name (col 1) | 12 months (cols 2-13) | Total (col 14)
  ws.getColumn(1).width = 28; // Item Name
  for (let c = 2; c <= 13; c++) ws.getColumn(c).width = 12; // months
  ws.getColumn(14).width = 14; // Total

  // ── Row 1: Title ────────────────────────────────────────────────────────────
  ws.getRow(1).height = 26;
  const titleCell = ws.getCell(1, 1);
  titleCell.value = `Sales Matrix — ${projectName} — ${year}`;
  titleCell.font = { bold: true, size: 14, color: C.text };
  titleCell.alignment = { vertical: "middle" };
  ws.mergeCells(1, 1, 1, 14);

  // ── Row 3: Column headers ────────────────────────────────────────────────────
  ws.getRow(3).height = 22;
  const headers = ["Item Name", ...FULL_MONTHS.map(m => m.slice(0, 3).toUpperCase()), "TOTAL"];
  headers.forEach((h, i) => {
    const cell = ws.getCell(3, i + 1);
    cell.value = h;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: C.blueHeader };
    cell.font = { bold: true, size: 10, color: C.textWhite };
    cell.alignment = {
      horizontal: i === 0 ? "left" : "right",
      vertical: "middle",
    };
    setBorder(cell);
  });

  // ── Rows 4+: Data rows ───────────────────────────────────────────────────────
  let dataRow = 4;
  const colTotals = new Array(12).fill(0);
  let grandTotal = 0;

  for (const itemName of allItemNames) {
    ws.getRow(dataRow).height = 20;
    let rowTotal = 0;

    // Item name cell
    const nameCell = ws.getCell(dataRow, 1);
    nameCell.value = itemName;
    nameCell.font = { bold: true, size: 10, color: C.text };
    nameCell.alignment = { horizontal: "left", vertical: "middle" };
    nameCell.fill = { type: "pattern", pattern: "solid", fgColor: dataRow % 2 === 0 ? C.white : C.slate50 };
    setBorder(nameCell);

    // Month cells
    FULL_MONTHS.forEach((month, mi) => {
      const amt = pivot[itemName]?.[month] ?? 0;
      rowTotal += amt;
      colTotals[mi] += amt;

      const cell = ws.getCell(dataRow, mi + 2);
      cell.value = amt || null;
      cell.numFmt = "#,##0";
      cell.font = { size: 10, color: C.text };
      cell.alignment = { horizontal: "right", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: dataRow % 2 === 0 ? C.white : C.slate50 };
      setBorder(cell);
    });

    grandTotal += rowTotal;

    // Row total cell
    const totalCell = ws.getCell(dataRow, 14);
    totalCell.value = rowTotal || null;
    totalCell.numFmt = "#,##0";
    totalCell.font = { bold: true, size: 10, color: C.text };
    totalCell.alignment = { horizontal: "right", vertical: "middle" };
    totalCell.fill = { type: "pattern", pattern: "solid", fgColor: dataRow % 2 === 0 ? C.white : C.slate50 };
    setBorder(totalCell);

    dataRow++;
  }

  // ── Totals row ───────────────────────────────────────────────────────────────
  ws.getRow(dataRow).height = 22;

  const totalLabelCell = ws.getCell(dataRow, 1);
  totalLabelCell.value = "TOTAL";
  totalLabelCell.font = { bold: true, size: 10, color: C.text };
  totalLabelCell.alignment = { horizontal: "left", vertical: "middle" };
  totalLabelCell.fill = { type: "pattern", pattern: "solid", fgColor: C.blueLight };
  setBorder(totalLabelCell);

  colTotals.forEach((amt, mi) => {
    const cell = ws.getCell(dataRow, mi + 2);
    cell.value = amt || null;
    cell.numFmt = "#,##0";
    cell.font = { bold: true, size: 10, color: C.text };
    cell.alignment = { horizontal: "right", vertical: "middle" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: C.blueLight };
    setBorder(cell);
  });

  const grandTotalCell = ws.getCell(dataRow, 14);
  grandTotalCell.value = grandTotal || null;
  grandTotalCell.numFmt = "#,##0";
  grandTotalCell.font = { bold: true, size: 11, color: C.blueHeader };
  grandTotalCell.alignment = { horizontal: "right", vertical: "middle" };
  grandTotalCell.fill = { type: "pattern", pattern: "solid", fgColor: C.blueLight };
  setBorder(grandTotalCell);

  dataRow++;

  // ── Stats section ────────────────────────────────────────────────────────────
  dataRow++; // blank row

  const bestMonthIdx = colTotals.indexOf(Math.max(...colTotals));
  const bestMonth = FULL_MONTHS[bestMonthIdx] ?? "-";

  const stats = [
    ["Total Items", allItemNames.length.toLocaleString("en-US")],
    ["Grand Total", grandTotal.toLocaleString("en-US")],
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

  // Freeze header row
  ws.views = [{ state: "frozen", xSplit: 1, ySplit: 3 }];

  // ── Write buffer ─────────────────────────────────────────────────────────────
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
