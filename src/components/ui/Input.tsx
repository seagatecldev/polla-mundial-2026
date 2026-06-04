import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, className, id, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "w-full rounded-xl border bg-white px-3.5 py-2.5 text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-pitch dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500",
          error ? "border-flame focus:ring-flame" : "border-gray-300 dark:border-gray-700",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-flame">{error}</p>}
    </div>
  );
});
