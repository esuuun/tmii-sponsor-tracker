export type Project = {
  id: string; // UUID
  name: string;
  description: string;
  status: string;
  created_at: string;
};

export type ProjectTimeline = {
  id: string;
  project_id: string;
  start_date: string; // ISO Date String 'YYYY-MM-DD'
  end_date: string;
  task_detail: string;
  category: "CONCEPTION" | "PLANNING" | "EXECUTION" | string;
  created_at: string;
};

export type ProjectTodo = {
  id: string;
  project_id: string;
  task_name: string;
  is_completed: boolean;
  order_index?: number;
  created_at: string;
};

export type ProjectSales = {
  id: string;
  project_id: string;
  item_name: string;
  month: string;
  year: number;
  sales_amount: number;
  created_at: string;
};

export type CostRatioItem = {
  id: string;
  project_id: string;
  year: number;
  category: string;
  item_name: string;
  detail: string;
  cost_tmii: number;
  value: number;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type ProjectCostRatio = {
  id: string;
  project_id: string;
  sponsorship_amount: number;
  updated_at: string;
};

export type RevenueMonthly = {
  id: string;
  year: number;
  month: number; // 1-12
  rkap_target: number;
  carry_over_target: number;
  confirmed_amount: number;
  carry_over_confirmed_amount: number;
  best_estimate: number;
  carry_over_best_estimate: number;
  created_at: string;
  updated_at: string;
};
