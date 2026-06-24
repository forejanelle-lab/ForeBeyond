import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-charcoal"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border border-sage-dark bg-white px-4 py-2.5 text-charcoal placeholder:text-charcoal-light/60 transition-colors focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 disabled:cursor-not-allowed disabled:opacity-50 ${error ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""} ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-charcoal-light">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
