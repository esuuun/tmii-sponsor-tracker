import Image from "next/image";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-slate-900">
      <Providers>
        <Sidebar />
        <div className="relative flex flex-1 flex-col overflow-hidden bg-slate-50">
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute top-24 left-10 h-28 w-28 opacity-10">
              <Image
                src="/redesign/svg/corak.svg"
                alt="Corak motif"
                fill
                className="object-contain"
              />
            </div>
            <div className="absolute top-40 right-20 h-20 w-20 rotate-12 opacity-15">
              <Image
                src="/redesign/svg/corak.svg"
                alt="Corak motif"
                fill
                className="object-contain"
              />
            </div>
            <div className="absolute bottom-40 left-1/3 h-36 w-36 -rotate-6 opacity-[0.08]">
              <Image
                src="/redesign/svg/corak.svg"
                alt="Corak motif"
                fill
                className="object-contain"
              />
            </div>
            <div className="absolute bottom-20 right-16 h-24 w-24 rotate-45 opacity-10">
              <Image
                src="/redesign/svg/corak.svg"
                alt="Corak motif"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </Providers>
    </div>
  );
}
