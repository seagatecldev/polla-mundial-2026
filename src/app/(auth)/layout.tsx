export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 py-10 lg:bg-gradient-to-br lg:from-pitch lg:via-pitch-dark lg:to-gray-950">
      <div className="mx-auto w-full max-w-app lg:max-w-md lg:rounded-3xl lg:bg-white lg:p-10 lg:shadow-2xl lg:dark:bg-gray-900">
        <div className="mb-8 text-center">
          <div className="text-5xl">🏆</div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Seagate Mundial 2026</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            El Mundial de Seagate. Predice, acierta y gana la gloria.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
