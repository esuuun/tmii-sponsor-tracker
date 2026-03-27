import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { sponsorship_amount } = await request.json();

    const { data, error } = await supabase
      .from("project_cost_ratio")
      .upsert(
        {
          project_id: projectId,
          sponsorship_amount: sponsorship_amount ?? 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "project_id" },
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ summary: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
