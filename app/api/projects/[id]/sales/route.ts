import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await context.params;
  const url = new URL(request.url);
  const yearParam = url.searchParams.get("year");

  let query = supabase
    .from("project_sales")
    .select("*")
    .eq("project_id", params.id)
    .order("created_at", { ascending: true });

  if (yearParam) {
    query = query.eq("year", yearParam);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sales: data });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await context.params;

  try {
    const body = await request.json();
    const { item_name, month, sales_amount, year, price } = body;

    if (!item_name || typeof item_name !== "string" || item_name.trim() === "") {
      return NextResponse.json({ error: "item_name is required." }, { status: 400 });
    }

    const salesYear = year || new Date().getFullYear();

    const { data, error } = await supabase
      .from("project_sales")
      .insert([{
        project_id: params.id,
        item_name: item_name.trim(),
        month: month || "January",
        year: salesYear,
        sales_amount: sales_amount || 0,
        price: price || 0,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ sale: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await context.params;

  try {
    const body = await request.json();
    const { id, item_name, month, sales_amount, year, old_item_name, new_item_name, update_price, price } = body;

    // Bulk price update mode
    if (update_price && item_name !== undefined && price !== undefined) {
      const { error } = await supabase
        .from("project_sales")
        .update({ price })
        .eq("project_id", params.id)
        .eq("item_name", item_name);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Bulk rename mode
    if (old_item_name && new_item_name) {
      if (typeof new_item_name !== "string" || new_item_name.trim() === "") {
        return NextResponse.json({ error: "new_item_name cannot be empty." }, { status: 400 });
      }
      const { error } = await supabase
        .from("project_sales")
        .update({ item_name: new_item_name.trim() })
        .eq("project_id", params.id)
        .eq("item_name", old_item_name);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Single cell update
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

    const { data, error } = await supabase
      .from("project_sales")
      .update({ item_name, month, sales_amount, ...(year !== undefined ? { year } : {}) })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ sale: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await context.params;

  try {
    const url = new URL(request.url);
    const itemName = url.searchParams.get("item_name");
    const id = url.searchParams.get("id");

    if (id) {
      const { error } = await supabase.from("project_sales").delete().eq("id", id);
      if (error) throw error;
    } else if (itemName) {
      const { error } = await supabase
        .from("project_sales")
        .delete()
        .eq("project_id", params.id)
        .eq("item_name", itemName);
      if (error) throw error;
    } else {
      return NextResponse.json({ error: "id or item_name is required." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
