"use client";

import { Map, Clock } from "lucide-react";

const PLACEHOLDER_ITEMS = [
  {
    quarter: "Q1 2026",
    status: "done",
    items: [
      "Project overview & portfolio tracking",
      "Sponsorship pipeline management",
      "Admin authentication",
    ],
  },
  {
    quarter: "Q2 2026",
    status: "done",
    items: [
      "Financial metrics dashboard",
      "Todo & task management",
      "Timeline visualization",
    ],
  },
  {
    quarter: "Q3 2026",
    status: "current",
    items: [
      "Advanced analytics & reporting",
      "Revenue target tracking",
      "Cost ratio analysis",
    ],
  },
  {
    quarter: "Q4 2026",
    status: "upcoming",
    items: [
      "Sponsor CRM integration",
      "Automated status notifications",
      "Export & sharing features",
    ],
  },
];

const statusConfig = {
  done: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    line: "bg-emerald-300",
    label: "Completed",
  },
  current: {
    dot: "bg-blue-500 ring-4 ring-blue-100",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    line: "bg-slate-200",
    label: "In Progress",
  },
  upcoming: {
    dot: "bg-slate-300",
    badge: "bg-slate-50 text-slate-500 border-slate-200",
    line: "bg-slate-200",
    label: "Upcoming",
  },
};

export default function RoadmapPage() {
  return (
    <div className="flex flex-col gap-10 p-10 max-w-4xl mx-auto">
      <div className="space-y-3">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          Roadmap
        </h1>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center rounded bg-slate-200/70 px-2.5 py-1 text-xs font-semibold tracking-wide text-slate-600">
            PRODUCT TIMELINE
          </span>
        </div>
        <p className="text-slate-500 text-sm max-w-lg">
          A high-level overview of what has been built and what's coming next.
          Details are subject to change.
        </p>
      </div>

      {/* Coming soon banner */}
      <div className="flex items-center gap-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 px-6 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
          <Clock className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-blue-800">
            This page is a placeholder
          </p>
          <p className="text-sm text-blue-600/80">
            The full interactive roadmap is coming soon. The timeline below is
            an early draft.
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative flex flex-col gap-0">
        {PLACEHOLDER_ITEMS.map((phase, i) => {
          const cfg = statusConfig[phase.status as keyof typeof statusConfig];
          const isLast = i === PLACEHOLDER_ITEMS.length - 1;
          return (
            <div key={phase.quarter} className="flex gap-6">
              {/* Left: dot + line */}
              <div className="flex flex-col items-center">
                <div
                  className={`mt-1 h-4 w-4 shrink-0 rounded-full ${cfg.dot}`}
                />
                {!isLast && (
                  <div
                    className={`mt-1 w-0.5 flex-1 ${cfg.line}`}
                    style={{ minHeight: 48 }}
                  />
                )}
              </div>

              {/* Right: content */}
              <div className="pb-10 flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-base font-bold text-slate-800">
                    {phase.quarter}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.badge}`}
                  >
                    {cfg.label}
                  </span>
                </div>
                <ul className="space-y-2">
                  {phase.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-sm text-slate-600"
                    >
                      <Map className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
