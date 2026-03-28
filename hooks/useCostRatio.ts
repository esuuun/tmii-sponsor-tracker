import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { CostRatioItem } from "@/types/database";
import { toast } from "sonner";

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cost-ratio", projectId, year] });
      toast.success("Item added.");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add item: ${error.message}`);
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cost-ratio", projectId, year] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });
};

export const useDeleteCostRatioItem = (projectId: string, year: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/cost-ratio/${projectId}/${itemId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cost-ratio", projectId, year] });
      toast.success("Item deleted.");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });
};
