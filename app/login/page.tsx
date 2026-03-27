"use client";

import { useState } from "react";
import { Loader2, Mail, Lock, ArrowRight, LayoutDashboard } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  // Initialize supabase instance
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      // Redirect to dashboard root which maps to app/dashboard/page.tsx
      router.push(redirectTo);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      {/* Left Side - Brand & Visuals */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-12 items-center justify-center">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-blue-500/20 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

        <div className="relative z-10 w-full max-w-lg">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-lg p-1.5 ring-1 ring-white/20">
              <Image
                src="/redesign/logo_tmii.png"
                alt="TMII Logo"
                width={40}
                height={40}
                className="object-contain h-full w-full"
              />
            </div>
            <span className="text-2xl font-bold text-white tracking-wide">
              TMII Sponsor Tracker
            </span>
          </div>

          <h1 className="text-5xl font-extrabold text-white leading-[1.15] mb-6">
            Streamline your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">
              sponsorship pipelines.
            </span>
          </h1>
          <p className="text-blue-100/80 text-lg leading-relaxed mb-12 max-w-md">
            The all-in-one command center to oversee project developments, track
            financial metrics, and supervise deliverables seamlessly.
          </p>

          {/* <div className="flex items-center gap-4">
            <div className="flex -space-x-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-blue-900 bg-slate-200" style={{ backgroundImage: `url(https://i.pravatar.cc/100?img=${i+15})`, backgroundSize: 'cover' }}></div>
              ))}
            </div>
            <div className="text-sm font-medium text-blue-200 ml-2">
              Used by <span className="text-white font-bold">100+</span> project managers
            </div>
          </div> */}
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-slate-50 relative">
        <div className="w-full max-w-md space-y-8 absolute lg:relative top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-0 lg:top-0 lg:translate-y-0">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="h-16 w-16 bg-white flex items-center justify-center p-2 rounded-2xl shadow-lg border border-slate-100">
                <Image
                  src="/redesign/logo_tmii.png"
                  alt="TMII Logo"
                  width={48}
                  height={48}
                  className="object-contain h-full w-full"
                />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-slate-500 mt-2 font-medium">
              Please enter your credentials to access the dashboard.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold border border-red-100 flex items-center shadow-sm">
              {error}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-5 mt-8 border-t lg:border-t-0 pt-8 lg:pt-0 border-slate-200"
          >
            <div className="space-y-2">
              <label
                className="text-sm font-bold text-slate-700 tracking-wide"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-bold text-slate-700 tracking-wide"
                  htmlFor="password"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-[0_4px_14px_0_rgb(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] disabled:opacity-70 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
