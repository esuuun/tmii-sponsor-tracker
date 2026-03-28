"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { Search, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function SearchInput() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams();
    if (val) {
      params.set("q", val);
      router.replace(`/projects?${params.toString()}`);
    } else {
      router.replace("/projects");
    }
  };

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </div>
      <input
        id="search"
        className="block w-full rounded-full border-0 bg-slate-50 py-2.5 pl-11 pr-4 text-slate-900 ring-1 ring-inset ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
        placeholder="Search projects..."
        type="search"
        name="search"
        defaultValue={searchParams.get("q") || ""}
        onChange={handleSearch}
      />
    </div>
  );
}

export function Header() {
  const { data: user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className="flex h-20 items-center justify-between border-b border-gray-100 bg-white px-8">
      <div className="flex max-w-md flex-1 items-center">
        <label htmlFor="search" className="sr-only">
          Search
        </label>
        <Suspense fallback={
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </div>
            <input
              className="block w-full rounded-full border-0 bg-slate-50 py-2.5 pl-11 pr-4 text-slate-900 ring-1 ring-inset ring-slate-100 placeholder:text-slate-400 sm:text-sm sm:leading-6"
              placeholder="Search projects..."
              type="search"
              disabled
            />
          </div>
        }>
          <SearchInput />
        </Suspense>
      </div>

      {/* Right Section: Profile & Actions */}
      <div className="flex items-center gap-5 ml-4">
        {user ? (
          <div
            className="relative flex items-center gap-3 pl-5 border-l border-slate-200"
            ref={profileRef}
          >
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-slate-800">
                Admin Account
              </span>
              <span className="text-xs font-medium text-slate-500">
                {user.email}
              </span>
            </div>

            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="relative h-10 w-10 overflow-hidden rounded-xl border-2 border-slate-100 hover:border-slate-300 hover:ring-2 hover:ring-blue-100 transition-all focus:outline-none flex items-center justify-center bg-slate-50"
            >
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email}&backgroundColor=ef4444&textColor=ffffff`}
                alt="Admin Avatar"
                className="h-full w-full object-cover"
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden divide-y divide-slate-100 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
                <div className="p-1.5"></div>
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_0_rgb(37,99,235,0.2)] hover:shadow-lg transition-all border border-blue-500 ml-4"
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
        )}
      </div>
    </header>
  );
}
