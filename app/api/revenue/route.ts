import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  const { data, error } = await supabase
    .from("revenue_monthly")
    .select("*")
    .eq("year", year)
    .order("month", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ revenue: data });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { year, month, rkap_target, carry_over_target, confirmed_amount, carry_over_confirmed_amount, best_estimate, carry_over_best_estimate } = body;

    const { data, error } = await supabase
      .from("revenue_monthly")
      .upsert(
        {
          year,
          month,
          rkap_target: rkap_target ?? 0,
          carry_over_target: carry_over_target ?? 0,
          confirmed_amount: confirmed_amount ?? 0,
          carry_over_confirmed_amount: carry_over_confirmed_amount ?? 0,
          best_estimate: best_estimate ?? 0,
          carry_over_best_estimate: carry_over_best_estimate ?? 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "year,month" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ revenue: data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
