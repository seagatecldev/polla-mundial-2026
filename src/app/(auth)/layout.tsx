export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="text-5xl">🏆</div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Seagate Mundial 2026</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          El Mundial de Seagate. Predice, acierta y gana la gloria.
        </p>
      </div>
      {children}
    </div>
  );
}
