import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { RevenueMonthly } from "@/types/database";

export const useRevenueData = (year: number) => {
  return useQuery({
    queryKey: ["revenue", year],
    queryFn: async () => {
      const response = await api.get<{ revenue: RevenueMonthly[] }>(`/revenue?year=${year}`);
      return response.data.revenue;
    },
  });
};

export const useUpsertRevenue = (year: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      year: number;
      month: number;
      rkap_target?: number;
      carry_over_target?: number;
      confirmed_amount?: number;
      carry_over_confirmed_amount?: number;
      best_estimate?: number;
      carry_over_best_estimate?: number;
    }) => {
      const response = await api.post<{ revenue: RevenueMonthly }>("/revenue", payload);
      return response.data.revenue;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue", year] });
    },
  });
};
