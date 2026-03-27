import Image from "next/image";
import Link from "next/link";
import { PlayCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans selection:bg-blue-200 relative overflow-hidden bg-linear-to-b from-blue-600 to-blue-400">
      {/* Noise Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-60"
        style={{
          backgroundImage:
            'url(\'data:image/svg+xml;utf8,<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="2"/><feColorMatrix type="saturate" values="0"/></filter><rect width="400" height="400" filter="url(%23noise)" opacity="0.5" fill="%23000"/></svg>\')',
        }}
      ></div>

      {/* Decorative Corak Patterns */}
      {/* Top Left Large */}
      <div className="absolute top-20 rotate-12 left-10 z-5 opacity-15 w-48 h-48">
        <Image
          src="/redesign/corak.png"
          alt="Corak Pattern"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Top Right Medium */}
      <div className="absolute md:top-40 top-72 right-0 md:right-20 z-5 opacity-20 w-32 h-32 rotate-45">
        <Image
          src="/redesign/corak.png"
          alt="Corak Pattern"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Middle Left Small */}
      <div className="absolute top-1/3 left-1/4 z-5 opacity-10 w-24 h-24 -rotate-12 hidden md:block">
        <Image
          src="/redesign/corak.png"
          alt="Corak Pattern"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Center Large */}
      <div className="absolute top-1/2 rotate-3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-5 hidden md:block opacity-[0.08] w-96 h-96">
        <Image
          src="/redesign/corak.png"
          alt="Corak Pattern"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Bottom Right Small */}
      <div className="absolute bottom-32 right-1/4 z-5 opacity-12 w-20 h-20 rotate-90">
        <Image
          src="/redesign/corak.png"
          alt="Corak Pattern"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 relative">
              <Image
                src="/redesign/logo_tmii.png"
                alt="TMII Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              <span className="text-slate-800">TMII </span>Sponsor Tracker
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden sm:flex text-sm font-bold bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 min-h-screen flex items-center overflow-hidden">
        <div className="w-full h-full md:grid lg:grid-cols-2 gap-0 items-center flex-col justify-center">
          {/* Left Content */}
          <div className="flex flex-col md:mx-16 text-center md:text-left justify-center px-11 max-w-xl items-center md:items-start">
            <h1 className="text-5xl sm:text-7xl font-black text-slate-800 leading-[1.1] tracking-tight mb-8">
              Master Tracker for{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-200 to-white">
                Cultural Sponsorship
              </span>
              
            </h1>

            <p className="text-lg text-white opacity-80 font-medium leading-relaxed mb-8 max-w-xl">
              Intelligence platform for managing Taman Mini Indonesia
              Indah&apos;s sponsorship and partnership ecosystem with
              streamlined tracking and strategic insights.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto text-sm font-bold bg-slate-900 text-white px-8 py-4 rounded-xl flex gap-2 items-center justify-center hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
              >
                <PlayCircle className="w-5 h-5" /> Access Dashboard
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="absolute h-full hidden md:block w-[65%] right-0 flex justify-end">
            <Image
              src="/redesign/art_tmii.png"
              alt="Taman Mini Illustration"
              fill
              className="object-cover drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </section>
    </div>
  );
}
