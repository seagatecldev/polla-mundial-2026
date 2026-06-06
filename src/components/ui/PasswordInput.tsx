"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./Input";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  error?: string;
};

/** Input de contraseña con botón para mostrar/ocultar el texto. */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  props,
  ref
) {
  const [show, setShow] = useState(false);
  return (
    <Input
      {...props}
      ref={ref}
      type={show ? "text" : "password"}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="rounded-lg p-1.5 text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-200"
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          tabIndex={-1}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      }
    />
  );
});
