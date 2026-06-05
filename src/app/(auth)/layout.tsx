import { BrandLogos } from "@/components/BrandLogos";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col justify-center bg-gradient-to-br from-pitch via-pitch-dark to-gray-950 px-6 py-10">
      <div className="mx-auto w-full max-w-app animate-fade-in-up rounded-3xl bg-white p-7 shadow-2xl dark:bg-gray-900 sm:p-10 lg:max-w-md">
        <div className="mb-8 text-center">
          <BrandLogos />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Seagate Mundial 2026</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            El Mundial de Seagate. Predice, acierta y gana la gloria.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
