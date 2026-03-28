"use client";

import { useState } from "react";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-12 items-center justify-center">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-blue-500/20 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-3xl"></div>
        <div className="relative z-10 w-full max-w-lg">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-lg p-1.5 ring-1 ring-white/20">
              <Image src="/redesign/logo_tmii.png" alt="TMII Logo" width={40} height={40} className="object-contain h-full w-full" />
            </div>
            <span className="text-2xl font-bold text-white tracking-wide">TMII Sponsor Tracker</span>
          </div>
          <h1 className="text-5xl font-extrabold text-white leading-[1.15] mb-6">
            Reset your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">password.</span>
          </h1>
          <p className="text-blue-100/80 text-lg leading-relaxed max-w-md">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="lg:hidden flex justify-center mb-6">
              <div className="h-16 w-16 bg-white flex items-center justify-center p-2 rounded-2xl shadow-lg border border-slate-100">
                <Image src="/redesign/logo_tmii.png" alt="TMII Logo" width={48} height={48} className="object-contain h-full w-full" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Forgot password?</h2>
            <p className="text-slate-500 mt-2 font-medium">We'll send a reset link to your email.</p>
          </div>

          {sent ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex flex-col items-center gap-3 text-center">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
              <p className="font-bold text-emerald-800">Check your email</p>
              <p className="text-sm text-emerald-700">We sent a password reset link to <span className="font-semibold">{email}</span>.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold border border-red-100">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 tracking-wide" htmlFor="email">
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-[0_4px_14px_0_rgb(37,99,235,0.2)] disabled:opacity-70 transition-all"
                >
                  {isLoading ? (
                    <><Loader2 className="animate-spin h-5 w-5" /> Sending...</>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>
            </>
          )}

          <Link href="/login" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
