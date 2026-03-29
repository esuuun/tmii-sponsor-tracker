import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Project, ProjectTodo, ProjectTimeline, ProjectSales } from "@/types/database";
import { toast } from "sonner";

// --- Project Details ---
export const useProjectDetails = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await api.get<{ project: Project }>(`/projects/${projectId}`);
      return response.data.project;
    },
    enabled: !!projectId,
  });
};

// --- Todos ---
export const useTodos = (projectId: string) => {
  return useQuery({
    queryKey: ["todos", projectId],
    queryFn: async () => {
      const response = await api.get<{ todos: ProjectTodo[] }>(`/projects/${projectId}/todos`);
      return response.data.todos;
    },
    enabled: !!projectId,
  });
};

export const useTodoMutations = (projectId: string) => {
  const queryClient = useQueryClient();

  const createTodo = useMutation({
    mutationFn: async (task_name: string) => {
      const res = await api.post(`/projects/${projectId}/todos`, { task_name });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add task: ${error.message}`);
    },
  });

  const updateTodo = useMutation({
    mutationFn: async ({ id, is_completed, task_name }: { id: string; is_completed?: boolean; task_name?: string }) => {
      const res = await api.patch(`/projects/${projectId}/todos`, { id, is_completed, task_name });
      return res.data;
    },
    onMutate: async (updatedTodo) => {
      await queryClient.cancelQueries({ queryKey: ["todos", projectId] });
      const previousTodos = queryClient.getQueryData<ProjectTodo[]>(["todos", projectId]);
      queryClient.setQueryData<ProjectTodo[]>(["todos", projectId], (old) =>
        old?.map(todo => todo.id === updatedTodo.id ? { ...todo, ...updatedTodo } : todo)
      );
      return { previousTodos };
    },
    onError: (error: Error, newTodo, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos", projectId], context.previousTodos);
      }
      toast.error(`Failed to update task: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/projects/${projectId}/todos?id=${id}`);
      return res.data;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["todos", projectId] });
      const previousTodos = queryClient.getQueryData<ProjectTodo[]>(["todos", projectId]);
      queryClient.setQueryData<ProjectTodo[]>(["todos", projectId], (old) =>
        old?.filter(todo => todo.id !== deletedId)
      );
      return { previousTodos };
    },
    onError: (error: Error, id, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos", projectId], context.previousTodos);
      }
      toast.error(`Failed to delete task: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const reorderTodos = useMutation({
    mutationFn: async (orderedList: { id: string, order_index: number }[]) => {
      const res = await api.patch(`/projects/${projectId}/todos`, orderedList);
      return res.data;
    },
    onMutate: async (orderedList) => {
      await queryClient.cancelQueries({ queryKey: ["todos", projectId] });
      const previousTodos = queryClient.getQueryData<ProjectTodo[]>(["todos", projectId]);
      queryClient.setQueryData<ProjectTodo[]>(["todos", projectId], (old) => {
        if (!old) return old;
        const newArray = [...old];
        orderedList.forEach(orderItem => {
          const idx = newArray.findIndex(t => t.id === orderItem.id);
          if (idx !== -1) newArray[idx].order_index = orderItem.order_index;
        });
        return newArray.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      });
      return { previousTodos };
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos", projectId], context.previousTodos);
      }
      toast.error(`Failed to reorder tasks: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return { createTodo, updateTodo, deleteTodo, reorderTodos };
};

// --- Sales Matrix ---
export const useSales = (projectId: string, year?: number) => {
  return useQuery({
    queryKey: ["sales", projectId, year],
    queryFn: async () => {
      const url = year
        ? `/projects/${projectId}/sales?year=${year}`
        : `/projects/${projectId}/sales`;
      const response = await api.get<{ sales: ProjectSales[] }>(url);
      return response.data.sales;
    },
    enabled: !!projectId,
  });
};

export const useSalesMutations = (projectId: string, year?: number) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["sales", projectId] });
  };

  const createSalesItem = useMutation({
    mutationFn: async ({ item_name, month, sales_amount, price }: { item_name: string; month?: string; sales_amount?: number; price?: number }) => {
      const res = await api.post(`/projects/${projectId}/sales`, { item_name, month, sales_amount, price, year: year || new Date().getFullYear() });
      return res.data;
    },
    onSuccess: invalidate,
    onError: (error: Error) => {
      toast.error(`Failed to save data: ${error.message}`);
    },
  });

  const updateItemPrice = useMutation({
    mutationFn: async ({ item_name, price }: { item_name: string; price: number }) => {
      const res = await api.patch(`/projects/${projectId}/sales`, { update_price: true, item_name, price });
      return res.data;
    },
    onSuccess: invalidate,
    onError: (error: Error) => {
      toast.error(`Failed to update price: ${error.message}`);
    },
  });

  const updateSalesAmount = useMutation({
    mutationFn: async ({ id, item_name, month, sales_amount }: { id: string, item_name?: string; month?: string; sales_amount?: number }) => {
      const res = await api.patch(`/projects/${projectId}/sales`, { id, item_name, month, sales_amount, year: year || new Date().getFullYear() });
      return res.data;
    },
    onSuccess: invalidate,
    onError: (error: Error) => {
      toast.error(`Failed to update sales data: ${error.message}`);
    },
  });

  const renameSalesItem = useMutation({
    mutationFn: async ({ old_item_name, new_item_name }: { old_item_name: string, new_item_name: string }) => {
      const res = await api.patch(`/projects/${projectId}/sales`, { old_item_name, new_item_name });
      return res.data;
    },
    onSuccess: invalidate,
    onError: (error: Error) => {
      toast.error(`Failed to rename item: ${error.message}`);
    },
  });

  const deleteSalesItem = useMutation({
    mutationFn: async (item_name: string) => {
      const res = await api.delete(`/projects/${projectId}/sales?item_name=${encodeURIComponent(item_name)}${year ? `&year=${year}` : ''}`);
      return res.data;
    },
    onSuccess: invalidate,
    onError: (error: Error) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });

  const deleteSingleSale = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/projects/${projectId}/sales?id=${id}`);
      return res.data;
    },
    onSuccess: invalidate,
    onError: (error: Error) => {
      toast.error(`Failed to delete sale: ${error.message}`);
    },
  });

  return { createSalesItem, updateSalesAmount, renameSalesItem, deleteSalesItem, deleteSingleSale, updateItemPrice };
};

// --- Timelines ---
export const useTimelines = (projectId: string) => {
  return useQuery({
    queryKey: ["timelines", projectId],
    queryFn: async () => {
      const response = await api.get<{ timeline: ProjectTimeline[] }>(`/projects/${projectId}/timeline`);
      return response.data.timeline;
    },
    enabled: !!projectId,
  });
};

export const useTimelineMutations = (projectId: string) => {
  const queryClient = useQueryClient();

  const createTimeline = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/projects/${projectId}/timeline`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timelines", projectId] });
      toast.success("Timeline item added.");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add timeline item: ${error.message}`);
    },
  });

  const updateTimeline = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.patch(`/projects/${projectId}/timeline`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timelines", projectId] });
      toast.success("Timeline item updated.");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update timeline item: ${error.message}`);
    },
  });

  const deleteTimeline = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/projects/${projectId}/timeline?id=${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timelines", projectId] });
      toast.success("Timeline item deleted.");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete timeline item: ${error.message}`);
    },
  });

  return { createTimeline, updateTimeline, deleteTimeline };
};
