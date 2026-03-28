"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function SpreadsheetPage() {
  const [isLoading, setIsLoading] = useState(true);

  const spreadsheetUrl =
    "https://docs.google.com/spreadsheets/d/1-XUxACw3BJjK0fOYcZJp4kS5Acf0OZC037d3iA2gnSU/edit?usp=sharing";

  const embedUrl = spreadsheetUrl.replace(
    "/edit?usp=sharing",
    "/edit?usp=sharing&embedded=true",
  );

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-1 overflow-hidden border border-gray-200 shadow-sm relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-slate-500">Loading spreadsheet...</p>
          </div>
        )}
        <iframe
          src={embedUrl}
          className="h-full w-full"
          style={{ minHeight: "calc(100vh - 200px)", border: "none" }}
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}
