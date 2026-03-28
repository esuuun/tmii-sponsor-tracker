import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import ExcelJS from "exceljs";

// ─── Colors (matching original Excel style) ───────────────────────────────────

const C = {
  navyHeader:    { argb: "FF203864" },
  navyDark:      { argb: "FF1F3864" },
  sectionBlue:   { argb: "FF2E4057" },
  sectionPink:   { argb: "FFFFC7CE" },
  sectionPinkDark:{ argb: "FF9C0006" },
  summaryAmber:  { argb: "FFFFF2CC" },
  summaryAmberDark:{ argb: "FF7F6000" },
  summaryBlue:   { argb: "FFDAE3F3" },
  summaryBlueDark:{ argb: "FF203864" },
  white:         { argb: "FFFFFFFF" },
  text:          { argb: "FF1E293B" },
  border:        { argb: "FFBFBFBF" },
  green:         { argb: "FF375623" },
  greenBg:       { argb: "FFC6EFCE" },
};

function border() {
  return {
    top:    { style: "thin" as const, color: C.border },
    left:   { style: "thin" as const, color: C.border },
    bottom: { style: "thin" as const, color: C.border },
    right:  { style: "thin" as const, color: C.border },
  };
}

function styleCell(
  cell: ExcelJS.Cell,
  opts: {
    bg?: Partial<ExcelJS.Color>;
    color?: Partial<ExcelJS.Color>;
    bold?: boolean;
    size?: number;
    align?: "left" | "center" | "right";
    numFmt?: string;
    italic?: boolean;
    wrapText?: boolean;
  } = {},
) {
  if (opts.bg)
    cell.fill = { type: "pattern", pattern: "solid", fgColor: opts.bg };
  cell.font = {
    bold: opts.bold ?? false,
    italic: opts.italic ?? false,
    size: opts.size ?? 10,
    color: opts.color ?? C.text,
    name: "Calibri",
  };
  cell.alignment = {
    horizontal: opts.align ?? "left",
    vertical: "middle",
    wrapText: opts.wrapText ?? false,
  };
  cell.border = border();
  if (opts.numFmt) cell.numFmt = opts.numFmt;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  const [projectRes, itemsRes] = await Promise.all([
    supabase.from("projects").select("name").eq("id", projectId).single(),
    supabase
      .from("cost_ratio_items")
      .select("*")
      .eq("project_id", projectId)
      .eq("year", year)
      .order("order_index", { ascending: true }),
  ]);

  if (projectRes.error) throw new Error(projectRes.error.message);
  if (itemsRes.error) throw new Error(itemsRes.error.message);

  const projectName: string = projectRes.data.name;
  const items: any[] = itemsRes.data ?? [];

  const totalCostTmii = items.reduce((s, i) => s + (i.cost_tmii ?? 0), 0);
  const totalValue = items.reduce((s, i) => s + (i.value ?? 0), 0);
  const ratio = totalValue > 0 ? totalCostTmii / totalValue : null;

  // ── Separate items into sections ──────────────────────────────────────────
  const sponsorItems = items.filter((i) => i.category !== "Cost TMII");
  const costTmiiItems = items.filter((i) => i.category === "Cost TMII");

  // ── Build workbook ────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = "TMII Sponsorship Tracker";
  wb.created = new Date();

  const sheet = wb.addWorksheet(`Breakdown ${projectName}`, {
    properties: { tabColor: C.navyHeader },
  });

  // Column widths
  sheet.getColumn(1).width = 26;  // Category
  sheet.getColumn(2).width = 32;  // Item
  sheet.getColumn(3).width = 48;  // Detail
  sheet.getColumn(4).width = 20;  // Cost TMII
  sheet.getColumn(5).width = 20;  // Value

  let row = 1;

  // ── Title ──────────────────────────────────────────────────────────────────
  sheet.getRow(row).height = 22;
  const titleCell = sheet.getCell(row, 1);
  titleCell.value = `BREAKDOWN ${projectName.toUpperCase()} ${year}`;
  styleCell(titleCell, { bold: true, size: 13, color: C.text });
  titleCell.border = {};
  sheet.mergeCells(row, 1, row, 5);
  row++;
  row++; // blank

  // ── Column headers ────────────────────────────────────────────────────────
  sheet.getRow(row).height = 20;
  const headers = ["B", "Item / Kontraprestasi", "Detail / Keterangan", "Cost", "Value"];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(row, i + 1);
    cell.value = h;
    styleCell(cell, {
      bg: C.navyHeader,
      color: C.white,
      bold: true,
      align: "center",
      size: 10,
    });
  });
  row++;

  // ── Section: WHAT [PROJECT] GIVES ─────────────────────────────────────────
  if (sponsorItems.length > 0) {
    sheet.getRow(row).height = 18;
    const sectionCell = sheet.getCell(row, 1);
    sectionCell.value = `WHAT ${projectName.toUpperCase()} GIVES`;
    styleCell(sectionCell, {
      bg: C.navyDark,
      color: C.white,
      bold: true,
      align: "center",
      size: 10,
    });
    sheet.mergeCells(row, 1, row, 5);
    // Fill merged cells
    for (let c = 2; c <= 5; c++) {
      const mc = sheet.getCell(row, c);
      mc.fill = { type: "pattern", pattern: "solid", fgColor: C.navyDark };
      mc.border = border();
    }
    row++;

    for (const item of sponsorItems) {
      sheet.getRow(row).height = item.detail && item.detail.length > 60 ? 32 : 18;
      styleCell(sheet.getCell(row, 1), { align: "center" });
      sheet.getCell(row, 1).value = item.category;

      styleCell(sheet.getCell(row, 2), { align: "center" });
      sheet.getCell(row, 2).value = item.item_name;

      styleCell(sheet.getCell(row, 3), { align: "center", wrapText: true });
      sheet.getCell(row, 3).value = item.detail;

      const costCell = sheet.getCell(row, 4);
      if (item.cost_tmii === 0) {
        styleCell(costCell, { align: "center", italic: true, color: { argb: "FF666666" } });
        costCell.value = "no cost tmii";
      } else {
        styleCell(costCell, { align: "right", numFmt: "#,##0" });
        costCell.value = item.cost_tmii;
      }

      const valueCell = sheet.getCell(row, 5);
      styleCell(valueCell, { align: "right", numFmt: "#,##0" });
      valueCell.value = item.value || null;

      row++;
    }
  }

  // ── Section: COST TMII ────────────────────────────────────────────────────
  if (costTmiiItems.length > 0) {
    sheet.getRow(row).height = 18;
    const sectionCell = sheet.getCell(row, 1);
    sectionCell.value = "Cost TMII";
    styleCell(sectionCell, {
      bg: C.sectionPink,
      color: C.sectionPinkDark,
      bold: true,
      align: "center",
      size: 10,
    });
    sheet.mergeCells(row, 1, row, 5);
    for (let c = 2; c <= 5; c++) {
      const mc = sheet.getCell(row, c);
      mc.fill = { type: "pattern", pattern: "solid", fgColor: C.sectionPink };
      mc.border = border();
    }
    row++;

    for (const item of costTmiiItems) {
      sheet.getRow(row).height = 18;
      styleCell(sheet.getCell(row, 1), { align: "center" });
      sheet.getCell(row, 1).value = item.item_name;

      // For Cost TMII items, the "Item" column holds quantity/detail split from detail field
      const detailParts = (item.detail ?? "").split(" — ");
      styleCell(sheet.getCell(row, 2), { align: "center" });
      sheet.getCell(row, 2).value = detailParts[0] ?? "";

      styleCell(sheet.getCell(row, 3), { align: "center", wrapText: true });
      sheet.getCell(row, 3).value = detailParts[1] ?? item.detail;

      const costCell = sheet.getCell(row, 4);
      styleCell(costCell, { align: "right", numFmt: "#,##0" });
      costCell.value = item.cost_tmii || null;

      const valueCell = sheet.getCell(row, 5);
      styleCell(valueCell, { align: "right", numFmt: "#,##0" });
      valueCell.value = item.value || null;

      row++;
    }
  }

  // ── Summary rows ──────────────────────────────────────────────────────────

  // Sponsorship Amount
  sheet.getRow(row).height = 18;
  const sponsorLabelCell = sheet.getCell(row, 3);
  sponsorLabelCell.value = `Sponsorship ${projectName} 1 Year`;
  styleCell(sponsorLabelCell, {
    bg: C.summaryAmber,
    color: C.summaryAmberDark,
    bold: true,
    align: "right",
    size: 10,
  });
  sheet.mergeCells(row, 1, row, 3);
  for (let c = 1; c <= 3; c++) {
    const mc = sheet.getCell(row, c);
    mc.fill = { type: "pattern", pattern: "solid", fgColor: C.summaryAmber };
    mc.font = { bold: true, color: C.summaryAmberDark, size: 10, name: "Calibri" };
    mc.border = border();
    mc.alignment = { horizontal: "right", vertical: "middle" };
  }
  sheet.getCell(row, 3).value = `Sponsorship ${projectName} 1 Year`;

  const spCostCell = sheet.getCell(row, 4);
  styleCell(spCostCell, { bg: C.summaryAmber, color: C.summaryAmberDark, bold: true, align: "right", numFmt: "#,##0" });
  spCostCell.value = totalValue || null;

  const spValCell = sheet.getCell(row, 5);
  styleCell(spValCell, { bg: C.summaryAmber, color: C.summaryAmberDark, bold: true, align: "right", numFmt: "#,##0" });
  spValCell.value = totalValue || null;
  row++;

  // Cost Production TMII
  sheet.getRow(row).height = 18;
  sheet.mergeCells(row, 1, row, 3);
  for (let c = 1; c <= 3; c++) {
    const mc = sheet.getCell(row, c);
    mc.fill = { type: "pattern", pattern: "solid", fgColor: C.summaryAmber };
    mc.font = { bold: true, color: C.summaryAmberDark, size: 10, name: "Calibri" };
    mc.border = border();
    mc.alignment = { horizontal: "right", vertical: "middle" };
  }
  sheet.getCell(row, 3).value = "Cost Production TMII";

  const cpCell = sheet.getCell(row, 4);
  styleCell(cpCell, { bg: C.summaryAmber, color: C.summaryAmberDark, bold: true, align: "right", numFmt: "#,##0" });
  cpCell.value = totalCostTmii || null;

  const cpBlank = sheet.getCell(row, 5);
  styleCell(cpBlank, { bg: C.summaryAmber });
  cpBlank.value = null;
  row++;

  // Ratio
  sheet.getRow(row).height = 18;
  sheet.mergeCells(row, 1, row, 3);
  for (let c = 1; c <= 3; c++) {
    const mc = sheet.getCell(row, c);
    mc.fill = { type: "pattern", pattern: "solid", fgColor: C.summaryBlue };
    mc.font = { bold: true, color: C.summaryBlueDark, size: 10, name: "Calibri" };
    mc.border = border();
    mc.alignment = { horizontal: "right", vertical: "middle" };
  }
  sheet.getCell(row, 3).value = "Ratio Cost terhadap Nilai Sponsorship";

  const ratioCell = sheet.getCell(row, 4);
  styleCell(ratioCell, {
    bg: C.summaryBlue,
    color: C.summaryBlueDark,
    bold: true,
    align: "right",
    numFmt: "0.00%",
  });
  ratioCell.value = ratio;

  const ratioBlank = sheet.getCell(row, 5);
  styleCell(ratioBlank, { bg: C.summaryBlue });
  ratioBlank.value = null;

  // Freeze header rows
  sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];

  // ── Write buffer ──────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const safeName = projectName.replace(/[^a-zA-Z0-9]/g, "-");

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Cost-Ratio-${safeName}-${year}.xlsx"`,
    },
  });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Export failed." }, { status: 500 });
  }
}
