import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useEffect } from "react";

export const useAuth = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      queryClient.setQueryData(["auth-session"], session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, queryClient]);

  return useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user ?? null;
    },
    staleTime: Infinity,
  });
};
