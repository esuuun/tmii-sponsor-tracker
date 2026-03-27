import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request, context: { params: { id: string } }) {
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
    // Using simple eq with the parameter directly to be robust against string/number types
    query = query.eq("year", yearParam);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ sales: data });
}

export async function POST(request: Request, context: { params: { id: string } }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await context.params;

  try {
    const body = await request.json();
    const { item_name, month, sales_amount, year } = body;
    const salesYear = year || new Date().getFullYear();

    console.log("POST /sales:", { item_name, month, sales_amount, year: salesYear });

    const { data, error } = await supabase
      .from("project_sales")
      .insert([{ 
        project_id: params.id, 
        item_name, 
        month: month || "January",
        year: salesYear,
        sales_amount: sales_amount || 0 
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }
    
    return NextResponse.json({ sale: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await context.params;

  try {
    const body = await request.json();
    const { id, item_name, month, sales_amount, year, old_item_name, new_item_name } = body;

    // Bulk Rename mode across all localized matrix rows
    if (old_item_name && new_item_name) {
      const { error } = await supabase
        .from("project_sales")
        .update({ item_name: new_item_name })
        .eq("project_id", params.id)
        .eq("item_name", old_item_name);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    console.log("PATCH /sales:", { id, item_name, month, sales_amount, year });

    // Default specific single-cell update mode
    const { data, error } = await supabase
      .from("project_sales")
      .update({ item_name, month, sales_amount, ...(year !== undefined ? { year } : {}) })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }
    return NextResponse.json({ sale: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
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
      // Delete specific single record
      const { error } = await supabase
        .from("project_sales")
        .delete()
        .eq("id", id);
      if (error) throw error;
    } else if (itemName) {
      // Delete all records with this item name for this project
      const { error } = await supabase
        .from("project_sales")
        .delete()
        .eq("project_id", params.id)
        .eq("item_name", itemName);
      if (error) throw error;
    } else {
      throw new Error("Missing id or item_name for deletion.");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
