import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { CostRatioItem } from "@/types/database";

interface CostRatioData {
  items: CostRatioItem[];
}

export const useCostRatioData = (projectId: string, year: number) =>
  useQuery({
    queryKey: ["cost-ratio", projectId, year],
    queryFn: async () => {
      const res = await api.get<CostRatioData>(`/cost-ratio/${projectId}?year=${year}`);
      return res.data;
    },
    enabled: !!projectId,
  });

export const useCreateCostRatioItem = (projectId: string, year: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CostRatioItem>) => {
      const res = await api.post<{ item: CostRatioItem }>(
        `/cost-ratio/${projectId}`,
        { ...payload, year },
      );
      return res.data.item;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cost-ratio", projectId, year] }),
  });
};

export const useUpdateCostRatioItem = (projectId: string, year: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      ...fields
    }: Partial<CostRatioItem> & { itemId: string }) => {
      const res = await api.patch<{ item: CostRatioItem }>(
        `/cost-ratio/${projectId}/${itemId}`,
        fields,
      );
      return res.data.item;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cost-ratio", projectId, year] }),
  });
};

export const useDeleteCostRatioItem = (projectId: string, year: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/cost-ratio/${projectId}/${itemId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cost-ratio", projectId, year] }),
  });
};
