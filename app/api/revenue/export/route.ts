import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import ExcelJS from "exceljs";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const QUARTERS = [
  { label: "Q1", months: [1, 2, 3] },
  { label: "Q2", months: [4, 5, 6] },
  { label: "Q3", months: [7, 8, 9] },
  { label: "Q4", months: [10, 11, 12] },
];

type MonthData = {
  rkap_target: number;
  carry_over_target: number;
  confirmed_amount: number;
  best_estimate: number;
};

// ─── Colors ──────────────────────────────────────────────────────────────────

const C = {
  tealHeader:   { argb: "FF00897B" },
  tealSubHeader:{ argb: "FF00695C" },
  tealLight:    { argb: "FFE0F2F1" },
  white:        { argb: "FFFFFFFF" },
  slateHeader:  { argb: "FF334155" },
  slateSubHeader:{ argb: "FF475569" },
  slateLight:   { argb: "FFF1F5F9" },
  darkHeader:   { argb: "FF1E293B" },
  green:        { argb: "FF16A34A" },
  red:          { argb: "FFDC2626" },
  amber:        { argb: "FFD97706" },
  text:         { argb: "FF1E293B" },
  textLight:    { argb: "FFE2E8F0" },
  border:       { argb: "FFE2E8F0" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(confirm: number, target: number): number | null {
  return target > 0 ? Math.round((confirm / target) * 100) : null;
}

function gap(confirm: number, target: number): number {
  return confirm - target;
}

type PC = Partial<ExcelJS.Color>;

function styleHeader(cell: ExcelJS.Cell, bgColor: PC, textColor: PC) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: bgColor };
  cell.font = { bold: true, color: textColor, size: 10 };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.border = {
    top: { style: "thin", color: C.border },
    left: { style: "thin", color: C.border },
    bottom: { style: "thin", color: C.border },
    right: { style: "thin", color: C.border },
  };
}

function styleDataCell(cell: ExcelJS.Cell, options: { bold?: boolean; color?: PC; align?: "left" | "center" | "right" } = {}) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: C.white };
  cell.font = { bold: options.bold ?? false, color: options.color ?? C.text, size: 10 };
  cell.alignment = { horizontal: options.align ?? "right", vertical: "middle" };
  cell.border = {
    top: { style: "thin", color: C.border },
    left: { style: "thin", color: C.border },
    bottom: { style: "thin", color: C.border },
    right: { style: "thin", color: C.border },
  };
  cell.numFmt = '#,##0';
}

// ─── Write one sheet (RKAP or Carry Over) ────────────────────────────────────

function writeSheet(
  sheet: ExcelJS.Worksheet,
  dataMap: Record<number, MonthData>,
  tab: "rkap" | "carry_over",
  year: number
) {
  const tabLabel = tab === "rkap" ? "RKAP" : "Carry Over";

  // Column widths: each month block = 5 cols (target/confirm/%/gap/best est),
  // with a 1-col gap between blocks. 3 months per row = 3*5 + 2 gaps = 17 cols
  // We use cols A-E for month1, G-K for month2, M-Q for month3 (col F and L are gaps)
  const COL_WIDTH = 14;
  const GAP_COL_WIDTH = 2;

  // Set column widths for 3 month groups (17 cols total)
  for (let g = 0; g < 3; g++) {
    const base = g * 6 + 1; // 1, 7, 13
    for (let c = 0; c < 5; c++) {
      sheet.getColumn(base + c).width = COL_WIDTH;
    }
    if (g < 2) sheet.getColumn(base + 5).width = GAP_COL_WIDTH; // gap col
  }

  // Title row
  sheet.getRow(1).height = 28;
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `Target Revenue — Sponsorship — ${year} (${tabLabel})`;
  titleCell.font = { bold: true, size: 14, color: C.text };
  titleCell.alignment = { vertical: "middle" };
  sheet.mergeCells(1, 1, 1, 17);

  let row = 3; // start content at row 3

  // ── Monthly blocks (4 quarters, each with 3 months) ──────────────────────

  for (const q of QUARTERS) {
    // Quarter label row
    sheet.getRow(row).height = 18;
    const qCell = sheet.getCell(row, 1);
    qCell.value = q.label;
    qCell.font = { bold: true, size: 11, color: { argb: "FF2563EB" } };
    qCell.alignment = { vertical: "middle" };
    sheet.mergeCells(row, 1, row, 17);
    row++;

    // Month header row
    sheet.getRow(row).height = 22;
    for (let i = 0; i < 3; i++) {
      const monthIdx = q.months[i] - 1;
      const col = i * 6 + 1;
      const cell = sheet.getCell(row, col);
      cell.value = MONTH_NAMES[monthIdx].toUpperCase();
      styleHeader(cell, C.tealHeader, C.white);
      sheet.mergeCells(row, col, row, col + 4);
    }
    row++;

    // Sub-header row (TARGET | CONFIRM | % | GAP | BEST EST.)
    sheet.getRow(row).height = 18;
    const subHeaders = ["TARGET", "CONFIRM", "%", "GAP", "BEST EST."];
    for (let i = 0; i < 3; i++) {
      const col = i * 6 + 1;
      for (let j = 0; j < 5; j++) {
        const cell = sheet.getCell(row, col + j);
        cell.value = subHeaders[j];
        styleHeader(cell, C.tealSubHeader, C.textLight);
        cell.font = { bold: true, size: 9, color: C.textLight };
      }
    }
    row++;

    // Data row
    sheet.getRow(row).height = 20;
    for (let i = 0; i < 3; i++) {
      const m = q.months[i];
      const d = dataMap[m] ?? { rkap_target: 0, carry_over_target: 0, confirmed_amount: 0, best_estimate: 0 };
      const target = tab === "rkap" ? d.rkap_target : d.carry_over_target;
      const confirm = d.confirmed_amount;
      const g = gap(confirm, target);
      const p = pct(confirm, target);
      const col = i * 6 + 1;

      // Target
      const cTarget = sheet.getCell(row, col);
      cTarget.value = target;
      styleDataCell(cTarget);

      // Confirm
      const cConfirm = sheet.getCell(row, col + 1);
      cConfirm.value = confirm;
      styleDataCell(cConfirm);

      // %
      const cPct = sheet.getCell(row, col + 2);
      cPct.value = p !== null ? p / 100 : null;
      cPct.fill = { type: "pattern", pattern: "solid", fgColor: C.white };
      cPct.font = {
        bold: true, size: 10,
        color: p === null ? C.border : p >= 100 ? C.green : p >= 75 ? C.amber : C.red,
      };
      cPct.alignment = { horizontal: "center", vertical: "middle" };
      cPct.numFmt = '0%';
      cPct.border = { top: { style: "thin", color: C.border }, left: { style: "thin", color: C.border }, bottom: { style: "thin", color: C.border }, right: { style: "thin", color: C.border } };

      // Gap
      const cGap = sheet.getCell(row, col + 3);
      cGap.value = target > 0 ? g : null;
      styleDataCell(cGap, { bold: true, color: g > 0 ? C.green : g < 0 ? C.red : C.text });

      // Best Estimate
      const cBE = sheet.getCell(row, col + 4);
      cBE.value = d.best_estimate;
      styleDataCell(cBE);
    }
    row++;
    row++; // blank row between quarters
  }

  row++; // extra gap before summary

  // ── Summary: Quarters ─────────────────────────────────────────────────────

  {
    // "Summary" label
    const labelCell = sheet.getCell(row, 1);
    labelCell.value = "SUMMARY";
    labelCell.font = { bold: true, size: 11, color: { argb: "FF2563EB" } };
    sheet.mergeCells(row, 1, row, 17);
    row++;

    // Q headers (4 quarters across cols 1-20, with gaps at 6,12,18)
    // Use 4 quarter blocks side by side: cols 1-5, 7-11, 13-17, 19-23
    sheet.getColumn(19).width = COL_WIDTH;
    sheet.getColumn(20).width = COL_WIDTH;
    sheet.getColumn(21).width = COL_WIDTH;
    sheet.getColumn(22).width = COL_WIDTH;
    sheet.getColumn(23).width = COL_WIDTH;

    sheet.getRow(row).height = 22;
    for (let i = 0; i < 4; i++) {
      const col = i * 6 + 1;
      const cell = sheet.getCell(row, col);
      cell.value = QUARTERS[i].label;
      styleHeader(cell, C.slateHeader, C.white);
      sheet.mergeCells(row, col, row, col + 4);
    }
    row++;

    // Sub-headers
    sheet.getRow(row).height = 18;
    const subHeaders = ["TARGET", "CONFIRM", "%", "GAP", "BEST EST."];
    for (let i = 0; i < 4; i++) {
      const col = i * 6 + 1;
      for (let j = 0; j < 5; j++) {
        const cell = sheet.getCell(row, col + j);
        cell.value = subHeaders[j];
        styleHeader(cell, C.slateSubHeader, C.textLight);
        cell.font = { bold: true, size: 9, color: C.textLight };
      }
    }
    row++;

    // Q data
    sheet.getRow(row).height = 20;
    for (let qi = 0; qi < 4; qi++) {
      const months = QUARTERS[qi].months;
      const tot = months.reduce((acc, m) => {
        const d = dataMap[m] ?? { rkap_target: 0, carry_over_target: 0, confirmed_amount: 0, best_estimate: 0 };
        acc.target += tab === "rkap" ? d.rkap_target : d.carry_over_target;
        acc.confirm += d.confirmed_amount;
        acc.be += d.best_estimate;
        return acc;
      }, { target: 0, confirm: 0, be: 0 });

      const g = gap(tot.confirm, tot.target);
      const p = pct(tot.confirm, tot.target);
      const col = qi * 6 + 1;

      const cT = sheet.getCell(row, col); cT.value = tot.target; styleDataCell(cT, { bold: true });
      const cC = sheet.getCell(row, col + 1); cC.value = tot.confirm; styleDataCell(cC, { bold: true });

      const cP = sheet.getCell(row, col + 2);
      cP.value = p !== null ? p / 100 : null;
      cP.fill = { type: "pattern", pattern: "solid", fgColor: C.white };
      cP.font = { bold: true, size: 10, color: p === null ? C.border : p >= 100 ? C.green : p >= 75 ? C.amber : C.red };
      cP.alignment = { horizontal: "center", vertical: "middle" };
      cP.numFmt = '0%';
      cP.border = { top: { style: "thin", color: C.border }, left: { style: "thin", color: C.border }, bottom: { style: "thin", color: C.border }, right: { style: "thin", color: C.border } };

      const cG = sheet.getCell(row, col + 3);
      cG.value = tot.target > 0 ? g : null;
      styleDataCell(cG, { bold: true, color: g > 0 ? C.green : g < 0 ? C.red : C.text });

      const cBE = sheet.getCell(row, col + 4); cBE.value = tot.be; styleDataCell(cBE, { bold: true });
    }
    row++;
    row++;
  }

  // ── Summary: Semester + Grand Total ───────────────────────────────────────

  {
    const semesters = [
      { label: "Semester 1", months: [1,2,3,4,5,6] },
      { label: "Semester 2", months: [7,8,9,10,11,12] },
      { label: "Grand Total", months: [1,2,3,4,5,6,7,8,9,10,11,12] },
    ];

    // Headers
    sheet.getRow(row).height = 22;
    for (let i = 0; i < 3; i++) {
      const col = i * 6 + 1;
      const cell = sheet.getCell(row, col);
      cell.value = semesters[i].label.toUpperCase();
      styleHeader(cell, C.darkHeader, C.white);
      sheet.mergeCells(row, col, row, col + 4);
    }
    row++;

    // Sub-headers
    sheet.getRow(row).height = 18;
    const subHeaders = ["TARGET", "CONFIRM", "%", "GAP", "BEST EST."];
    for (let i = 0; i < 3; i++) {
      const col = i * 6 + 1;
      for (let j = 0; j < 5; j++) {
        const cell = sheet.getCell(row, col + j);
        cell.value = subHeaders[j];
        styleHeader(cell, C.slateSubHeader, C.textLight);
        cell.font = { bold: true, size: 9, color: C.textLight };
      }
    }
    row++;

    // Data
    sheet.getRow(row).height = 20;
    for (let i = 0; i < 3; i++) {
      const tot = semesters[i].months.reduce((acc, m) => {
        const d = dataMap[m] ?? { rkap_target: 0, carry_over_target: 0, confirmed_amount: 0, best_estimate: 0 };
        acc.target += tab === "rkap" ? d.rkap_target : d.carry_over_target;
        acc.confirm += d.confirmed_amount;
        acc.be += d.best_estimate;
        return acc;
      }, { target: 0, confirm: 0, be: 0 });

      const g = gap(tot.confirm, tot.target);
      const p = pct(tot.confirm, tot.target);
      const col = i * 6 + 1;

      const cT = sheet.getCell(row, col); cT.value = tot.target; styleDataCell(cT, { bold: true });
      const cC = sheet.getCell(row, col + 1); cC.value = tot.confirm; styleDataCell(cC, { bold: true });

      const cP = sheet.getCell(row, col + 2);
      cP.value = p !== null ? p / 100 : null;
      cP.fill = { type: "pattern", pattern: "solid", fgColor: C.white };
      cP.font = { bold: true, size: 10, color: p === null ? C.border : p >= 100 ? C.green : p >= 75 ? C.amber : C.red };
      cP.alignment = { horizontal: "center", vertical: "middle" };
      cP.numFmt = '0%';
      cP.border = { top: { style: "thin", color: C.border }, left: { style: "thin", color: C.border }, bottom: { style: "thin", color: C.border }, right: { style: "thin", color: C.border } };

      const cG = sheet.getCell(row, col + 3);
      cG.value = tot.target > 0 ? g : null;
      styleDataCell(cG, { bold: true, color: g > 0 ? C.green : g < 0 ? C.red : C.text });

      const cBE = sheet.getCell(row, col + 4); cBE.value = tot.be; styleDataCell(cBE, { bold: true });
    }
  }

  // Freeze top row
  sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);
  if (isNaN(year)) return NextResponse.json({ error: "Invalid year parameter." }, { status: 400 });

  const { data, error } = await supabase
    .from("revenue_monthly")
    .select("*")
    .eq("year", year);

  if (error) throw new Error(error.message);

  // Build dataMap
  const dataMap: Record<number, MonthData> = {};
  (data || []).forEach((r: any) => { dataMap[r.month] = r; });

  // Build workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = "TMII Sponsorship Tracker";
  wb.created = new Date();

  const sheetRkap = wb.addWorksheet("RKAP", { properties: { tabColor: { argb: "FF00897B" } } });
  writeSheet(sheetRkap, dataMap, "rkap", year);

  const sheetCO = wb.addWorksheet("Carry Over", { properties: { tabColor: { argb: "FF2563EB" } } });
  writeSheet(sheetCO, dataMap, "carry_over", year);

  // Write to buffer
  const buffer = await wb.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Target-Revenue-${year}.xlsx"`,
    },
  });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Export failed." }, { status: 500 });
  }
}
