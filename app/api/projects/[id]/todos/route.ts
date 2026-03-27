import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await context.params;

  const { data, error } = await supabase
    .from("project_todos")
    .select("*")
    .eq("project_id", params.id)
    .order("order_index", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ todos: data });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await context.params;

  try {
    const body = await request.json();
    const { task_name, is_completed } = body;

    const { data, error } = await supabase
      .from("project_todos")
      .insert([{ project_id: params.id, task_name, is_completed: is_completed || false }])
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json({ todo: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    // Handle bulk update for reordering
    if (Array.isArray(body)) {
      // Body is an array of { id, order_index }
      await Promise.all(body.map(async (item: any) => {
        if (!item.id || item.order_index === undefined) return;
        await supabase
          .from("project_todos")
          .update({ order_index: item.order_index })
          .eq("id", item.id);
      }));
      return NextResponse.json({ success: true });
    }

    // Handle single update
    const { id, is_completed, task_name } = body;

    // Supabase automatically ignores undefined keys in the update object payload
    const updatePayload: any = {};
    if (is_completed !== undefined) updatePayload.is_completed = is_completed;
    if (task_name !== undefined) updatePayload.task_name = task_name;

    const { data, error } = await supabase
      .from("project_todos")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ todo: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) throw new Error("Missing ID parameter");

    const { error } = await supabase
      .from("project_todos")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
