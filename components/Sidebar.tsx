"use client";

import {
  Activity,
  Calendar,
  CheckSquare,
  CircleDollarSign,
  Coins,
  FileSpreadsheet,
  Folders,
  HelpCircle,
  LogOut,
  Map,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Projects", href: "/dashboard", icon: Folders },
  { name: "Timeline", href: "/timeline", icon: Calendar },
  { name: "Todo list", href: "/todo", icon: CheckSquare },
  { name: "Tracking", href: "/tracking", icon: Activity },
  { name: "Target Revenue", href: "/target-revenue", icon: CircleDollarSign },
  { name: "Cost Ratio", href: "/cost-ratio", icon: Coins },
  { name: "Roadmap", href: "/roadmap", icon: Map },
  {
    name: "Excel / Analysis Spreadsheet",
    href: "/spreadsheet",
    icon: FileSpreadsheet,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-100 bg-white">
      <div className="flex h-20 shrink-0 items-center px-6">
        <Link href="/">
          <div className="flex items-center gap-2">
            {/* Mock Logo */}
            <img
              src="/redesign/logo_tmii.png"
              alt="TMII Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                TMII
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
                Sponsorship Tracker
              </p>
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          // Simplistic matching for active routes
          const isActive =
            pathname === item.href ||
            (pathname.startsWith("/projects") && item.href === "/dashboard") ||
            (pathname.startsWith("/timeline") && item.href === "/timeline") ||
            (pathname.startsWith("/todo") && item.href === "/todo") ||
            (pathname.startsWith("/tracking") && item.href === "/tracking") ||
            (pathname.startsWith("/target-revenue") &&
              item.href === "/target-revenue") ||
            (pathname.startsWith("/cost-ratio") && item.href === "/cost-ratio");
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${
                  isActive
                    ? "text-blue-600"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4 space-y-1">
        {/* <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">
          <HelpCircle className="h-5 w-5 shrink-0 text-slate-400" />
          Help
        </button> */}
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">
          <LogOut className="h-5 w-5 shrink-0 text-slate-400" />
          Logout
        </button>
      </div>
    </div>
  );
}
